// Glyph-decode reveal for [data-scramble] containers (see SplitText.astro).
// Each child span cycles through random glyphs before settling on its real
// character, staggered left to right. No-ops entirely under reduced motion,
// in which case SplitText's plain-text children are simply what's shown.
const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*<>/\\+=~';

export function initScramble(root: ParentNode = document): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  root.querySelectorAll<HTMLElement>('[data-scramble]').forEach((container) => {
    const chars = Array.from(container.querySelectorAll<HTMLElement>(':scope > span'));
    const originals = chars.map((el) => el.textContent ?? '');
    const start = performance.now();

    chars.forEach((el, i) => {
      const original = originals[i];
      if (!original.trim()) return; // leave whitespace spans alone

      const delay = i * 35;
      const duration = 380;

      function tick(now: number) {
        const elapsed = now - start - delay;
        if (elapsed < 0) {
          requestAnimationFrame(tick);
          return;
        }
        if (elapsed >= duration) {
          el.textContent = original;
          return;
        }
        el.textContent = CHARSET[(Math.random() * CHARSET.length) | 0];
        requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    });
  });
}
