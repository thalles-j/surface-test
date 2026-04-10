import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "admin_theme_preference";
const DEFAULT_THEME = "dark";

function normalizeTheme(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "light" || normalized === "dark" ? normalized : DEFAULT_THEME;
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
    const normalizedTheme = normalizeTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, normalizedTheme);
    } catch {
      // ignore localStorage write issues (private mode/quota)
    }
    if (theme !== normalizedTheme) {
      setTheme(normalizedTheme);
    }
  }, [theme]);

  useEffect(() => {
    // Remove legado de classe global no body para evitar conflito com o container raiz do admin.
    document.body.classList.remove("admin-theme-dark", "admin-theme-light");
    delete document.body.dataset.adminTheme;
  }, []);

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
