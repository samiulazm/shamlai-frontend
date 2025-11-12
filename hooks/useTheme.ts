import { useThemeContext } from '@/contexts/ThemeContext';
import type { Theme } from '@/lib/types/database';

/**
 * Hook to access theme data
 * Must be used within a ThemeProvider
 */
export function useTheme() {
  const context = useThemeContext();

  return {
    theme: context.theme,
    setTheme: context.setTheme,
    isLoading: context.isLoading,
    // Convenience accessors
    primaryColor: context.theme?.primary_color,
    secondaryColor: context.theme?.secondary_color,
    accentColor: context.theme?.accent_color,
    backgroundColor: context.theme?.background_color,
    textColor: context.theme?.text_color,
    headingFont: context.theme?.heading_font,
    bodyFont: context.theme?.body_font,
    headerStyle: context.theme?.header_style,
    footerStyle: context.theme?.footer_style,
    productCardStyle: context.theme?.product_card_style,
    customCSS: context.theme?.custom_css,
    customJS: context.theme?.custom_js
  };
}
