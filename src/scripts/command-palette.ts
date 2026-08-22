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

  const items = Array.from(listEl.querySelectorAll<HTMLAnchorElement>('[data-command-item]'));

  function visibleItems(): HTMLAnchorElement[] {
    return items.filter((item) => !item.closest('li')?.hidden);
  }

  function filter(query: string): void {
    const q = query.trim().toLowerCase();
    let visibleCount = 0;
    for (const item of items) {
      const li = item.closest('li');
      const matches = !q || (item.textContent ?? '').toLowerCase().includes(q);
      if (li) li.hidden = !matches;
      if (matches) visibleCount++;
    }
    empty.hidden = visibleCount > 0;
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
