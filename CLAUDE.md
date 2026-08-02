# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Personal website (`www.leonard-lemke.com`) — built with **Astro 7**, deployed to GitHub Pages via
GitHub Actions (`.github/workflows/deploy.yml`, `withastro/action`). Migrated from a plain
static HTML/jQuery site in 2026; see git history before that point for the old architecture.

Standard Astro workflow: `npm install`, `npm run dev` (dev server), `npm run build` (outputs
`dist/`), `npm run preview` (serve the build locally), `npx astro check` (type-check).

## i18n

- `defaultLocale: 'en'`, `routing.prefixDefaultLocale: false` (see `astro.config.mjs`) — English
  URLs are unprefixed (`/about`), German is under `/de/` (`/de/about`). **Do not change this**:
  giscus comments are keyed by `data-mapping="pathname"`, so changing a URL's shape detaches its
  existing comment thread.
- Every localized page has two files: `src/pages/<path>.astro` (EN) and
  `src/pages/de/<path>.astro` (DE). They're thin wrappers around the same components/content —
  keep both in sync when adding a page.
- UI chrome strings (nav, footer, buttons) live in `src/i18n/ui.ts`. Page/content prose lives in
  the content collections as separate per-locale files, not in `ui.ts`.

## Content collections (`src/content.config.ts`)

Three collections, each with `en/` and `de/` subdirectories under `src/content/<collection>/`:

- **`apps`** — the 5 Android app landing pages (geticon, nakbuch, oneurl, studiportal, sudoku).
  Frontmatter holds structured fields (`name`, `tagline`, `icon`, `bannerImage`, `playStoreUrl`,
  `downloads`, `privacyPolicy.*`); the MDX body holds the actual prose/screenshots/videos.
  `privacyPolicy` frontmatter drives `src/pages/apps/[slug]/privacy-policy.astro` — the 5
  privacy-policy pages are one template, not 5 separate files.
- **`labs`** — self-contained game/demo pages (out-run, space-invaders, click-me,
  windows-update). `windows-update` is the one exception: it's NOT rendered through
  `labs/[slug].astro` — it has its own fully standalone route
  (`src/pages/labs/windows-update.astro`, own `<html>`, no shared layout) because the legacy page
  was a full-viewport prank page with no nav/footer. `gpt.html` (the old OpenAI chat demo) was
  retired during the migration and has no collection entry.
- **`media`** — the 3 FPV/cinematic video projects (2000, accelerate, light-utopia).

All three collections use a `glob` loader with a custom `generateId` (see `content.config.ts`) —
**do not remove it**. Without it, `en/foo.mdx` and `de/foo.mdx` both get id `"foo"` and silently
collide (last one loaded wins), because the default id is just the basename.

## Design system

- `src/styles/tokens.css` — design tokens (colors via `light-dark()`, spacing, radii, shadows).
- `src/styles/site.css` — component styles targeting specific class names (`.card`,
  `.cards-wrapper`, `.navbar__*`, `.footer__*`, `.lButton`, `.mobile-image`, `.app-trailer`, ...).
  Follow this exact class-name convention when adding new markup that should pick up existing
  styles — it's a deliberate choice, not legacy debt.
- `src/components/Banner.astro` — the full-bleed photo + gradient scrim + overlaid title used on
  every page that has a "banner" (homepage, `/apps`, `/media`, every app/media detail page,
  `/apps/wsa`, `/about`). Don't hand-roll a new banner treatment; use this component.
- `src/components/Icon.astro` — self-hosted inline SVGs (Instagram, YouTube, X, LinkedIn, Play
  Store, TikTok, download, eye). Replaces the legacy Lineicons CDN font. Add new icons here
  rather than pulling in an icon font/CDN.
- `src/components/Gallery.astro` — CSS scroll-snap carousel, replaces the old Swiper 9 CDN
  dependency. Use this for any screenshot/image gallery.
- `outrun.css` / `space-invaders.css` under `src/styles/legacy/` are the *only* surviving legacy
  stylesheets — the games keep their own look by design; don't fold them into `site.css`.

## Known issue

`labs/out-run` hotlinks its sprites/audio from a CodePen S3 bucket
(`s3-us-west-2.amazonaws.com/s.cdpn.io/155629/...`) that now returns `AccessDenied` on every
object — the game is visually broken on production. Not caused by the migration; needs the
original assets sourced from somewhere before it can be fixed (see `public/js/out-run.js`).

## Deferred work

Screenshot/UI PNGs and JPGs (`public/images/apps/**`, `public/images/media/**`) are still served
as-is rather than through Astro's `<Image />` pipeline (AVIF/WebP + responsive `srcset`) — that
would require moving them from `public/` into `src/assets/` and converting every reference from a
string path to an ESM import, which touches nearly every page. Flagged as a separate follow-up,
not started.
