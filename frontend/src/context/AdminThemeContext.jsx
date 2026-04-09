import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "admin_theme_preference";
const DEFAULT_THEME = "dark";

function normalizeTheme(value) {
  return value === "light" || value === "dark" ? value : DEFAULT_THEME;
}

const AdminThemeContext = createContext({
  theme: "dark",
  isLight: false,
  isDark: true,
  toggleTheme: () => {},
  setTheme: () => {},
  isAdminThemeActive: false,
});

export function AdminThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return normalizeTheme(stored);
    } catch {
      return DEFAULT_THEME;
    }
  });

  useEffect(() => {
    const normalized = normalizeTheme(theme);
    localStorage.setItem(STORAGE_KEY, normalized);

    // Mantem uma unica fonte de verdade do tema ativo no documento.
    document.body.classList.remove("admin-theme-dark", "admin-theme-light");
    document.body.classList.add(`admin-theme-${normalized}`);
    document.body.dataset.adminTheme = normalized;

    if (theme !== normalized) {
      setTheme(normalized);
    }
  }, [theme]);

  const value = useMemo(
    () => ({
      theme: normalizeTheme(theme),
      isLight: normalizeTheme(theme) === "light",
      isDark: normalizeTheme(theme) === "dark",
      toggleTheme: () =>
        setTheme((prev) => (normalizeTheme(prev) === "dark" ? "light" : "dark")),
      setTheme: (nextTheme) => setTheme(normalizeTheme(nextTheme)),
      isAdminThemeActive: true,
    }),
    [theme]
  );

  return (
    <AdminThemeContext.Provider value={value}>{children}</AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  return useContext(AdminThemeContext);
}
