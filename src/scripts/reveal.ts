// IntersectionObserver-driven, not CSS animation-timeline: view() — that
// shipped a real incident: animation-delay on a scroll-linked timeline is a
// % of the timeline's range, not a wait time, which pushed a staggered
// card's finish point past 100% and left it permanently invisible for some
// visitors.
//
// Progressive enhancement: elements are visible until this script arms
// them, so no-JS, a JS error, and no-IntersectionObserver-support all fail
// open to "visible", never "stuck invisible".
export function initReveal(selector = '[data-reveal]'): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;

  const elements = document.querySelectorAll<HTMLElement>(selector);
  if (!elements.length) return;

  elements.forEach((el) => el.classList.add('reveal-pending'));

  // Class order matters: .reveal-pending (hidden, no transition yet) -> two
  // rAFs later .reveal-armed (transition on, no value change yet) ->
  // intersection swaps to .reveal-visible, which is what actually animates.
  // Putting `transition` inside .reveal-pending itself was the original
  // bug — it's removed the instant .reveal-visible is added, and a CSS
  // transition only animates a change if `transition` is present on the
  // element AFTER the change, so it silently never animated.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      elements.forEach((el) => el.classList.add('reveal-armed'));

      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.remove('reveal-pending');
            entry.target.classList.add('reveal-visible');
            io.unobserve(entry.target);
          }
        },
        { threshold: 0.1, rootMargin: '0px 0px -10% 0px' },
      );

      elements.forEach((el) => io.observe(el));
    });
  });
}
