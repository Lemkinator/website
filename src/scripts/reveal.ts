// Scroll-in reveal for [data-reveal] elements, backing the CSS transition
// rules in motion.css. Deliberately IntersectionObserver, not CSS
// animation-timeline: view() — see the incident note in motion.css for why:
// the CSS-native version shipped elements that were permanently invisible
// and unclickable for some visitors, root-caused to animation-delay's range
// math on a non-monotonic timeline.
//
// Progressive enhancement, not hide-by-default: elements are plain visible
// until this script explicitly arms them (adds .reveal-pending), so no-JS,
// a JS error, and no-IntersectionObserver-support all fail open to "just
// visible" rather than "stuck invisible".
export function initReveal(selector = '[data-reveal]'): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;

  const elements = document.querySelectorAll<HTMLElement>(selector);
  if (!elements.length) return;

  // .reveal-pending sets the hidden position with no transition active yet,
  // so this jump doesn't itself animate.
  elements.forEach((el) => el.classList.add('reveal-pending'));

  // Two rAFs guarantee the .reveal-pending state has actually painted at
  // least once before anything else happens — matters both for the
  // .reveal-armed swap below (see motion.css) and because
  // IntersectionObserver fires its first callback for already-in-view
  // elements almost immediately, which would otherwise race the initial
  // paint entirely.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // Turns the transition on with no accompanying value change, so
      // enabling it doesn't animate anything either — only the later
      // pending -> visible swap does.
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
