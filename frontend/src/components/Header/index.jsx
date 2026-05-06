import { useCallback, useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { FaSearch, FaCheck, FaShoppingCart, FaUserCircle, FaBars, FaTimes } from "react-icons/fa";
import styles from "./style.module.css";
import { updateHeaderCSS } from "../../utils/headerTheme";
import useAuth from "../../hooks/useAuth";
import { useCart } from "../../context/CartContext";

export default function Header() {
  const location = useLocation();
  const auth = useAuth(); // Hook de autenticação
  const { toggleCart } = useCart();
  const isHome = location.pathname === "/";

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [heroMode, setHeroMode] = useState(isHome);

  // --- LÓGICA DE NAVEGAÇÃO DO USUÁRIO ---
  // Define para onde o ícone de usuário deve levar
  let linkDestino = "/entrar";
  let tituloLink = "Ir para login";
  const estaLogado = auth.signed && auth.user;

  if (estaLogado) {
    if (Number(auth.user.role) === 1) {
      linkDestino = "/admin";
      tituloLink = "Painel de Admin";
    } else {
      linkDestino = "/account";
      tituloLink = "Minha Conta";
    }
  }
  // ---------------------------------------

  const syncHeaderTheme = useCallback(
    (overrides = {}) => {
      const nextMenuOpen = overrides.menuOpen ?? menuOpen;
      const nextSearchOpen = overrides.searchOpen ?? searchOpen;
      const shouldUseHeroMode =
        isHome &&
        !nextMenuOpen &&
        !nextSearchOpen &&
        window.scrollY < 32;

      setHeroMode(shouldUseHeroMode);
      updateHeaderCSS(location.pathname, { heroMode: shouldUseHeroMode });
    },
    [isHome, location.pathname, menuOpen, searchOpen]
  );

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    syncHeaderTheme();

    if (!isHome) {
      return undefined;
    }

    window.addEventListener("scroll", syncHeaderTheme, { passive: true });

    return () => window.removeEventListener("scroll", syncHeaderTheme);
  }, [isHome, syncHeaderTheme]);

  const isActiveRoute = (route) => {
    const path = location.pathname || "/";
    if (!route) return false;
    // Do not mark Home as active
    if (route === "/") return false;
    if (path === route) return true;
    if (path.startsWith(route + "/")) return true;
    return false;
  };

  useEffect(() => {
    const handleResize = () => {
      const menuButton = document.querySelector(`.${styles.menuToggleWrapper}`);
        if (menuButton) {
          const isHidden = window.getComputedStyle(menuButton).display === "none";
          if (isHidden && menuOpen) {
            setMenuOpen(false);
            syncHeaderTheme({ menuOpen: false });
          }
        }
      };
      window.addEventListener("resize", handleResize);
      handleResize();
      return () => window.removeEventListener("resize", handleResize);
  }, [menuOpen, syncHeaderTheme]);

  return (
    <header className={`${styles.header} ${heroMode ? styles.heroHeader : ""}`}>
      <div className={styles.navbarWrapper}>
        <div className={styles.nav}>
          {/* MENU DESKTOP */}
          <div className={styles.centeredMenu}>
            <ul className={styles.noBreak}>
              <li><Link to="/" title="Ir para Home">Home</Link></li>
              <li className={isActiveRoute("/shop") ? styles.active : ""}><Link to="/shop" title="Ir para Shop">Shop</Link></li>
              <li className={isActiveRoute("/community") ? styles.active : ""}><Link to="/community" title="Ir para Community">Community</Link></li>
              <li className={isActiveRoute("/sale") ? styles.active : ""}><Link to="/sale" title="Ir para Sale">Sale</Link></li>
              <li className={isActiveRoute("/about-us") ? styles.active : ""}><Link to="/about-us" title="Ir para Sobre nós">About Us</Link></li>
            </ul>
          </div>

          {/* LOGO */}
          <div className={styles.logoWrapper} title="Logo Surface">
            <Link to="/" title="Voltar para Home">
              <img
                src={`var(--logo-url)`}
                alt="Logo da marca"
                className={styles.logoImage}
              />
            </Link>
          </div>

          {/* MENU DIREITO */}
          <div className={styles.rightMenuWrapper}>
            <div className={styles.rightMenu}>
              <ul>
                {/* Botão de pesquisa */}
                <li>
                  <button
                    type="button"
                    title="Pesquisar"
                    className={searchOpen ? styles.activeButton : ""}
                    onClick={() => {
                      const nextSearchOpen = !searchOpen;
                      setSearchOpen(nextSearchOpen);
                      if (nextSearchOpen) setMenuOpen(false);
                      syncHeaderTheme({ searchOpen: nextSearchOpen, menuOpen: false });
                    }}
                  >
                    <FaSearch />
                  </button>
                </li>

                {/* Carrinho */}
                <li>
                  <button type="button" title="Carrinho de compras" onClick={toggleCart}>
                    <FaShoppingCart />
                  </button>
                </li>

                {/* Login / Conta / Admin */}
                <li>
                  <Link to={linkDestino} title={tituloLink}>
                    <button
                      type="button"
                      className={`${styles.btn_login} ${estaLogado ? styles.btn_login_active : ""}`}
                      name="loginButton"
                    >
                      <FaUserCircle />
                    </button>
                  </Link>
                </li>


                {/* Botão mobile - menu hamburguer */}
                <li className={styles.menuToggleWrapper}>
                  <button
                    type="button"
                    title={menuOpen ? "Fechar menu" : "Abrir menu"}
                    onClick={() => {
                      const newState = !menuOpen;
                      setMenuOpen(newState);
                      if (newState) setSearchOpen(false);
                      syncHeaderTheme({ menuOpen: newState, searchOpen: false });
                    }}
                  >
                    {menuOpen ? <FaTimes /> : <FaBars />}
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DE PESQUISA */}
      {searchOpen && (
        <div className={styles.searchWrapper}>
          <input
            type="text"
            name="searchInput"
            className={styles.searchInput}
            placeholder="Pesquisar..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            autoFocus
            title="Campo de pesquisa"
          />

          {/* Confirmar pesquisa */}
          <button
            type="button"
            className={styles.searchConfirmButton}
            title="Confirmar pesquisa"
            onClick={() => {
              console.log("Pesquisar:", searchValue);
              setSearchValue("");
              setSearchOpen(false);
              syncHeaderTheme({ searchOpen: false });
            }}
          >
            <FaCheck />
          </button>

          {/* Fechar pesquisa */}
          <button
            type="button"
            className={styles.searchCloseButton}
            title="Fechar pesquisa"
            onClick={() => {
              setSearchOpen(false);
              syncHeaderTheme({ searchOpen: false });
            }}
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* MENU MOBILE */}
      {menuOpen && (
        <nav className={styles.mobileMenu} title="Menu mobile">
          <ul className={styles.mobileMenuTop}>
            <li><Link to="/" onClick={() => { setMenuOpen(false); syncHeaderTheme({ menuOpen: false, searchOpen: false }); }}>Home</Link></li>
            <li className={isActiveRoute("/shop") ? styles.active : ""}><Link to="/shop" onClick={() => { setMenuOpen(false); syncHeaderTheme({ menuOpen: false, searchOpen: false }); }}>Shop</Link></li>
            <li className={isActiveRoute("/community") ? styles.active : ""}><Link to="/community" onClick={() => { setMenuOpen(false); syncHeaderTheme({ menuOpen: false, searchOpen: false }); }}>Community</Link></li>
            <li className={isActiveRoute("/sale") ? styles.active : ""}><Link to="/sale" onClick={() => { setMenuOpen(false); syncHeaderTheme({ menuOpen: false, searchOpen: false }); }}>Sale</Link></li>
            <li className={isActiveRoute("/about-us") ? styles.active : ""}><Link to="/about-us" onClick={() => { setMenuOpen(false); syncHeaderTheme({ menuOpen: false, searchOpen: false }); }}>About Us</Link></li>
          </ul>

          <ul className={styles.mobileMenuBottom}>
            <li><Link to="/atendimento" onClick={() => { setMenuOpen(false); syncHeaderTheme({ menuOpen: false, searchOpen: false }); }}>Atendimento</Link></li>
          </ul>
        </nav>
      )}
    </header>
  );
}
