'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, Check } from 'lucide-react';
import { locales, localeLabels, localeFlags, type Locale } from '@/i18n';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  variant?: 'button' | 'compact';
  className?: string;
}

export function LanguageSwitcher({
  variant = 'button',
  className,
}: LanguageSwitcherProps) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: Locale) => {
    if (newLocale === locale) return;

    // Remove current locale from pathname
    const segments = pathname.split('/');
    if (locales.includes(segments[1] as Locale)) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }

    const newPath = segments.join('/');
    router.push(newPath);
  };

  if (variant === 'compact') {
    return (
      <div className={cn('flex gap-2', className)}>
        {locales.map((loc) => (
          <Button
            key={loc}
            variant={locale === loc ? 'default' : 'outline'}
            size="sm"
            onClick={() => switchLocale(loc)}
            className={cn(
              'relative',
              locale === loc && 'ring-2 ring-blue-600 ring-offset-2'
            )}
          >
            <span className="mr-1">{localeFlags[loc]}</span>
            <span className="hidden sm:inline">{localeLabels[loc]}</span>
            <span className="sm:hidden">{loc.toUpperCase()}</span>
          </Button>
        ))}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn('gap-2', className)}>
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{localeLabels[locale]}</span>
          <span className="sm:hidden">{locale.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => switchLocale(loc)}
            className={cn(
              'flex items-center justify-between cursor-pointer',
              locale === loc && 'bg-blue-50'
            )}
          >
            <div className="flex items-center gap-2">
              <span>{localeFlags[loc]}</span>
              <span>{localeLabels[loc]}</span>
            </div>
            {locale === loc && <Check className="h-4 w-4 text-blue-600" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Inline toggle for mobile (2 languages only)
 */
export function LanguageToggle({ className }: { className?: string }) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const otherLocale = locale === 'en' ? 'bn' : 'en';

  const switchLocale = () => {
    const segments = pathname.split('/');
    if (locales.includes(segments[1] as Locale)) {
      segments[1] = otherLocale;
    } else {
      segments.splice(1, 0, otherLocale);
    }

    const newPath = segments.join('/');
    router.push(newPath);
  };

  return (
    <button
      onClick={switchLocale}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium',
        'hover:bg-gray-100 active:scale-95 transition-all touch-target',
        className
      )}
      aria-label={`Switch to ${localeLabels[otherLocale]}`}
    >
      <span>{localeFlags[otherLocale]}</span>
      <span>{localeLabels[otherLocale]}</span>
    </button>
  );
}
