import { createContext, useEffect, useMemo, useState } from "react";

export const ThemeContext = createContext(null);

export const THEME_STORAGE_KEY = "surface_theme";
export const LIGHT_THEME = "light";
export const DARK_THEME = "dark";

function normalizeTheme(value) {
  return value === DARK_THEME ? DARK_THEME : LIGHT_THEME;
}

export function getSavedTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return normalizeTheme(saved);
  } catch {
    return LIGHT_THEME;
  }
}

export function applyThemeAttribute(theme) {
  const normalized = normalizeTheme(theme);
  document.documentElement.setAttribute("data-theme", normalized);
  return normalized;
}

export function setSavedTheme(theme) {
  const normalized = normalizeTheme(theme);
  localStorage.setItem(THEME_STORAGE_KEY, normalized);
  return normalized;
}

export function toggleThemeValue(theme) {
  const normalized = normalizeTheme(theme);
  return normalized === DARK_THEME ? LIGHT_THEME : DARK_THEME;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => getSavedTheme());

  useEffect(() => {
    setSavedTheme(theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === DARK_THEME,
      setTheme: (nextTheme) => setTheme(normalizeTheme(nextTheme)),
      toggleTheme: () => setTheme((current) => toggleThemeValue(current)),
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
