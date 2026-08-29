// Must run before initReveal, which collects the [data-reveal] elements
// this creates. .section-gap marks a sub-section boundary meant to be
// recursed into via its own containerSelector entry, not swallowed into
// the parent's grouping here.
export function autoRevealSections(containerSelector = '.content'): void {
  document.querySelectorAll<HTMLElement>(containerSelector).forEach((container) => {
    let group: HTMLElement[] = [];

    function flush(): void {
      if (group.length === 0) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'reveal-block';
      wrapper.dataset.reveal = 'up';
      group[0].before(wrapper);
      group.forEach((el) => wrapper.appendChild(el));
      group = [];
    }

    for (const child of Array.from(container.children) as HTMLElement[]) {
      const isHeading = /^H[2-4]$/.test(child.tagName);
      const isManaged = child.hasAttribute('data-reveal') || child.classList.contains('section-gap');

      if (isHeading || isManaged) flush();
      if (isManaged) continue;

      group.push(child);
    }
    flush();
  });
}

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

      function reveal(el: Element): void {
        el.classList.remove('reveal-pending');
        el.classList.add('reveal-visible');
      }

      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            reveal(entry.target);
            io.unobserve(entry.target);
          }
        },
        { threshold: 0.1, rootMargin: '0px 0px -10% 0px' },
      );

      elements.forEach((el) => io.observe(el));

      // The -10% bottom rootMargin above can never be satisfied for content
      // flush at the very end of the document — there's nothing left to
      // scroll into that shrunk zone, so it'd otherwise stay reveal-pending
      // (invisible) forever. Once the page is scrolled as far as it goes,
      // force-reveal anything still pending instead of leaving it stuck.
      function revealIfAtBottom(): void {
        const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
        if (!atBottom) return;
        elements.forEach((el) => {
          if (!el.classList.contains('reveal-pending')) return;
          reveal(el);
          io.unobserve(el);
        });
      }

      window.addEventListener('scroll', revealIfAtBottom, { passive: true });
      window.addEventListener('resize', revealIfAtBottom);
      revealIfAtBottom();
    });
  });
}
