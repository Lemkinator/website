// Accepts a selector (document-wide, fine for always-server-rendered
// markup like .button-pill) or a concrete element list — callers with
// their own scoped set (e.g. gallery.ts's dots) must pass a list, since a
// document-wide selector would re-attach listeners onto every OTHER
// gallery's dots each time a new gallery inits.
export function initMagnetic(target: string | HTMLElement[]): void {
  if (!matchMedia('(pointer: fine)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const elements = typeof target === 'string' ? Array.from(document.querySelectorAll<HTMLElement>(target)) : target;

  elements.forEach(attach);
}

const STRENGTH = 0.35;
const MAX_OFFSET = 10; // px

function attach(el: HTMLElement): void {
  let raf = 0;
  let x = 0;
  let y = 0;

  function apply() {
    raf = 0;
    el.style.setProperty('--mag-x', `${x}px`);
    el.style.setProperty('--mag-y', `${y}px`);
  }

  el.addEventListener('pointermove', (e) => {
    const rect = el.getBoundingClientRect();
    x = clamp((e.clientX - (rect.left + rect.width / 2)) * STRENGTH, -MAX_OFFSET, MAX_OFFSET);
    y = clamp((e.clientY - (rect.top + rect.height / 2)) * STRENGTH, -MAX_OFFSET, MAX_OFFSET);
    if (!raf) raf = requestAnimationFrame(apply);
  });

  el.addEventListener('pointerleave', () => {
    x = 0;
    y = 0;
    if (!raf) raf = requestAnimationFrame(apply);
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
