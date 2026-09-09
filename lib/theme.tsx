import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeColors = {
  bg: string;
  card: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  income: string;
  expense: string;
};

const darkColors: ThemeColors = {
  bg: '#0B0F14',
  card: '#151B23',
  border: '#232B36',
  text: '#FFFFFF',
  textMuted: '#8A93A3',
  accent: '#4F8CFF',
  income: '#4ADE80',
  expense: '#FF6B6B',
};

const lightColors: ThemeColors = {
  bg: '#F5F6F8',
  card: '#FFFFFF',
  border: '#E4E7EC',
  text: '#111418',
  textMuted: '#6B7280',
  accent: '#4F8CFF',
  income: '#16A34A',
  expense: '#DC2626',
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
