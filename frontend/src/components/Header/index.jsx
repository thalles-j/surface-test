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

  // Atualiza cores ao mudar de rota e fecha menu
  useEffect(() => {
    updateHeaderCSS(location.pathname);
    setMenuOpen(false);
  }, [location.pathname]);

  // Reseta header se o botão de menu desaparecer (largura > 1400)
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
              <li><Link to="/">Home</Link></li>
              <li><Link to="/shop">Shop</Link></li>
              <li><Link to="/community">Community</Link></li>
              <li><Link to="/sale">Sale</Link></li>
              <li><Link to="/about-us">About Us</Link></li>
            </ul>
          </div>

          {/* LOGO */}
          <div className={styles.logoWrapper}>
            <Link to="/">
              <img
                src={`var(--logo-url)`}
                alt="Logo"
                className={styles.logoImage}
              />
            </Link>
          </div>

          {/* MENU DIREITO */}
          <div className={styles.rightMenuWrapper}>
            <div className={styles.rightMenu}>
              <ul>
                {/* Botão pesquisa */}
                <li>
                  <button
                    type="button"
                    className={searchOpen ? styles.activeButton : ""}
                    onClick={() => {
                      setSearchOpen(prev => !prev);
                      if (!searchOpen) setMenuOpen(false);
                    }}
                  >
                    <FaSearch />
                  </button>
                </li>

                <li>
                  <button type="button"><FaShoppingCart /></button>
                </li>
                <li>
                  <button type="button"><FaUserCircle /></button>
                </li>

                {/* Hamburger só mobile */}
                <li className={styles.menuToggleWrapper}>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(prev => {
                        const newState = !prev;
                        if (newState) setSearchOpen(false); // fecha pesquisa se menu abrir
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

      {searchOpen && (
        <div className={styles.searchWrapper}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Pesquisar..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            autoFocus
          />
          {/* Botão confirmar pesquisa */}
          {/* Botão confirmar pesquisa */}
          <button
            type="button"
            className={styles.searchConfirmButton}
            onClick={() => {
              console.log("Pesquisar:", searchValue);
              setSearchValue("");
              setSearchOpen(false);
            }}
          >
            <FaCheck />
          </button>
          {/* Botão de fechar pesquisa */}
          <button
            type="button"
            className={styles.searchCloseButton}
            onClick={() => setSearchOpen(false)}
          >
            <FaTimes />
          </button>
        </div>
      )}
      {/* MENU MOBILE SEPARADO */}
      {menuOpen && (
        <nav className={styles.mobileMenu}>
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
