'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Theme } from '@/lib/types/database';
import { mergeWithDefaults } from '@/lib/utils/theme';

interface ThemeContextValue {
  theme: Theme | null;
  setTheme: (theme: Theme | null) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: Theme | null;
}

export function ThemeProvider({ children, initialTheme = null }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme | null>(initialTheme);
  const [isLoading, setIsLoading] = useState(!initialTheme);

  useEffect(() => {
    if (initialTheme) {
      setThemeState(initialTheme);
      setIsLoading(false);
    }
  }, [initialTheme]);

  const setTheme = (newTheme: Theme | null) => {
    setThemeState(newTheme);
    setIsLoading(false);
  };

  // Get the merged theme with defaults
  const mergedTheme = theme ? mergeWithDefaults(theme) : null;

  return (
    <ThemeContext.Provider value={{ theme: mergedTheme, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }

  return context;
}
