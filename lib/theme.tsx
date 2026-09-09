import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeColors = {
  bg: string;
  card: string;
  cardAlt: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  gradientFrom: string;
  gradientTo: string;
  income: string;
  expense: string;
  shadow: string;
};

const darkColors: ThemeColors = {
  bg: '#0A0D12',
  card: '#151A22',
  cardAlt: '#1C232E',
  border: '#242C39',
  text: '#F5F7FA',
  textMuted: '#8891A0',
  accent: '#6C8CFF',
  accentSoft: 'rgba(108,140,255,0.14)',
  gradientFrom: '#6C8CFF',
  gradientTo: '#3B5FE0',
  income: '#3DDC84',
  expense: '#FF6B6B',
  shadow: 'rgba(0,0,0,0.35)',
};

const lightColors: ThemeColors = {
  bg: '#F4F5F8',
  card: '#FFFFFF',
  cardAlt: '#F0F2F7',
  border: '#E7E9EF',
  text: '#12141A',
  textMuted: '#6B7280',
  accent: '#4F6BFF',
  accentSoft: 'rgba(79,107,255,0.10)',
  gradientFrom: '#5B7CFF',
  gradientTo: '#3B5FE0',
  income: '#17A65D',
  expense: '#E0453F',
  shadow: 'rgba(20,25,40,0.10)',
};

// Shared, reusable card shadow — spread this into a style array.
export const cardShadow = {
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 1,
  shadowRadius: 16,
  elevation: 4,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

type ThemeContextValue = {
  mode: 'dark' | 'light';
  colors: ThemeColors;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  colors: darkColors,
  toggle: () => {},
});

const STORAGE_KEY = 'finanziq_theme_mode';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val === 'light' || val === 'dark') setMode(val);
    });
  }, []);

  function toggle() {
    setMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }

  const colors = mode === 'dark' ? darkColors : lightColors;

  return <ThemeContext.Provider value={{ mode, colors, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
