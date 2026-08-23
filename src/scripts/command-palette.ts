// Native <dialog> handles focus-trap, Esc-to-close, and ::backdrop — not
// reimplemented here.
export function initCommandPalette(): void {
  const dialogEl = document.querySelector<HTMLDialogElement>('[data-command-palette]');
  const inputEl = document.querySelector<HTMLInputElement>('[data-command-input]');
  const listEl = document.querySelector<HTMLElement>('[data-command-list]');
  const emptyEl = document.querySelector<HTMLElement>('[data-command-empty]');
  if (!dialogEl || !inputEl || !listEl || !emptyEl) return;

  // Rebound to non-optional names: TS control-flow narrowing from the guard
  // above doesn't carry into the nested closures below, even though these
  // are const and never reassigned.
  const dialog = dialogEl;
  const input = inputEl;
  const empty = emptyEl;

  // listEl is narrowed non-null by the guard above, but (like dialog/input/
  // empty) that narrowing doesn't survive into the closures below.
  const list = listEl;
  const items = Array.from(list.querySelectorAll<HTMLAnchorElement>('[data-command-item]'));

  // Queries the live DOM rather than filtering the `items` snapshot: filter()
  // reorders <li>s by match score via appendChild, so the snapshot's order
  // would desync from what's visually on screen after any search.
  function visibleItems(): HTMLAnchorElement[] {
    return Array.from(list.querySelectorAll<HTMLAnchorElement>('[data-command-item]')).filter(
      (item) => !item.closest('li')?.hidden,
    );
  }

  // True if a and b are within edit distance 1 of each other (a single
  // substitution/insertion/deletion) — the "typo-tolerant" half of fuzzyScore.
  function isCloseMatch(a: string, b: string): boolean {
    if (Math.abs(a.length - b.length) > 1) return false;
    let i = 0;
    let j = 0;
    let edits = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) {
        i++;
        j++;
        continue;
      }
      if (++edits > 1) return false;
      if (a.length > b.length) i++;
      else if (a.length < b.length) j++;
      else {
        i++;
        j++;
      }
    }
    edits += a.length - i + (b.length - j);
    return edits <= 1;
  }

  // Lower is better; null means no match. Tries, in order: exact substring
  // (ranked by position), then an in-order subsequence match (ranked by how
  // spread out the letters are), then a single-typo match against some
  // equal-ish-length window of the text.
  function fuzzyScore(text: string, query: string): number | null {
    const t = text.toLowerCase();
    const q = query.toLowerCase();
    if (!q) return 0;

    const substringIndex = t.indexOf(q);
    if (substringIndex !== -1) return substringIndex;

    let cursor = 0;
    let gapScore = 1000;
    let matched = true;
    for (const ch of q) {
      const idx = t.indexOf(ch, cursor);
      if (idx === -1) {
        matched = false;
        break;
      }
      gapScore += idx - cursor;
      cursor = idx + 1;
    }
    if (matched) return gapScore;

    if (q.length >= 3) {
      for (let start = 0; start <= t.length - q.length + 1; start++) {
        for (const len of [q.length - 1, q.length, q.length + 1]) {
          const window = t.slice(start, start + len);
          if (window.length && isCloseMatch(window, q)) return 2000 + start;
        }
      }
    }

    return null;
  }

  function filter(query: string): void {
    const q = query.trim();

    if (!q) {
      for (const item of items) {
        const li = item.closest('li');
        if (li) li.hidden = false;
      }
      empty.hidden = true;
      return;
    }

    const scored = items
      .map((item) => ({ item, score: fuzzyScore(item.textContent ?? '', q) }))
      .filter((entry): entry is { item: HTMLAnchorElement; score: number } => entry.score !== null)
      .sort((a, b) => a.score - b.score);

    for (const item of items) {
      const li = item.closest('li');
      if (li) li.hidden = true;
    }

    for (const { item } of scored) {
      const li = item.closest('li');
      if (!li) continue;
      li.hidden = false;
      list.appendChild(li);
    }

    empty.hidden = scored.length > 0;
  }

  function open(): void {
    input.value = '';
    filter('');
    dialog.showModal();
    input.focus();
  }

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (dialog.open) dialog.close();
      else open();
    }
  });

  document.querySelectorAll<HTMLElement>('[data-command-trigger]').forEach((btn) => {
    btn.addEventListener('click', open);
  });

  input.addEventListener('input', () => filter(input.value));

  input.addEventListener('keydown', (e) => {
    const visible = visibleItems();
    if (!visible.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      visible[0].focus();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      visible[0].click();
    }
  });

  items.forEach((item) => {
    item.addEventListener('keydown', (e) => {
      const visible = visibleItems();
      const idx = visible.indexOf(item);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        visible[(idx + 1) % visible.length]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (idx <= 0) input.focus();
        else visible[idx - 1].focus();
      }
    });

    // Closes the dialog before navigating — with real (not SPA)
    // navigations, an open dialog would still be visible during the view-transition.
    item.addEventListener('click', () => dialog.close());
  });

  // e.target === dialog only matches clicks outside the content box
  // (::backdrop) — the box itself intercepts its own clicks.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
}
