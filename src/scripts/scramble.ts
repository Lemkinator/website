// Glyph-decode reveal for [data-scramble] containers (see SplitText.astro).
// Each animatable char has a `.split-text__real` (untouched) and a
// `.split-text__fx` overlay — this only ever writes to `.fx`, so the real
// text node is correct in the DOM for the whole animation, not just after
// it finishes. No-ops entirely under reduced motion, in which case the
// `.split-text__real` spans are simply what's shown (default opacity: 1).
const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*<>/\\+=~';

export function initScramble(root: ParentNode = document): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  root.querySelectorAll<HTMLElement>('[data-scramble]').forEach((container) => {
    const charEls = Array.from(container.querySelectorAll<HTMLElement>(':scope > .split-text__char'));
    const start = performance.now();

    charEls.forEach((charEl, i) => {
      const fx = charEl.querySelector<HTMLElement>('.split-text__fx');
      if (!fx) return;
      // Re-bound to a fresh const: TS narrowing on `fx` doesn't carry into
      // the nested `tick` closure declared below.
      const fxEl: HTMLElement = fx;

      const delay = i * 35;
      const duration = 380;

      function tick(now: number) {
        const elapsed = now - start - delay;
        if (elapsed < 0) {
          requestAnimationFrame(tick);
          return;
        }
        if (elapsed >= duration) {
          charEl.classList.remove('is-scrambling');
          return;
        }
        charEl.classList.add('is-scrambling');
        fxEl.textContent = CHARSET[(Math.random() * CHARSET.length) | 0];
        requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    });
  });
}
