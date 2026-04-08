import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "admin_theme_preference";

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
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "dark";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      isLight: theme === "light",
      isDark: theme === "dark",
      toggleTheme: () => setTheme((prev) => (prev === "dark" ? "light" : "dark")),
      setTheme,
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
