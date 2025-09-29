export function updateHeaderCSS(pathname) {
  const root = document.documentElement;

  if (pathname === "/") {
    // Landing page: letras brancas, logo clara
    root.style.setProperty("--header-bg", "transparent");
    root.style.setProperty("--header-color", "white");
    root.style.setProperty("--underline-color", "white");
    root.style.setProperty("--logo-url", "url('/src/assets/logo192white.png')");
  } else {
    // Shop ou outras páginas: letras pretas, logo escura
    root.style.setProperty("--header-bg", "white");
    root.style.setProperty("--header-color", "black");
    root.style.setProperty("--underline-color", "black");
    root.style.setProperty("--logo-url", "url('/src/assets/logo192.png')");
  }

  // Atualiza cores do input de pesquisa se ele existir
  const searchInput = document.querySelector(".searchInput");
  if (searchInput) {
    const bg = getComputedStyle(root).getPropertyValue("--header-bg");
    const color = getComputedStyle(root).getPropertyValue("--header-color");
    searchInput.style.backgroundColor = bg;
    searchInput.style.color = color;
    searchInput.style.borderBottomColor = color;
  }
}
 