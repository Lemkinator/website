import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// glob's default id is just the basename, which collides between the en/ and
// de/ subdirectories (both produce id "nakbuch") and silently drops one
// locale's entries. generateId keeps the locale segment so ids stay unique.
const generateId = ({ entry }: { entry: string }) => entry.replace(/\.(md|mdx)$/, '');

// Shared shape for the "banner + Play Store + screenshot gallery" app landing
// pages (apps/{geticon,nakbuch,oneurl,studiportal,sudoku}/index.html today).
const apps = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/apps', generateId }),
  schema: ({ image }) =>
    z.object({
      // Slug shared across locales so /apps/[slug] and its DE counterpart line up.
      slug: z.string(),
      name: z.string(),
      tagline: z.string(),
      date: z.coerce.date(),
      tags: z.array(z.string()).default([]),
      // Card thumbnail + corner glyph — path relative to this file, resolved
      // through src/assets so it gets the Image pipeline (AVIF + srcset).
      icon: image(),
      // Full-bleed banner backdrop — distinct from `icon`, which is the small
      // squircle used in cards and the app-page corner icon. Same image()
      // pipeline as icon (AVIF + srcset).
      bannerImage: image(),
      // Screen-reader description of bannerImage, since Banner renders it as a
      // CSS background (no native <img alt>). Also the per-image EU AI Act
      // Art. 50(4) disclosure for the AI-generated banner artwork.
      bannerImageAlt: z.string(),
      playStoreUrl: z.string().url().optional(),
      githubUrl: z.string().url().optional(),
      // Card badge, e.g. "7000 +" downloads or "400" installs — display text
      // only, not a real analytics figure.
      downloads: z.string().optional(),
      // Privacy policy fields — folds the 5 near-identical privacy-policy.html
      // pages into one PrivacyPolicyLayout.astro driven by this frontmatter.
      privacyPolicy: z
        .object({
          contactEmail: z.string().email(),
          lastUpdated: z.coerce.date(),
          // Sudoku is the one outlier with an extra Play Games account section.
          includesPlayGamesSection: z.boolean().default(false),
        })
        .optional(),
    }),
});

// FPV/cinematic video project pages (media/{2000,accelerate,light-utopia,
// ventimiglia,san-gottardo,cala-del-forte-ventimiglia}.html today).
const media = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/media', generateId }),
  schema: ({ image }) =>
    z.object({
      slug: z.string(),
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      tags: z.array(z.string()).default([]),
      // Card thumbnail (project grid on /media) — real photo, same image()
      // pipeline as apps.icon. Deliberately NOT the AI-generated banner: a
      // small grid thumbnail reads better as an actual photo of the flight.
      coverImage: image(),
      // Full-bleed detail-page Banner background — same split as
      // apps.icon vs apps.bannerImage.
      bannerImage: image(),
      // Screen-reader description of bannerImage (see apps.bannerImageAlt) —
      // also the EU AI Act Art. 50(4) disclosure for the AI-generated
      // banner artwork.
      bannerImageAlt: z.string(),
      // Card badge, e.g. "5000 +" views — display text only, not live analytics.
      views: z.string().optional(),
    }),
});

export const collections = { apps, media };
