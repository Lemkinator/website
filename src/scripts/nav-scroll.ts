// Ties the mobile nav's hidden offset 1:1 to scroll position (not a binary
// threshold snap) so it visibly slides with the gesture: scroll down N px
// past the banner, nav moves up N px (clamped to its own height); scroll up
// and it comes back the same way. Only active at the same max-width:720px
// breakpoint as the burger menu itself — matchMedia is checked in JS since
// the inline transform this sets bypasses any CSS media-query gate.
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
    if (!e.matches) {
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
    { passive: true }
  );
}
