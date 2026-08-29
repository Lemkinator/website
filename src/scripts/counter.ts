// Guards run before touching the DOM: if reduced motion is on or
// IntersectionObserver isn't supported, nothing is ever blanked to "0";
// the server-rendered number stays correct unless this script can
// guarantee completing the animation.
export function initCounters(selector = '[data-count-to]'): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;

  const elements = document.querySelectorAll<HTMLElement>(selector);
  if (!elements.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        io.unobserve(el);
        const target = Number(el.dataset.countTo);
        if (!Number.isFinite(target)) continue;
        el.textContent = '0';
        animateCount(el, target);
      }
    },
    { threshold: 0.5 },
  );

  elements.forEach((el) => io.observe(el));
}

function animateCount(el: HTMLElement, target: number): void {
  const duration = 1200;
  const start = performance.now();

  function tick(now: number) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - (1 - progress) ** 3;
    el.textContent = String(Math.round(target * eased));
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}
