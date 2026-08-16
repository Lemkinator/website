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

Two collections, each with `en/` and `de/` subdirectories under `src/content/<collection>/`:

- **`apps`** — the 5 Android app landing pages (geticon, nakbuch, oneurl, studiportal, sudoku).
  Frontmatter holds structured fields (`name`, `tagline`, `icon`, `bannerImage`, `playStoreUrl`,
  `downloads`, `privacyPolicy.*`); the MDX body holds the actual prose/screenshots/videos.
  `privacyPolicy` frontmatter drives `src/pages/apps/[slug]/privacy-policy.astro` — the 5
  privacy-policy pages are one template, not 5 separate files.
- **`media`** — the 6 FPV/cinematic video projects (2000, accelerate, light-utopia, ventimiglia,
  san-gottardo, cala-del-forte-ventimiglia).

Both collections use a `glob` loader with a custom `generateId` (see `content.config.ts`) —
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

## Deferred work

Screenshot/UI PNGs and JPGs (`public/images/apps/**`, `public/images/media/**`) have been fully
migrated to Astro's `<Image />` pipeline (AVIF/WebP + responsive `srcset`) via `src/assets/` —
nothing raster remains served as-is from those paths. The `.mp4`/`.webm` gallery clips under the
same `public/images/apps/**` and `public/images/media/**` paths are still served as-is; Astro has
no equivalent optimization pipeline for video, so migrating those is a separate, not-yet-started
follow-up.
