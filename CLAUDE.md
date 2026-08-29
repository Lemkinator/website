# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Personal website (`www.leonard-lemke.com`) — built with **Astro 7**, deployed to GitHub Pages via
GitHub Actions (`.github/workflows/deploy.yml`, `withastro/action`). Migrated from a plain
static HTML/jQuery site in 2026; see git history before that point for the old architecture.

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
- **`media`** — the FPV/cinematic video projects (2000, accelerate, light-utopia, ventimiglia,
  san-gottardo, cala-del-forte-ventimiglia, st-tropez, les-issambres).

Both collections use a `glob` loader with a custom `generateId` (see `content.config.ts`) —
**do not remove it**. Without it, `en/foo.mdx` and `de/foo.mdx` both get id `"foo"` and silently
collide (last one loaded wins), because the default id is just the basename.

## Design system

- `src/styles/tokens.css` — design tokens (colors via `light-dark()`, spacing, radii, shadows).
- `src/styles/site.css` — component styles targeting specific class names (`.card`,
  `.cards-wrapper`, `.navbar__*`, `.footer__*`, `.button-pill`, `.mobile-image`,
  `.video-embed--horizontal` / `.video-embed--vertical`, ...), kebab-case with BEM `__element` /
  `--modifier` throughout. Follow this exact class-name convention when adding new markup that
  should pick up existing styles.
Component-specific conventions live in `src/components/CLAUDE.md`.

## Banner artwork

The user generates every banner image themselves (via Google Flow/ImageFX) — Claude's job is
writing the prompt and wiring the resulting file in, never generating it.

Two prompt templates:

- **Abstract** (home, about, apps index/WSA, the 5 individual app banners, imprint, 404, `/media`
  index): `Abstract dark banner: <subject-relevant motif>, periwinkle-blue (#7d97ff) glow on
  near-black background, <2-3 word mood>. No text, no logos, no readable script/UI/branding.`
- **Photoreal** (every individual media project): `Abstract dark banner: <the actual scene from
  the footage — a chase shot behind a boat, a coastline of private-pool villas, be specific, not
  generic>, dissolving into glowing FPV drone light trails, periwinkle-blue (#7d97ff) glow blended
  with warm golden-hour light over <sea/water/coastline>. No text, no logos, no real landmarks.`

Both: full-bleed, edge-to-edge content — no padding/letterboxing/empty-background "sticker" look.
Keep the actual subject/detail inside x: 25%–75%, y: 30%–70% (`Banner.astro`'s full-bleed `cover`
crop clips outside that box on common viewports — mobile crops the sides, wide desktops crop
top/bottom).

If a generated image still comes back off-center, give it `Banner`'s `focalPosition` prop (e.g.
`focalPosition="center 20%"`) — this also swaps it to a narrow parallax swing centered on that
value instead of the default wide one (see `hasCustomFocal` in `Banner.astro`).

## Deferred work

Screenshot/UI PNGs and JPGs (`public/images/apps/**`, `public/images/media/**`) have been fully
migrated to Astro's `<Image />` pipeline (AVIF/WebP + responsive `srcset`) via `src/assets/` —
nothing raster remains served as-is from those paths. The `.mp4`/`.webm` gallery clips under the
same `public/images/apps/**` and `public/images/media/**` paths are still served as-is; Astro has
no equivalent optimization pipeline for video, so migrating those is a separate, not-yet-started
follow-up.
