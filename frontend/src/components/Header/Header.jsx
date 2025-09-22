import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { FaSearch, FaShoppingCart, FaUserCircle } from "react-icons/fa";
import styles from "./Header.module.css";
import { updateHeaderCSS } from "./../../utils/headerTheme";

export default function Header() {
  const location = useLocation();

  // Atualiza as variáveis CSS do header ao mudar de rota
  useEffect(() => {
    updateHeaderCSS(location.pathname);
  }, [location.pathname]);

  return (
    <header className={styles.header}>
      <div className={styles.navbarWrapper}>
        <div className={styles.nav}>
          {/* MENU ESQUERDO */}
          <div className={styles.centeredMenu}>
            <ul className={styles.noBreak}>
              <li>Home</li>
              <li>Shop</li>
              <li>Community</li>
              <li>Sale</li>
              <li>About Us</li>
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
                <li>
                  <button type="button" className={styles.searchIconDesktop}>
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
              </ul>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
