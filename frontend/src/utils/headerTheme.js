export function updateHeaderCSS(pathname) {
  const root = document.documentElement;

  if (pathname === "/") {
    // Landing page: letras brancas, logo clara
    root.style.setProperty("--header-bg", "white");
    root.style.setProperty("--header-color", "white"); // CORREÇÃO: branco
    root.style.setProperty("--underline-color", "white");
    root.style.setProperty("--logo-url", "url('/src/assets/logo192white.png')");
  } else if (pathname === "/shop") {
    // Shop: letras pretas, logo escura
    root.style.setProperty("--header-bg", "white");
    root.style.setProperty("--header-color", "black");
    root.style.setProperty("--underline-color", "black");
    root.style.setProperty("--logo-url", "url('/src/assets/logo192.png')");
  } else {
    // Dark mode padrão
    root.style.setProperty("--header-bg", "black");
    root.style.setProperty("--header-color", "white");
    root.style.setProperty("--underline-color", "white");
    root.style.setProperty("--logo-url", "url('/src/assets/logo192white.png')");
  }
}
