import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'zod';

// glob's default id is just the basename, which collides between the en/ and
// de/ subdirectories (both produce id "nakbuch") and silently drops one
// locale's entries. generateId keeps the locale segment so ids stay unique.
const generateId = ({ entry }: { entry: string }) => entry.replace(/\.(md|mdx)$/, '');

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
      icon: image(),
      // Distinct from icon (the small squircle glyph); this is the
      // full-bleed banner backdrop.
      bannerImage: image(),
      // Screen-reader description of bannerImage, since Banner renders it as a
      // CSS background (no native <img alt>). Also the per-image EU AI Act
      // Art. 50(4) disclosure for the AI-generated banner artwork.
      bannerImageAlt: z.string(),
      playStoreUrl: z.url().optional(),
      githubUrl: z.url().optional(),
      // Display text only (e.g. "7000 +"), not a live analytics figure.
      downloads: z.string().optional(),
      privacyPolicy: z
        .object({
          contactEmail: z.email(),
          lastUpdated: z.coerce.date(),
          // Sudoku is the one outlier with an extra Play Games account section.
          includesPlayGamesSection: z.boolean().default(false),
        })
        .optional(),
    }),
});

const media = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/media', generateId }),
  schema: ({ image }) =>
    z.object({
      slug: z.string(),
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      tags: z.array(z.string()).default([]),
      // Deliberately not the AI-generated banner: a small grid thumbnail
      // reads better as an actual flight photo.
      coverImage: image(),
      bannerImage: image(),
      // Screen-reader description of bannerImage (see apps.bannerImageAlt);
      // also the EU AI Act Art. 50(4) disclosure for the AI-generated
      // banner artwork.
      bannerImageAlt: z.string(),
      // Display text only, not a live analytics figure.
      views: z.string().optional(),
    }),
});

export const collections = { apps, media };
