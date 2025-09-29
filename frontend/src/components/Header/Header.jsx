import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { FaSearch, FaShoppingCart, FaUserCircle, FaBars, FaTimes } from "react-icons/fa";
import styles from "./Header.module.css";
import { updateHeaderCSS } from "./../../utils/headerTheme";

export default function Header() {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    updateHeaderCSS(location.pathname);
    setMenuOpen(false); // fecha menu sempre que troca de rota
  }, [location.pathname]);

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
                style={{ content: `var(--logo-url)` }}
              />
            </Link>
          </div>


          {/* MENU DIREITO */}
          <div className={styles.rightMenuWrapper}>
            <div className={styles.rightMenu}>
              <ul>
                {searchOpen && (
                  <li>
                    <input
                      type="text"
                      className={styles.searchInput}
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      placeholder="Pesquisar..."
                      autoFocus
                    />
                  </li>
                )}
                <li>
                  <button
                    type="button"
                    className={styles.searchButton}
                    onClick={() => setSearchOpen(prev => !prev)}
                  >
                    <FaSearch />
                  </button>
                </li>
                <li>
                  <button type="button">
                    <FaShoppingCart />
                  </button>
                </li>
                <li>
                  <button type="button">
                    <FaUserCircle />
                  </button>
                </li>
                {/* Hamburguer só aparece no mobile */}
                <li className={styles.menuToggleWrapper}>
  <button
    type="button"
    className={styles.menuToggle}
    onClick={() => {
      setMenuOpen(prev => {
        const newState = !prev; // alterna menu
        if (newState) {
          // Menu abriu → forçar cores do "shop" (preto)
          updateHeaderCSS("/shop");
        } else {
          // Menu fechou → volta ao estilo da rota real
          updateHeaderCSS(location.pathname);
        }
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

      {/* MENU MOBILE SEPARADO */}
      {menuOpen && (
  <nav className={styles.mobileMenu}>
    <ul className={styles.mobileMenuTop}>
      <li>
        <Link
          to="/"
          onClick={() => {
            setMenuOpen(false);           // fecha menu
            updateHeaderCSS("/");         // reseta header para Home
          }}
        >
          Home
        </Link>
      </li>
      <li>
        <Link
          to="/shop"
          onClick={() => {
            setMenuOpen(false);
            updateHeaderCSS("/shop");    // reseta header para Shop
          }}
        >
          Shop
        </Link>
      </li>
      <li>
        <Link
          to="/community"
          onClick={() => {
            setMenuOpen(false);
            updateHeaderCSS("/community");
          }}
        >
          Community
        </Link>
      </li>
      <li>
        <Link
          to="/sale"
          onClick={() => {
            setMenuOpen(false);
            updateHeaderCSS("/sale");
          }}
        >
          Sale
        </Link>
      </li>
      <li>
        <Link
          to="/about-us"
          onClick={() => {
            setMenuOpen(false);
            updateHeaderCSS("/about-us");
          }}
        >
          About Us
        </Link>
      </li>
    </ul>

    <ul className={styles.mobileMenuBottom}>
      <li>
        <Link
          to="/atendimento"
          onClick={() => {
            setMenuOpen(false);
            updateHeaderCSS("/atendimento");
          }}
        >
          Atendimento
        </Link>
      </li>
    </ul>
  </nav>
)}
    </header>
  );
}
