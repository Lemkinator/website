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

  elements.forEach((el) => el.classList.add('reveal-pending'));

  // IntersectionObserver fires its first callback for already-in-view
  // elements almost immediately — often before the browser has painted the
  // .reveal-pending state even once. Without a real "hidden" frame to
  // transition away from, the CSS transition has nothing to animate: the
  // element just appears at rest, looking like it never animated at all.
  // Two rAFs guarantee at least one paint has happened first.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
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
