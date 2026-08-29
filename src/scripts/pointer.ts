export function initCardTilt(selector = '[data-tilt]'): void {
  if (!matchMedia('(pointer: fine)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
    let raf = 0;
    let leaveTimer = 0;
    let px = 0.5;
    let py = 0.5;

    function apply() {
      raf = 0;
      el.style.setProperty('--rx', `${(0.5 - py) * 18}deg`);
      el.style.setProperty('--ry', `${(px - 0.5) * 18}deg`);
      el.style.setProperty('--mx', `${px * 100}%`);
      el.style.setProperty('--my', `${py * 100}%`);
    }

    function reset() {
      leaveTimer = 0;
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      el.classList.remove('is-tracking');
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
      el.style.setProperty('--mx', '50%');
      el.style.setProperty('--my', '50%');
    }

    function startTracking() {
      // A start right after a queued leave means the cursor never really
      // left (edge jitter); cancel the pending reset instead of letting
      // it fire and snap the tilt flat mid-hover.
      if (leaveTimer) {
        clearTimeout(leaveTimer);
        leaveTimer = 0;
      }
      el.classList.add('is-tracking');
    }

    // pointerenter (not just pointermove) so the lift/scale pop-in, now
    // driven by .is-tracking (see site.css), starts the instant the
    // pointer arrives, not just after the first move.
    el.addEventListener('pointerenter', startTracking);

    el.addEventListener('pointermove', (e) => {
      startTracking();
      const rect = el.getBoundingClientRect();
      px = (e.clientX - rect.left) / rect.width;
      py = (e.clientY - rect.top) / rect.height;
      if (!raf) raf = requestAnimationFrame(apply);
    });

    el.addEventListener('pointerleave', () => {
      // Debounce the reset so a leave/enter flicker at the card's edge
      // gets absorbed by the pointermove handler above instead of
      // triggering a visible flat-then-tilt-again stutter.
      leaveTimer = window.setTimeout(reset, 100);
    });
  });
}

export function initVideoPeek(selector = '[data-video-peek]'): void {
  if (!matchMedia('(pointer: fine)').matches) return;
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
