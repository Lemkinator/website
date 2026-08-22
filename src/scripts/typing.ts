// Typewriter effect for [data-typing] elements (see Banner.astro). Cycles
// type -> pause -> delete -> next string -> ... forever. A single-string
// element is left as its server-rendered text with just a blinking cursor
// (nothing to cycle to). No-ops entirely under reduced motion, in which
// case the server-rendered title text is simply what's shown.
const DEFAULT_TYPE_SPEED = 55;
const DELETE_SPEED = 30;
const DEFAULT_PAUSE_AFTER_TYPE = 1800;
const PAUSE_AFTER_DELETE = 400;
const JITTER = 20; // +/- ms per char, keeps typing from reading as machine-perfect
const TYPO_CHANCE = 0.35; // odds a given string gets one mistyped char along the way
const TYPO_NOTICE_PAUSE = 350; // beat before backspacing the mistyped char, like noticing it

// QWERTY neighbor keys, so a simulated typo lands on a plausible key instead of a random one.
const NEIGHBORS: Record<string, string> = {
  a: 's',
  b: 'vn',
  c: 'xv',
  d: 'sf',
  e: 'wr',
  f: 'dg',
  g: 'fh',
  h: 'gj',
  i: 'uo',
  j: 'hk',
  k: 'jl',
  l: 'k',
  m: 'n',
  n: 'bm',
  o: 'ip',
  p: 'o',
  q: 'w',
  r: 'et',
  s: 'ad',
  t: 'ry',
  u: 'yi',
  v: 'cb',
  w: 'qe',
  x: 'zc',
  y: 'tu',
  z: 'x',
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jitter(base: number): number {
  return Math.max(10, base + (Math.random() * 2 - 1) * JITTER);
}

function typoFor(char: string): string | undefined {
  const options = NEIGHBORS[char.toLowerCase()];
  return options?.[Math.floor(Math.random() * options.length)];
}

// Picks one mid-word index to mistype, or -1 for a clean pass. Skips spaces
// and the first/last two chars so the mistake reads as a slip, not a
// bookend, and skips chars with no mapped neighbor (digits, punctuation).
function pickTypoIndex(str: string): number {
  if (Math.random() >= TYPO_CHANCE) return -1;
  const eligible: number[] = [];
  for (let i = 2; i < str.length - 2; i++) {
    if (str[i] !== ' ' && typoFor(str[i])) eligible.push(i);
  }
  return eligible.length ? eligible[Math.floor(Math.random() * eligible.length)] : -1;
}

async function typeString(el: HTMLElement, str: string, typeSpeed: number): Promise<void> {
  const typoIndex = pickTypoIndex(str);
  let typed = '';
  for (let i = 0; i < str.length; i++) {
    if (i === typoIndex) {
      const wrong = typoFor(str[i]) as string;
      el.textContent = typed + wrong;
      await sleep(jitter(typeSpeed));
      await sleep(TYPO_NOTICE_PAUSE);
      el.textContent = typed;
      await sleep(jitter(DELETE_SPEED));
    }
    typed += str[i];
    el.textContent = typed;
    await sleep(jitter(typeSpeed));
  }
}

async function deleteString(el: HTMLElement, str: string, deleteSpeed: number): Promise<void> {
  for (let i = str.length; i > 0; i--) {
    el.textContent = str.slice(0, i - 1);
    await sleep(jitter(deleteSpeed));
  }
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

    // Optional per-banner overrides, set via Banner's typeSpeed/pauseAfterType props.
    const typeSpeed = Number(el.dataset.typeSpeed) || DEFAULT_TYPE_SPEED;
    const pauseAfterType = Number(el.dataset.pauseAfterType) || DEFAULT_PAUSE_AFTER_TYPE;

    el.textContent = '';

    async function loop(index: number): Promise<void> {
      const str = strings[index];
      el.classList.add('is-active-typing');
      await typeString(el, str, typeSpeed);
      el.classList.remove('is-active-typing');
      await sleep(pauseAfterType);
      el.classList.add('is-active-typing');
      await deleteString(el, str, DELETE_SPEED);
      el.classList.remove('is-active-typing');
      await sleep(PAUSE_AFTER_DELETE);
      loop((index + 1) % strings.length);
    }

    loop(0);
  });
}
