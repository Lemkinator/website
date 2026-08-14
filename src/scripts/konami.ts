// ↑↑↓↓←→←→ba toggles .max-motion on <html> — tokens.css turns up every
// animation duration and the scroll-reveal distance in response (see
// :root.max-motion there). Respects reduced motion: a visitor who's asked
// for less motion doesn't get more of it just by mistyping into a text
// field, even by an easter egg.
const CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

export function initKonami(): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let progress = 0;

  document.addEventListener('keydown', (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const expected = CODE[progress];

    if (key === expected) {
      progress += 1;
      if (progress === CODE.length) {
        progress = 0;
        const engaged = document.documentElement.classList.toggle('max-motion');
        console.log(
          `%c${engaged ? '⚡ max motion engaged' : 'back to normal'}`,
          'font-size:14px;font-weight:bold;color:#7d97ff',
        );
      }
      return;
    }

    progress = key === CODE[0] ? 1 : 0;
  });
}
