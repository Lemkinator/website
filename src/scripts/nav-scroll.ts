// Checked via matchMedia in JS, not just left to a CSS breakpoint: the
// inline transform this sets would otherwise apply on desktop too, since
// an inline style bypasses any CSS media query.
const MOBILE_QUERY = '(max-width: 720px)';

export function initNavScroll(): void {
  const nav = document.querySelector<HTMLElement>('.navbar');
  if (!nav) return;

  const mobile = matchMedia(MOBILE_QUERY);

  const bannerBottom = () => {
    const banner = document.querySelector<HTMLElement>('.banner');
    return banner ? banner.getBoundingClientRect().bottom + window.scrollY : 0;
  };

  let threshold = bannerBottom();
  let hidden = 0;
  let lastY = window.scrollY;
  let ticking = false;

  function apply() {
    nav!.style.transform = hidden > 0 ? `translateY(-${hidden}px)` : '';
  }

  function onScroll() {
    if (!mobile.matches || ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      const delta = y - lastY;
      hidden = y <= threshold ? 0 : Math.min(Math.max(hidden + delta, 0), nav!.offsetHeight);
      apply();
      lastY = y;
      ticking = false;
    });
  }

  mobile.addEventListener('change', (e) => {
    if (e.matches) {
      // onScroll only tracks lastY while mobile.matches is true, so it's
      // stale from whenever mobile was last active; reset it now or the
      // first tick back in mobile computes a bogus delta against wherever
      // the page happened to be scrolled on desktop.
      lastY = window.scrollY;
    } else {
      hidden = 0;
      apply();
    }
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener(
    'resize',
    () => {
      threshold = bannerBottom();
    },
    { passive: true },
  );
}
