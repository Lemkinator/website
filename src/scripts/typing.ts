const TYPE_SPEED = 55;
const DELETE_SPEED = 30;
const PAUSE_AFTER_TYPE = 1800;
const PAUSE_AFTER_DELETE = 400;

function typeString(el: HTMLElement, str: string, i: number, cb: () => void) {
  el.textContent = str.slice(0, i);
  if (i >= str.length) {
    setTimeout(cb, PAUSE_AFTER_TYPE);
    return;
  }
  setTimeout(() => typeString(el, str, i + 1, cb), TYPE_SPEED);
}

function deleteString(el: HTMLElement, str: string, i: number, cb: () => void) {
  el.textContent = str.slice(0, i);
  if (i <= 0) {
    setTimeout(cb, PAUSE_AFTER_DELETE);
    return;
  }
  setTimeout(() => deleteString(el, str, i - 1, cb), DELETE_SPEED);
}

export function initTyping(root: ParentNode = document): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  root.querySelectorAll<HTMLElement>('[data-typing]').forEach((el) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(el.dataset.typing ?? '[]');
    } catch {
      return;
    }
    if (!Array.isArray(parsed) || parsed.length === 0) return;
    const strings: string[] = parsed;

    el.classList.add('is-typing');
    if (strings.length === 1) return;

    let index = 0;
    el.textContent = '';

    function loop() {
      const str = strings[index];
      typeString(el, str, 0, () => {
        deleteString(el, str, str.length, () => {
          index = (index + 1) % strings.length;
          loop();
        });
      });
    }

    loop();
  });
}
