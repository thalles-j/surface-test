import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { FaSearch, FaCheck, FaShoppingCart, FaUserCircle, FaBars, FaTimes } from "react-icons/fa";
import styles from "./style.module.css";
import { updateHeaderCSS } from "../../utils/headerTheme";

export default function Header() {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    updateHeaderCSS(location.pathname);
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      const menuButton = document.querySelector(`.${styles.menuToggleWrapper}`);
      if (menuButton) {
        const isHidden = window.getComputedStyle(menuButton).display === "none";
        if (isHidden && menuOpen) {
          setMenuOpen(false);
          updateHeaderCSS(location.pathname);
        }
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [location.pathname, menuOpen]);

  return (
    <header className={styles.header}>
      <div className={styles.navbarWrapper}>
        <div className={styles.nav}>

          {/* MENU DESKTOP */}
          <div className={styles.centeredMenu}>
            <ul className={styles.noBreak}>
              <li><Link to="/" title="Ir para Home">Home</Link></li>
              <li><Link to="/shop" title="Ir para Shop">Shop</Link></li>
              <li><Link to="/community" title="Ir para Community">Community</Link></li>
              <li><Link to="/sale" title="Ir para Sale">Sale</Link></li>
              <li><Link to="/about-us" title="Ir para Sobre nós">About Us</Link></li>
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
                      setSearchOpen(prev => !prev);
                      if (!searchOpen) setMenuOpen(false);
                    }}
                  >
                    <FaSearch />
                  </button>
                </li>

                {/* Carrinho */}
                <li>
                  <button type="button" title="Carrinho de compras">
                    <FaShoppingCart />
                  </button>
                </li>

                {/* Login */}
                <li>
                  <Link to="/entrar" title="Ir para login">
                    <button
                      type="button"
                      className={styles.btn_login}
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
                      setMenuOpen(prev => {
                        const newState = !prev;
                        if (newState) setSearchOpen(false);
                        if (newState) updateHeaderCSS("/shop");
                        else updateHeaderCSS(location.pathname);
                        return newState;
                      });
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
            }}
          >
            <FaCheck />
          </button>

          {/* Fechar pesquisa */}
          <button
            type="button"
            className={styles.searchCloseButton}
            title="Fechar pesquisa"
            onClick={() => setSearchOpen(false)}
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* MENU MOBILE */}
      {menuOpen && (
        <nav className={styles.mobileMenu} title="Menu mobile">
          <ul className={styles.mobileMenuTop}>
            <li><Link to="/" onClick={() => { setMenuOpen(false); updateHeaderCSS("/"); }}>Home</Link></li>
            <li><Link to="/shop" onClick={() => { setMenuOpen(false); updateHeaderCSS("/shop"); }}>Shop</Link></li>
            <li><Link to="/community" onClick={() => { setMenuOpen(false); updateHeaderCSS("/community"); }}>Community</Link></li>
            <li><Link to="/sale" onClick={() => { setMenuOpen(false); updateHeaderCSS("/sale"); }}>Sale</Link></li>
            <li><Link to="/about-us" onClick={() => { setMenuOpen(false); updateHeaderCSS("/about-us"); }}>About Us</Link></li>
          </ul>

          <ul className={styles.mobileMenuBottom}>
            <li><Link to="/atendimento" onClick={() => { setMenuOpen(false); updateHeaderCSS("/atendimento"); }}>Atendimento</Link></li>
          </ul>
        </nav>
      )}
    </header>
  );
}
