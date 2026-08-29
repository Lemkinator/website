# src/components/CLAUDE.md

- `Banner.astro`: the full-bleed photo + gradient scrim + overlaid title used on every page that
  has a "banner" (homepage, `/apps`, `/media`, every app/media detail page, `/apps/wsa`, `/about`).
  Don't hand-roll a new banner treatment; use this component.
- `Icon.astro`: self-hosted inline SVGs (Instagram, YouTube, X, LinkedIn, Play Store, TikTok,
  download, eye). Replaces the legacy Lineicons CDN font. Add new icons here rather than pulling in
  an icon font/CDN.
- `Gallery.astro`: CSS scroll-snap carousel, replaces the old Swiper 9 CDN dependency. Use this for
  any screenshot/image gallery.
