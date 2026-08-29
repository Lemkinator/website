// Toggles .max-motion on <html> (see tokens.css). Respects reduced motion,
// since even an easter egg shouldn't add more motion for a visitor who's asked
// for less.
const CODE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
];

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
        // Dynamically imported so the confetti code never loads for
        // visitors who never type the code.
        if (engaged) import('@/scripts/confetti').then((mod) => mod.burstConfetti());
      }
      return;
    }

    progress = key === CODE[0] ? 1 : 0;
  });
}
