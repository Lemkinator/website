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
  schema: () =>
    z.object({
      // Slug shared across locales so /apps/[slug] and its DE counterpart line up.
      slug: z.string(),
      name: z.string(),
      tagline: z.string(),
      date: z.coerce.date(),
      tags: z.array(z.string()).default([]),
      icon: z.string(), // path under src/assets or public
      // Full-bleed banner backdrop (the legacy site's per-app "Vorstellungsgrafik"
      // presentation graphic) — distinct from `icon`, which is the small
      // squircle used in cards and the app-page corner icon.
      bannerImage: z.string(),
      playStoreUrl: z.string().url().optional(),
      githubUrl: z.string().url().optional(),
      // Card badge, e.g. "10000 +" downloads or "400" installs — display text
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

// FPV/cinematic video project pages (media/{2000,accelerate,light-utopia}.html today).
const media = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/media', generateId }),
  schema: () =>
    z.object({
      slug: z.string(),
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      tags: z.array(z.string()).default([]),
      coverImage: z.string(),
      // Card badge, e.g. "5000 +" views — display text only, not live analytics.
      views: z.string().optional(),
    }),
});

export const collections = { apps, media };
