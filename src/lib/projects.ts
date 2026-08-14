import { getCollection } from 'astro:content';
import { getRelativeLocaleUrl } from 'astro:i18n';
import type { Locale } from '@/i18n/ui';

export interface ProjectCard {
  href: string;
  bgImg: string;
  title: string;
  description: string;
  date: Date;
  dateLabel: string;
  interactionIcon: 'download' | 'eye';
  interactionText?: string;
  tags: string[];
  iconStyle: boolean;
}

// Merges the apps and media collections into one date-sorted list of Card
// props for the homepage's "All Projects" grid. Shared by index.astro and
// de/index.astro so both locales build the card shape from one place
// instead of two independently-maintained copies of this transform.
export async function getAllProjects(locale: Locale): Promise<ProjectCard[]> {
  const dateLocale = locale === 'de' ? 'de-DE' : 'en-US';

  const apps = await getCollection('apps', (entry) => entry.id.startsWith(`${locale}/`));
  const media = await getCollection('media', (entry) => entry.id.startsWith(`${locale}/`));

  const appCards = apps.map((app) => ({
    href: getRelativeLocaleUrl(locale, `/apps/${app.data.slug}`),
    bgImg: app.data.icon,
    title: app.data.name,
    description: app.data.tagline,
    date: app.data.date,
    dateLabel: app.data.date.toLocaleDateString(dateLocale, { month: 'short', year: 'numeric' }),
    interactionIcon: 'download' as const,
    interactionText: app.data.downloads,
    tags: app.data.tags,
    iconStyle: true,
  }));

  const mediaCards = media.map((project) => ({
    href: getRelativeLocaleUrl(locale, `/media/${project.data.slug}`),
    bgImg: project.data.coverImage,
    title: project.data.title,
    description: project.data.description,
    date: project.data.date,
    dateLabel: project.data.date.toLocaleDateString(dateLocale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    interactionIcon: 'eye' as const,
    interactionText: project.data.views,
    tags: project.data.tags,
    iconStyle: false,
  }));

  return [...appCards, ...mediaCards].sort((a, b) => b.date.valueOf() - a.date.valueOf());
}
