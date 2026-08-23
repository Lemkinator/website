import { getCollection } from 'astro:content';
import { getRelativeLocaleUrl } from 'astro:i18n';
import type { Locale } from '@/i18n/ui';

export interface ProjectCard {
  href: string;
  bgImg: ImageMetadata;
  title: string;
  description: string;
  date: Date;
  dateLabel: string;
  interactionIcon: 'download' | 'eye';
  interactionText?: string;
  tags: string[];
  icon?: ImageMetadata;
  // Namespaced by collection (proj-app-*/proj-media-*) since app and media
  // slugs aren't guaranteed disjoint.
  transitionName: string;
  previewVideo?: string;
  bgPosition?: string;
}

const MEDIA_PREVIEW_VIDEO: Partial<Record<string, string>> = {
  accelerate: '/media/accelerate/accelerate-3',
  'light-utopia': '/media/light-utopia/light-utopia-2',
  '2000': '/media/2000/2000-4',
  ventimiglia: '/media/ventimiglia/ventimiglia-1',
  'san-gottardo': '/media/san-gottardo/san-gottardo-1',
  'cala-del-forte-ventimiglia': '/media/cala-del-forte-ventimiglia/cala-del-forte-ventimiglia-1',
  'st-tropez': '/media/st-tropez/st-tropez-2',
  'les-issambres': '/media/les-issambres/les-issambres-1',
};

export const MEDIA_BANNER_FOCAL_POSITION: Partial<Record<string, string>> = {
  'st-tropez': 'center 20%',
};

const MEDIA_CARD_FOCAL_POSITION: Partial<Record<string, string>> = {
  'st-tropez': 'center 100%',
};

export async function getAppCards(locale: Locale): Promise<ProjectCard[]> {
  const dateLocale = locale === 'de' ? 'de-DE' : 'en-US';
  const apps = await getCollection('apps', (entry) => entry.id.startsWith(`${locale}/`));

  return apps
    .map((app) => ({
      href: getRelativeLocaleUrl(locale, `/apps/${app.data.slug}`),
      // Must stay app.data.bannerImage — the card->banner view-transition
      // depends on it being the same photo the detail page's Banner uses.
      bgImg: app.data.bannerImage,
      icon: app.data.icon,
      title: app.data.name,
      description: app.data.tagline,
      date: app.data.date,
      dateLabel: app.data.date.toLocaleDateString(dateLocale, { month: 'short', year: 'numeric' }),
      interactionIcon: 'download' as const,
      interactionText: app.data.downloads,
      tags: app.data.tags,
      transitionName: `proj-app-${app.data.slug}`,
    }))
    .sort((a, b) => b.date.valueOf() - a.date.valueOf());
}

export async function getMediaCards(locale: Locale): Promise<ProjectCard[]> {
  const dateLocale = locale === 'de' ? 'de-DE' : 'en-US';
  const media = await getCollection('media', (entry) => entry.id.startsWith(`${locale}/`));

  return media
    .map((project) => ({
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
      transitionName: `proj-media-${project.data.slug}`,
      previewVideo: MEDIA_PREVIEW_VIDEO[project.data.slug],
      bgPosition: MEDIA_CARD_FOCAL_POSITION[project.data.slug],
    }))
    .sort((a, b) => b.date.valueOf() - a.date.valueOf());
}

export async function getAllProjects(locale: Locale): Promise<ProjectCard[]> {
  const [appCards, mediaCards] = await Promise.all([getAppCards(locale), getMediaCards(locale)]);
  return [...appCards, ...mediaCards].sort((a, b) => b.date.valueOf() - a.date.valueOf());
}
