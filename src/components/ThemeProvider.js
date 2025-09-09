import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

/*
 ThemeProvider adds support for three modes: 'light' | 'dark' | 'auto'.
 It stores the chosen mode (NOT the resolved theme) in localStorage under 'orion-theme'.
 When set to 'auto', it follows the user's OS preference and updates live.
 It applies a data-theme attribute to <html> (document.documentElement) with the resolved theme.
*/

const STORAGE_KEY = 'orion-theme';

const ThemeContext = createContext({
  mode: 'auto',               // explicit user choice
  resolved: 'dark',           // actual theme applied (light or dark)
  setMode: () => {},          // function to change mode
});

export function ThemeProvider({ children }) {
  const prefQuery = useRef(null);
  const [mode, setMode] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    return saved || 'auto';
  });
  const [resolved, setResolved] = useState('dark');

  // Determine resolved theme whenever mode or system preference changes
  const computeResolved = useCallback((explicitMode) => {
    if (explicitMode === 'light' || explicitMode === 'dark') return explicitMode;
    // auto
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }, []);

  // Apply theme attribute
  useEffect(() => {
    const nextResolved = computeResolved(mode);
    setResolved(nextResolved);
    const root = document.documentElement;
    root.setAttribute('data-theme', nextResolved);
    root.style.colorScheme = nextResolved; // native form controls
  }, [mode, computeResolved]);

  // Listen to system changes when in auto
  useEffect(() => {
    if (mode !== 'auto') return;
    if (!window.matchMedia) return;
    prefQuery.current = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const nextResolved = computeResolved('auto');
      setResolved(nextResolved);
      document.documentElement.setAttribute('data-theme', nextResolved);
      document.documentElement.style.colorScheme = nextResolved;
    };
    prefQuery.current.addEventListener('change', handler);
    return () => prefQuery.current && prefQuery.current.removeEventListener('change', handler);
  }, [mode, computeResolved]);

  // Persist explicit mode (not resolved)
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, mode); } catch (_) {}
  }, [mode]);

  const setModeSafe = useCallback((next) => {
    setMode(next);
  }, []);

  const value = { mode, resolved, setMode: setModeSafe };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() { return useContext(ThemeContext); }
