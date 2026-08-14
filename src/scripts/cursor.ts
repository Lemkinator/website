// Custom pointer: a small dot glued to the cursor plus a larger ring that
// trails behind it with easing, replacing the system cursor
// (mix-blend-mode: difference — see the .cursor-dot/.cursor-ring rules in
// motion.css). Desktop fine-pointer only and skipped under reduced motion —
// touch has no cursor to replace, and reduced-motion visitors don't want an
// extra element chasing their input.
//
// Progressive enhancement: motion.css only sets `cursor: none` once
// .custom-cursor is on <html>, added by this script AFTER both cursor
// elements exist below — so a JS error before that point never leaves a
// visitor with no cursor at all, just the plain system one.
export function initCursor(): void {
  if (!matchMedia('(pointer: fine)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  document.body.append(dot, ring);

  let targetX = 0;
  let targetY = 0;
  let ringX = 0;
  let ringY = 0;
  let raf = 0;
  let started = false;

  function tick() {
    ringX += (targetX - ringX) * 0.18;
    ringY += (targetY - ringY) * 0.18;
    dot.style.transform = `translate(${targetX}px, ${targetY}px)`;
    ring.style.transform = `translate(${ringX}px, ${ringY}px)`;

    // Settle instead of running forever: once the ring is close enough to
    // the (stationary) target, stop scheduling frames until the pointer
    // moves again.
    if (Math.abs(targetX - ringX) > 0.5 || Math.abs(targetY - ringY) > 0.5) {
      raf = requestAnimationFrame(tick);
    } else {
      raf = 0;
    }
  }

  document.addEventListener(
    'pointermove',
    (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!started) {
        started = true;
        ringX = targetX;
        ringY = targetY;
        dot.classList.add('cursor-dot--visible');
        ring.classList.add('cursor-ring--visible');
      }
      if (!raf) raf = requestAnimationFrame(tick);
    },
    { passive: true },
  );

  document.addEventListener('pointerleave', () => {
    dot.classList.remove('cursor-dot--visible');
    ring.classList.remove('cursor-ring--visible');
  });
  document.addEventListener('pointerenter', () => {
    if (started) {
      dot.classList.add('cursor-dot--visible');
      ring.classList.add('cursor-ring--visible');
    }
  });

  const HOVER_TARGETS = 'a, button, [role="button"], [data-tilt], .lButton, .gallery__dot';
  document.addEventListener('pointerover', (e) => {
    if ((e.target as HTMLElement).closest(HOVER_TARGETS)) ring.classList.add('cursor-ring--active');
  });
  document.addEventListener('pointerout', (e) => {
    if ((e.target as HTMLElement).closest(HOVER_TARGETS)) ring.classList.remove('cursor-ring--active');
  });

  document.documentElement.classList.add('custom-cursor');
}
