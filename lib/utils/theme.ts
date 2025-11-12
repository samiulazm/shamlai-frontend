// Theme utility functions
import type { Theme } from '../types/database';

/**
 * Convert theme object to CSS variables object
 */
export function themeToCSSVariables(theme: Theme | null): Record<string, string> {
  if (!theme) {
    return {};
  }

  const variables: Record<string, string> = {};

  // Color variables
  if (theme.primary_color) {
    variables['--theme-primary'] = theme.primary_color;
    // Generate hover color (10% darker)
    variables['--theme-primary-hover'] = darkenColor(theme.primary_color, 10);
  }

  if (theme.secondary_color) {
    variables['--theme-secondary'] = theme.secondary_color;
  }

  if (theme.accent_color) {
    variables['--theme-accent'] = theme.accent_color;
  }

  if (theme.background_color) {
    variables['--theme-background'] = theme.background_color;
  }

  if (theme.text_color) {
    variables['--theme-text'] = theme.text_color;
  }

  // Font variables
  if (theme.heading_font) {
    variables['--theme-heading-font'] = `'${theme.heading_font}', system-ui, sans-serif`;
  }

  if (theme.body_font) {
    variables['--theme-body-font'] = `'${theme.body_font}', system-ui, sans-serif`;
  }

  return variables;
}

/**
 * Generate Google Fonts URL for theme fonts
 */
export function getGoogleFontsURL(theme: Theme | null): string | null {
  if (!theme) return null;

  const fonts = new Set<string>();

  if (theme.heading_font && isGoogleFont(theme.heading_font)) {
    fonts.add(theme.heading_font);
  }

  if (theme.body_font && isGoogleFont(theme.body_font)) {
    fonts.add(theme.body_font);
  }

  if (fonts.size === 0) return null;

  // Build Google Fonts URL
  const fontFamilies = Array.from(fonts)
    .map(font => `family=${font.replace(/ /g, '+')}:wght@400;500;600;700`)
    .join('&');

  return `https://fonts.googleapis.com/css2?${fontFamilies}&display=swap`;
}

/**
 * Check if font is a Google Font
 */
function isGoogleFont(fontName: string): boolean {
  const googleFonts = [
    'Inter',
    'Manrope',
    'Poppins',
    'Roboto',
    'Open Sans',
    'Lato',
    'Montserrat',
    'Raleway',
    'Playfair Display',
    'Merriweather'
  ];

  return googleFonts.includes(fontName);
}

/**
 * Darken a hex color by a percentage
 */
function darkenColor(hex: string, percent: number): string {
  // Remove # if present
  hex = hex.replace('#', '');

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate darker values
  const factor = 1 - percent / 100;
  const newR = Math.round(r * factor);
  const newG = Math.round(g * factor);
  const newB = Math.round(b * factor);

  // Convert back to hex
  const toHex = (n: number) => {
    const hex = n.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

/**
 * Lighten a hex color by a percentage
 */
export function lightenColor(hex: string, percent: number): string {
  // Remove # if present
  hex = hex.replace('#', '');

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate lighter values
  const factor = percent / 100;
  const newR = Math.round(r + (255 - r) * factor);
  const newG = Math.round(g + (255 - g) * factor);
  const newB = Math.round(b + (255 - b) * factor);

  // Convert back to hex
  const toHex = (n: number) => {
    const hex = n.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

/**
 * Sanitize custom CSS to prevent XSS attacks
 * Removes potentially dangerous patterns
 */
export function sanitizeCSS(css: string): string {
  if (!css) return '';

  // Remove script tags and javascript: protocols
  let sanitized = css
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/expression\s*\(/gi, '')
    .replace(/@import/gi, '');

  return sanitized;
}

/**
 * Validate if a string is a valid hex color
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(color);
}

/**
 * Get default theme values
 */
export function getDefaultTheme(): Partial<Theme> {
  return {
    name: 'Default Theme',
    is_active: true,
    is_custom: false,
    primary_color: '#4F46E5',
    secondary_color: '#6B7280',
    accent_color: '#10B981',
    background_color: '#FFFFFF',
    text_color: '#111827',
    heading_font: 'Inter',
    body_font: 'Inter',
    header_style: 'standard',
    footer_style: 'standard',
    product_card_style: 'standard'
  };
}

/**
 * Merge theme with defaults
 */
export function mergeWithDefaults(theme: Theme | null): Theme {
  const defaults = getDefaultTheme();

  if (!theme) {
    return defaults as Theme;
  }

  return {
    ...defaults,
    ...theme
  } as Theme;
}

/**
 * Extract CSS variable name from theme property
 */
export function themePropertyToCSSVar(property: keyof Theme): string {
  const mapping: Record<string, string> = {
    primary_color: '--theme-primary',
    secondary_color: '--theme-secondary',
    accent_color: '--theme-accent',
    background_color: '--theme-background',
    text_color: '--theme-text',
    heading_font: '--theme-heading-font',
    body_font: '--theme-body-font'
  };

  return mapping[property] || `--theme-${property.replace(/_/g, '-')}`;
}
