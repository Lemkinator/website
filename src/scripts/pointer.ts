// Pointer-driven 3D tilt + cursor spotlight for [data-tilt] cards (see
// Card.astro and the .card rules in site.css). Skipped entirely on
// touch-only devices and under reduced motion — those users still get the
// plain CSS hover-lift, just no rotation/spotlight.
export function initCardTilt(selector = '[data-tilt]'): void {
  if (!matchMedia('(pointer: fine)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
    let raf = 0;
    let px = 0.5;
    let py = 0.5;

    function apply() {
      raf = 0;
      el.style.setProperty('--rx', `${(0.5 - py) * 10}deg`);
      el.style.setProperty('--ry', `${(px - 0.5) * 10}deg`);
      el.style.setProperty('--mx', `${px * 100}%`);
      el.style.setProperty('--my', `${py * 100}%`);
    }

    el.addEventListener('pointermove', (e) => {
      const rect = el.getBoundingClientRect();
      px = (e.clientX - rect.left) / rect.width;
      py = (e.clientY - rect.top) / rect.height;
      if (!raf) raf = requestAnimationFrame(apply);
    });

    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
      el.style.setProperty('--mx', '50%');
      el.style.setProperty('--my', '50%');
    });
  });
}

// Hover video-peek for media cards (see Card.astro's `previewVideo` prop).
// preload="none" on the <video>, so nothing fetches until a visitor
// actually hovers — cheap for everyone who doesn't.
export function initVideoPeek(selector = '[data-video-peek]'): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.querySelectorAll<HTMLElement>(selector).forEach((card) => {
    const video = card.querySelector('video');
    if (!video) return;

    card.addEventListener('pointerenter', () => {
      video.play().catch(() => {});
    });

    card.addEventListener('pointerleave', () => {
      video.pause();
      video.currentTime = 0;
    });
  });
}
