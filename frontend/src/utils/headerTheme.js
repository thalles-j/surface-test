export function updateHeaderCSS(pathname, options = {}) {
  const root = document.documentElement;
  const isDark = root.getAttribute("data-theme") === "dark";
  const rootStyles = getComputedStyle(root);
  const heroMode = options.heroMode ?? pathname === "/";

  if (heroMode) {
    root.style.setProperty("--header-bg", "transparent");
    root.style.setProperty("--header-color", "#ffffff");
    root.style.setProperty("--underline-color", "#ffffff");
    root.style.setProperty("--logo-url", "url('/src/assets/logo192white.png')");
  } else {
    root.style.setProperty("--header-bg", rootStyles.getPropertyValue("--app-surface").trim());
    root.style.setProperty("--header-color", rootStyles.getPropertyValue("--app-text").trim());
    root.style.setProperty("--underline-color", rootStyles.getPropertyValue("--app-text").trim());
    root.style.setProperty(
      "--logo-url",
      isDark ? "url('/src/assets/logo192white.png')" : "url('/src/assets/logo192.png')"
    );
  }

  const searchInput = document.querySelector(".searchInput");
  if (searchInput) {
    const bg = getComputedStyle(root).getPropertyValue("--header-bg");
    const color = getComputedStyle(root).getPropertyValue("--header-color");
    searchInput.style.backgroundColor = bg;
    searchInput.style.color = color;
    searchInput.style.borderBottomColor = color;
  }
}
