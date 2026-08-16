// Carousel behavior for .gallery (see Gallery.astro): dot indicator,
// prev/next arrows, and wheel/drag scrolling on top of the native
// touch/trackpad swipe overflow-x:auto already provides. No autoplay —
// deliberately removed in favor of arrows (see git history): autoplay
// content that advances on its own is a known UX/accessibility anti-pattern
// (WCAG 2.2.2 requires a pause control past 5s of auto-advance) and users
// reliably miss slides that move before they've finished looking.
//
// Dots are the primary, always-reliable navigation — a click always
// resolves to a scrollIntoView() call, independent of wheel/drag input
// quirks on any particular device. Arrows, wheel, and drag are additive.
import { initMagnetic } from '@/scripts/magnetic';

export function initGallery(): void {
  document.querySelectorAll<HTMLElement>('.gallery').forEach((gallery) => {
    const track = gallery.querySelector<HTMLElement>('.gallery__track');
    if (!track) return;
    const slides = Array.from(track.children) as HTMLElement[];
    if (slides.length < 2) return; // nothing to page through

    // ---- Dot indicator ----
    // Localized via the `data-goto-label` template Gallery.astro renders
    // from src/i18n/ui.ts (see CLAUDE.md: UI chrome strings live there, not
    // hardcoded in scripts) — falls back to English if it's ever missing.
    const gotoLabel = gallery.dataset.gotoLabel ?? 'Go to slide {n} of {total}';
    const dotsEl = document.createElement('div');
    dotsEl.className = 'gallery__dots';
    const dots = slides.map((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'gallery__dot';
      dot.setAttribute(
        'aria-label',
        gotoLabel.replace('{n}', String(i + 1)).replace('{total}', String(slides.length)),
      );
      dot.addEventListener('click', () => goTo(i));
      dotsEl.appendChild(dot);
      return dot;
    });
    dots[0]?.classList.add('is-active');
    gallery.appendChild(dotsEl);
    initMagnetic(dots);

    // ---- Prev/next arrows ----
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

    // A slide may be a bare <video> or a wrapper containing one —
    // querySelector alone misses the bare case (it only searches descendants).
    function getSlideVideo(slideEl: HTMLElement): HTMLVideoElement | null {
      return slideEl instanceof HTMLVideoElement ? slideEl : slideEl.querySelector('video');
    }

    // ---- Keep the active dot in sync with whatever scrolled the track
    //      (wheel, drag, native touch swipe, or a dot click), and only ever
    //      play the video slide(s) actually on screen — the multi-video
    //      galleries (media/*.mdx) don't carry the `autoplay` attribute
    //      precisely so a gallery with several clips doesn't fetch/decode/
    //      play all of them concurrently regardless of which is visible. ----
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

    // ---- Wheel: only genuinely horizontal wheel/trackpad input (shift+wheel,
    //      two-finger horizontal swipe) drives the carousel. Plain vertical
    //      wheel motion is left alone so scrolling the page while the cursor
    //      happens to be over a gallery still scrolls the page — an earlier
    //      version redirected vertical wheel into horizontal scroll instead,
    //      which trapped the page scroll under any full-width gallery. ----
    track.addEventListener(
      'wheel',
      (e) => {
        if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
        // deltaX is only pixels in DOM_DELTA_PIXEL mode (0). Line mode (1)
        // and page mode (2) report tiny/large unitless counts instead —
        // scale those up to something that actually moves the track.
        const pixels = e.deltaMode === 0 ? e.deltaX : e.deltaX * 16;
        track.scrollLeft += pixels;
        e.preventDefault();
      },
      { passive: false },
    );

    // ---- Click-and-drag (mouse only; touch/pen keep native scrolling) ----
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
    // No pointerleave listener here: setPointerCapture (above) keeps
    // pointermove/pointerup targeting the track even once the cursor
    // physically leaves it, but pointerleave still fires regardless of
    // capture — ending the drag on it would freeze the gesture mid-drag
    // while the button is still held.
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
  });
}
