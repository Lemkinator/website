// Typewriter effect for [data-typing] elements (see Banner.astro). Cycles
// type -> pause -> delete -> next string -> ... forever. A single-string
// element just types once and leaves the cursor blinking (nothing to cycle
// to). No-ops entirely under reduced motion, in which case the
// server-rendered title text is simply what's shown.
const DEFAULT_TYPE_SPEED = 55;
const DELETE_SPEED = 30;
const DEFAULT_PAUSE_AFTER_TYPE = 1800;
const PAUSE_AFTER_DELETE = 400;
const JITTER = 40; // +/- ms per char, keeps typing from reading as machine-perfect
const TYPO_CHANCE = 0.7; // odds a given string gets at least one mistyped char
const EXTRA_TYPO_CHANCE = 0.4; // odds a long (18+ char) string gets a second, unrelated mistake
const OVERTYPE_CHANCE = 0.4; // odds the typo isn't noticed until one more correct char lands
const TYPO_NOTICE_MIN = 200; // widest randomized beat before backspacing a typo, like noticing it
const TYPO_NOTICE_MAX = 550;
const HESITATION_CHANCE = 0.18; // odds of a thinking-pause after finishing a word
const HESITATION_MIN = 120;
const HESITATION_MAX = 320;
const PAUSE_SPREAD = 0.3; // +/- fraction applied to the type/delete-cycle pauses

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

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// Wider proportional randomization for the long pauses between type/delete
// phases, so cycles don't all land on the same beat.
function humanizePause(base: number): number {
  return Math.max(50, base + (Math.random() * 2 - 1) * base * PAUSE_SPREAD);
}

// `Number(raw) || fallback` would treat an explicit override of 0 as
// missing — this only falls back when the attribute is absent or unparsable.
function numberOverride(raw: string | undefined, fallback: number): number {
  if (raw === undefined) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function typoFor(char: string): string | undefined {
  const options = NEIGHBORS[char.toLowerCase()];
  return options?.[Math.floor(Math.random() * options.length)];
}

// Picks the mid-word indices to mistype: one by default, sometimes a second
// unrelated one on longer strings. Skips spaces and the first/last two
// chars so mistakes read as slips, not bookends, and skips chars with no
// mapped neighbor (digits, punctuation).
function pickTypoIndices(str: string): number[] {
  const eligible: number[] = [];
  for (let i = 2; i < str.length - 2; i++) {
    if (str[i] !== ' ' && typoFor(str[i])) eligible.push(i);
  }
  if (!eligible.length || Math.random() >= TYPO_CHANCE) return [];

  const first = eligible[Math.floor(Math.random() * eligible.length)];
  const indices = [first];
  if (str.length >= 18 && Math.random() < EXTRA_TYPO_CHANCE) {
    const rest = eligible.filter((i) => Math.abs(i - first) > 3);
    if (rest.length) indices.push(rest[Math.floor(Math.random() * rest.length)]);
  }
  return indices.sort((a, b) => a - b);
}

async function typeString(el: HTMLElement, str: string, typeSpeed: number): Promise<void> {
  const typoIndices = pickTypoIndices(str);
  let typed = '';
  let i = 0;
  while (i < str.length) {
    const typoAt = typoIndices.indexOf(i);
    if (typoAt !== -1) {
      typoIndices.splice(typoAt, 1);

      const wrong = typoFor(str[i]) as string;
      typed += wrong;
      el.textContent = typed;
      await sleep(jitter(typeSpeed));

      // Sometimes another correct char goes down before the slip registers.
      const overtyped = i + 1 < str.length && Math.random() < OVERTYPE_CHANCE;
      if (overtyped) {
        typed += str[i + 1];
        el.textContent = typed;
        await sleep(jitter(typeSpeed));
      }

      await sleep(randomBetween(TYPO_NOTICE_MIN, TYPO_NOTICE_MAX));

      for (let b = 0; b < (overtyped ? 2 : 1); b++) {
        typed = typed.slice(0, -1);
        el.textContent = typed;
        await sleep(jitter(DELETE_SPEED));
      }
      continue; // retype str[i] correctly on the next pass
    }

    typed += str[i];
    el.textContent = typed;
    await sleep(jitter(typeSpeed));

    if (str[i] === ' ' && Math.random() < HESITATION_CHANCE) {
      await sleep(randomBetween(HESITATION_MIN, HESITATION_MAX));
    }
    i++;
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
    // Guards against duplicate concurrent loops on the same element — e.g. a
    // Vite HMR reload re-running this without a full page reload, which
    // otherwise stacks multiple loop()s that fight over the same classList
    // and leave the cursor reading as permanently solid.
    if (el.dataset.typingInit) return;
    el.dataset.typingInit = 'true';
    const strings: string[] = parsed;

    el.classList.add('is-typing');

    // Optional per-banner overrides, set via Banner's typeSpeed/pauseAfterType props.
    const typeSpeed = numberOverride(el.dataset.typeSpeed, DEFAULT_TYPE_SPEED);
    const pauseAfterType = numberOverride(el.dataset.pauseAfterType, DEFAULT_PAUSE_AFTER_TYPE);

    el.textContent = '';

    // Single string: types once, nothing to cycle to.
    if (strings.length === 1) {
      el.classList.add('is-active-typing');
      typeString(el, strings[0], typeSpeed).then(() => el.classList.remove('is-active-typing'));
      return;
    }

    async function loop(index: number): Promise<void> {
      const str = strings[index];
      el.classList.add('is-active-typing');
      await typeString(el, str, typeSpeed);
      el.classList.remove('is-active-typing');
      await sleep(humanizePause(pauseAfterType));
      el.classList.add('is-active-typing');
      await deleteString(el, str, DELETE_SPEED);
      el.classList.remove('is-active-typing');
      await sleep(humanizePause(PAUSE_AFTER_DELETE));
      loop((index + 1) % strings.length);
    }

    loop(0);
  });
}
