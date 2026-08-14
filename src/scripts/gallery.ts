// Cross-input scrolling for .gallery__track (see Gallery.astro). Native
// overflow-x:auto already handles touch swipe and trackpad two-finger
// scroll — this adds the two inputs it doesn't cover:
//  - a plain mouse wheel (vertical-only hardware) scrolling the gallery
//    horizontally while hovered, and
//  - click-and-drag with a mouse.
// Touch/pen pointers are left alone entirely so native touch scrolling
// (and momentum) keeps working exactly as before.
export function initGalleryScroll(selector = '.gallery__track'): void {
  document.querySelectorAll<HTMLElement>(selector).forEach((track) => {
    track.addEventListener(
      'wheel',
      (e) => {
        // A trackpad sending a horizontal component means the visitor is
        // already scrolling this axis natively — don't fight it.
        if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
        track.scrollLeft += e.deltaY;
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
      dragging = false;
      track.classList.remove('is-dragging');
    };

    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    track.addEventListener('pointerleave', endDrag);
  });
}
