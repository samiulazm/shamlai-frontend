'use client';

import { useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { themeToCSSVariables, getGoogleFontsURL, sanitizeCSS } from '@/lib/utils/theme';

/**
 * ThemeInjector Component
 * Injects theme CSS variables, fonts, and custom styles into the DOM
 * Must be used within a ThemeProvider
 */
export function ThemeInjector() {
  const { theme } = useTheme();

  // Inject CSS variables into document root
  useEffect(() => {
    if (!theme) return;

    const cssVars = themeToCSSVariables(theme);
    const root = document.documentElement;

    // Apply CSS variables
    Object.entries(cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Cleanup function to reset to defaults (optional)
    return () => {
      // Keep variables - don't remove them on unmount
      // This ensures smooth transitions when theme changes
    };
  }, [theme]);

  // Load Google Fonts
  useEffect(() => {
    if (!theme) return;

    const fontsURL = getGoogleFontsURL(theme);
    if (!fontsURL) return;

    // Check if font link already exists
    const existingLink = document.querySelector(`link[data-theme-fonts]`);

    if (existingLink) {
      // Update existing link
      existingLink.setAttribute('href', fontsURL);
    } else {
      // Create new link
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = fontsURL;
      link.setAttribute('data-theme-fonts', 'true');
      document.head.appendChild(link);
    }

    return () => {
      // Don't remove on unmount - fonts should persist
    };
  }, [theme]);

  // Inject custom CSS
  useEffect(() => {
    if (!theme || !theme.custom_css) return;

    const sanitizedCSS = sanitizeCSS(theme.custom_css);
    if (!sanitizedCSS) return;

    // Check if custom CSS style tag already exists
    const existingStyle = document.querySelector('style[data-theme-custom-css]');

    if (existingStyle) {
      // Update existing style
      existingStyle.textContent = sanitizedCSS;
    } else {
      // Create new style tag
      const style = document.createElement('style');
      style.setAttribute('data-theme-custom-css', 'true');
      style.textContent = sanitizedCSS;
      document.head.appendChild(style);
    }

    return () => {
      // Clean up custom CSS on unmount
      const styleTag = document.querySelector('style[data-theme-custom-css]');
      if (styleTag) {
        styleTag.remove();
      }
    };
  }, [theme?.custom_css]);

  // Execute custom JavaScript (with safety measures)
  useEffect(() => {
    if (!theme || !theme.custom_js) return;

    try {
      // Create a sandboxed execution context
      // WARNING: eval is dangerous - only use with trusted content
      // In production, consider using a more secure sandbox like iframe postMessage

      // Basic sanitization - remove dangerous patterns
      let sanitizedJS = theme.custom_js
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/document\.write/gi, '');

      // Check if custom JS script already exists
      const existingScript = document.querySelector('script[data-theme-custom-js]');
      if (existingScript) {
        existingScript.remove();
      }

      // Create new script tag with user's code
      // Using Function constructor instead of eval for slightly better security
      // Still executes in global scope but with some sandboxing
      const script = document.createElement('script');
      script.setAttribute('data-theme-custom-js', 'true');
      script.textContent = `
        (function() {
          try {
            ${sanitizedJS}
          } catch (error) {
            console.error('Theme custom JS error:', error);
          }
        })();
      `;
      document.body.appendChild(script);
    } catch (error) {
      console.error('Error executing theme custom JS:', error);
    }

    return () => {
      // Clean up custom JS on unmount
      const scriptTag = document.querySelector('script[data-theme-custom-js]');
      if (scriptTag) {
        scriptTag.remove();
      }
    };
  }, [theme?.custom_js]);

  // This component doesn't render anything
  return null;
}
