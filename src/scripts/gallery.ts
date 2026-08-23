// No autoplay: WCAG 2.2.2 requires a pause control past 5s of auto-advance,
// and auto-advancing content is a known accessibility anti-pattern — arrows
// and dots only.
import { initMagnetic } from '@/scripts/magnetic';

export function initGallery(): void {
  document.querySelectorAll<HTMLElement>('.gallery').forEach((gallery) => {
    const track = gallery.querySelector<HTMLElement>('.gallery__track');
    if (!track) return;
    const slides = Array.from(track.children) as HTMLElement[];
    if (slides.length === 0) return;

    // Signals gallery.ts actually ran: Gallery.astro ships the arrow
    // buttons disabled and the native scrollbar visible by default, so a
    // no-JS visitor still has a working scroll affordance.
    gallery.classList.add('is-ready');

    // A slide may be a bare <video> or a wrapper containing one —
    // querySelector alone misses the bare case (it only searches descendants).
    function getSlideVideo(slideEl: HTMLElement): HTMLVideoElement | null {
      return slideEl instanceof HTMLVideoElement ? slideEl : slideEl.querySelector('video');
    }

    if (slides.length < 2) {
      // Gallery.astro renders the arrows unconditionally (doesn't know
      // slide count at build time) — remove them when there's nothing to page through.
      gallery.querySelectorAll('.gallery__arrow').forEach((el) => el.remove());

      // Without this, a single-slide gallery's video (preload="none", no
      // autoplay attribute) never starts.
      const video = getSlideVideo(slides[0]);
      if (video) {
        new IntersectionObserver(
          (entries) => entries.forEach((e) => (e.isIntersecting ? video.play().catch(() => {}) : video.pause())),
          { root: track, threshold: 0 },
        ).observe(slides[0]);
      }
      return;
    }

    const gotoLabel = gallery.dataset.gotoLabel ?? 'Go to slide {n} of {total}';
    const dotsEl = document.createElement('div');
    dotsEl.className = 'gallery__dots';
    const dots = slides.map((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'gallery__dot';
      dot.setAttribute('aria-label', gotoLabel.replace('{n}', String(i + 1)).replace('{total}', String(slides.length)));
      dot.addEventListener('click', () => goTo(i));
      dotsEl.appendChild(dot);
      return dot;
    });
    dots[0]?.classList.add('is-active');
    gallery.appendChild(dotsEl);
    initMagnetic(dots);

    const prevBtn = gallery.querySelector<HTMLButtonElement>('.gallery__arrow--prev');
    const nextBtn = gallery.querySelector<HTMLButtonElement>('.gallery__arrow--next');

    let active = 0;
    function setActiveDot(i: number) {
      if (i === active) return;
      active = i;
      dots.forEach((d, idx) => d.classList.toggle('is-active', idx === i));
      updateArrows();
    }
    function updateArrows() {
      if (prevBtn) prevBtn.disabled = active === 0;
      if (nextBtn) nextBtn.disabled = active === slides.length - 1;
    }
    function goTo(i: number) {
      slides[i].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }

    prevBtn?.addEventListener('click', () => goTo(Math.max(0, active - 1)));
    nextBtn?.addEventListener('click', () => goTo(Math.min(slides.length - 1, active + 1)));
    updateArrows();

    // Also drives which slide's video plays: multi-clip galleries never
    // carry the autoplay attribute, so only the on-screen slide(s) actually decode/play.
    const ratios = new Map<HTMLElement, number>();
    const activeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          ratios.set(entry.target as HTMLElement, entry.intersectionRatio);
          const video = getSlideVideo(entry.target as HTMLElement);
          if (!video) return;
          if (entry.isIntersecting) video.play().catch(() => {});
          else video.pause();
        });
        let bestSlide: HTMLElement | undefined;
        let bestRatio = 0;
        ratios.forEach((ratio, slide) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestSlide = slide;
          }
        });
        if (bestSlide) setActiveDot(slides.indexOf(bestSlide));
      },
      { root: track, threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    slides.forEach((s) => activeObserver.observe(s));

    // Only horizontal wheel/trackpad input drives the carousel — redirecting
    // vertical wheel too traps page scroll under any full-width gallery.
    track.addEventListener(
      'wheel',
      (e) => {
        if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
        // deltaX is only pixels in DOM_DELTA_PIXEL mode (0); line/page modes
        // (1/2) report small/large unitless counts that need scaling.
        const pixels = e.deltaMode === 0 ? e.deltaX : e.deltaX * 16;
        track.scrollLeft += pixels;
        e.preventDefault();
      },
      { passive: false },
    );

    let dragging = false;
    let startX = 0;
    let startScroll = 0;

    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return;
      dragging = true;
      startX = e.clientX;
      startScroll = track.scrollLeft;
      track.classList.add('is-dragging');
      track.setPointerCapture(e.pointerId);
    });

    track.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      track.scrollLeft = startScroll - (e.clientX - startX);
    });

    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      track.classList.remove('is-dragging');
    };
    // No pointerleave listener: setPointerCapture keeps pointermove/pointerup
    // targeting the track past the cursor leaving it, but pointerleave still
    // fires anyway — handling it here would freeze the gesture mid-drag
    // while the button is still held.
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
  });
}
