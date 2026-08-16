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
  iconStyle: boolean;
  // Shared-element name for the card->detail-page view-transition morph
  // (see Card.astro / Banner.astro). Namespaced by collection since app and
  // media slugs aren't guaranteed disjoint.
  transitionName: string;
  // Base path (no extension) of a hover preview clip — see Card.astro's
  // `previewVideo` prop. Media cards only, and only where footage exists.
  previewVideo?: string;
}

// Not every media project has usable preview footage — this is a lookup,
// not a schema field, since it's a display nicety rather than content. Base
// path only; Card.astro appends .webm/.mp4.
const MEDIA_PREVIEW_VIDEO: Partial<Record<string, string>> = {
  accelerate: '/images/media/accelerate/accelerate3',
  'light-utopia': '/images/media/light-utopia/light_utopia2',
  '2000': '/images/media/2000/2000_4',
};

// Card props for the apps listing (/apps, /de/apps). Shared with
// getAllProjects so the homepage and the dedicated listing pages build the
// card shape from one place instead of independently-maintained copies.
export async function getAppCards(locale: Locale): Promise<ProjectCard[]> {
  const dateLocale = locale === 'de' ? 'de-DE' : 'en-US';
  const apps = await getCollection('apps', (entry) => entry.id.startsWith(`${locale}/`));

  return apps
    .map((app) => ({
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
      transitionName: `proj-app-${app.data.slug}`,
    }))
    .sort((a, b) => b.date.valueOf() - a.date.valueOf());
}

// Card props for the media listing (/media, /de/media). See getAppCards.
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
      iconStyle: false,
      transitionName: `proj-media-${project.data.slug}`,
      previewVideo: MEDIA_PREVIEW_VIDEO[project.data.slug],
    }))
    .sort((a, b) => b.date.valueOf() - a.date.valueOf());
}

// Merges apps + media into one date-sorted list for the homepage's
// "All Projects" grid.
export async function getAllProjects(locale: Locale): Promise<ProjectCard[]> {
  const [appCards, mediaCards] = await Promise.all([getAppCards(locale), getMediaCards(locale)]);
  return [...appCards, ...mediaCards].sort((a, b) => b.date.valueOf() - a.date.valueOf());
}
