// Carousel behavior for .gallery (see Gallery.astro): dot navigation,
// autoplay, and wheel/drag scrolling on top of the native touch/trackpad
// swipe overflow-x:auto already provides.
//
// Dots are the primary, always-reliable navigation — a click always
// resolves to a scrollIntoView() call, independent of wheel/drag input
// quirks on any particular device. Wheel and drag are additive.
const AUTOPLAY_DELAY = 4000;

export function initGallery(): void {
  document.querySelectorAll<HTMLElement>('.gallery').forEach((gallery) => {
    const track = gallery.querySelector<HTMLElement>('.gallery__track');
    if (!track) return;
    const slides = Array.from(track.children) as HTMLElement[];
    if (slides.length < 2) return; // nothing to page through

    // ---- Dot indicator ----
    const dotsEl = document.createElement('div');
    dotsEl.className = 'gallery__dots';
    const dots = slides.map((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'gallery__dot';
      dot.setAttribute('aria-label', `Go to slide ${i + 1} of ${slides.length}`);
      dot.addEventListener('click', () => {
        goTo(i);
        userInteracted();
      });
      dotsEl.appendChild(dot);
      return dot;
    });
    dots[0]?.classList.add('is-active');
    gallery.appendChild(dotsEl);

    let active = 0;
    function setActiveDot(i: number) {
      if (i === active) return;
      active = i;
      dots.forEach((d, idx) => d.classList.toggle('is-active', idx === i));
    }
    function goTo(i: number) {
      slides[i].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }

    // ---- Keep the active dot in sync with whatever scrolled the track
    //      (wheel, drag, native touch swipe, or a dot click) ----
    const ratios = new Map<HTMLElement, number>();
    const activeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => ratios.set(entry.target as HTMLElement, entry.intersectionRatio));
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

    // ---- Wheel: let vertical wheel motion drive horizontal scroll ----
    track.addEventListener(
      'wheel',
      (e) => {
        if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
        track.scrollLeft += e.deltaY;
        e.preventDefault();
        userInteracted();
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
      userInteracted();
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
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    track.addEventListener('pointerleave', endDrag);
    track.addEventListener('touchstart', userInteracted, { passive: true });

    // ---- Autoplay: advances every few seconds, pauses on any interaction
    //      and while the gallery is scrolled off-screen, skipped entirely
    //      under reduced motion. ----
    let autoplayTimer = 0;
    let inView = false;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

    function scheduleAutoplay() {
      window.clearTimeout(autoplayTimer);
      if (reducedMotion || !inView) return;
      autoplayTimer = window.setTimeout(() => {
        goTo((active + 1) % slides.length);
        scheduleAutoplay();
      }, AUTOPLAY_DELAY);
    }

    function userInteracted() {
      scheduleAutoplay();
    }

    if (!reducedMotion) {
      new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        if (inView) scheduleAutoplay();
        else window.clearTimeout(autoplayTimer);
      }, {
        threshold: 0.3,
      }).observe(gallery);
    }
  });
}
