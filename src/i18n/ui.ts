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
    'card.viewProject': 'View project',
    'card.download': 'Download',
    'privacy.title': 'Privacy Policy',
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
    'card.viewProject': 'Projekt ansehen',
    'card.download': 'Herunterladen',
    'privacy.title': 'Datenschutzerklärung',
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
