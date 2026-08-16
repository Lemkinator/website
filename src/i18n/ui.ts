// UI chrome strings only (nav, footer, buttons). Page/content prose lives in
// the content collections as per-locale Markdown, not here.

export const locales = ['en', 'de'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const ui = {
  en: {
    'nav.home': 'Home',
    'nav.apps': 'Apps',
    'nav.media': 'Media',
    'nav.about': 'About',
    'nav.lang': 'DE',
    'footer.rights': 'All rights reserved.',
    'footer.imprint': 'Imprint',
    'footer.contactMe': 'Contact Me',
    'footer.contact': 'Contact',
    'footer.support': 'Support',
    'footer.firstMeeting': 'First Meeting',
    'footer.links': 'Links',
    'footer.sourceCode': 'Website Source Code',
    'footer.aiContentNotice': 'Artwork on this site was created with AI.',
    'card.viewProject': 'View project',
    'card.download': 'Download',
    'gallery.goToSlide': 'Go to slide {n} of {total}',
    'privacy.title': 'Privacy Policy',
    'privacy.lastUpdated': 'This statement was last updated on {date}.',
    'home.mediaTagline': 'Cinematic / Freestyle FPV',
    'command.trigger': 'Search',
    'command.placeholder': 'Jump to a page or project…',
    'command.empty': 'No matches',
    'command.switchLang': 'Switch to Deutsch',
  },
  de: {
    'nav.home': 'Start',
    'nav.apps': 'Apps',
    'nav.media': 'Medien',
    'nav.about': 'Über mich',
    'nav.lang': 'EN',
    'footer.rights': 'Alle Rechte vorbehalten.',
    'footer.imprint': 'Impressum',
    'footer.contactMe': 'Kontaktier mich',
    'footer.contact': 'Kontakt',
    'footer.support': 'Support',
    'footer.firstMeeting': 'Erstgespräch',
    'footer.links': 'Links',
    'footer.sourceCode': 'Website Source Code',
    'footer.aiContentNotice': 'Grafiken auf dieser Website wurden mit KI erstellt.',
    'card.viewProject': 'Projekt ansehen',
    'card.download': 'Herunterladen',
    'gallery.goToSlide': 'Zu Bild {n} von {total} wechseln',
    'privacy.title': 'Datenschutzerklärung',
    'privacy.lastUpdated': 'Diese Aussage wurde zuletzt am {date} aktualisiert.',
    'home.mediaTagline': 'Kinematisch / Freestyle FPV',
    'command.trigger': 'Suche',
    'command.placeholder': 'Springe zu einer Seite oder einem Projekt…',
    'command.empty': 'Keine Treffer',
    'command.switchLang': 'Auf Englisch wechseln',
  },
} as const;

// Locale-varying hrefs that aren't simple label translations (the Calendly
// booking link differs per locale, not just its anchor text).
export const footerLinks = {
  en: {
    firstMeeting: 'https://calendly.com/leonard-lemke/first-meeting',
  },
  de: {
    firstMeeting: 'https://calendly.com/leonard-lemke/erstgesprach',
  },
} as const;

export function useTranslations(locale: Locale) {
  return function t(key: keyof (typeof ui)['en']): string {
    return ui[locale][key] ?? ui[defaultLocale][key];
  };
}

// Strips the current locale's URL prefix (e.g. "/de/about" -> "/about"),
// so callers can rebuild an alternate-locale URL via getRelativeLocaleUrl.
// Shared by Seo.astro (hreflang tags) and LangToggle.astro (the visible
// language switcher) — they must agree on this path or the two disagree
// about where the "other language" version of the current page lives.
export function getLocaleAgnosticPath(locale: Locale, pathname: string): string {
  return locale === defaultLocale ? pathname : pathname.replace(new RegExp(`^/${locale}`), '') || '/';
}
