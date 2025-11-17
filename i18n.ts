import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

// Supported locales
export const locales = ['en', 'bn'] as const;
export type Locale = (typeof locales)[number];

// Default locale
export const defaultLocale: Locale = 'en';

// Locale labels for UI
export const localeLabels: Record<Locale, string> = {
  en: 'English',
  bn: 'বাংলা',
};

// Locale flags/icons
export const localeFlags: Record<Locale, string> = {
  en: '🇬🇧',
  bn: '🇧🇩',
};

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  return {
    messages: (await import(`./messages/${locale}.json`)).default,
    // Optional: Configure time zone
    timeZone: 'Asia/Dhaka',
    // Optional: Configure number formatting
    now: new Date(),
  };
});
