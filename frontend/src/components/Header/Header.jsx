import { useEffect, useState} from "react";
import { useLocation, Link } from "react-router-dom";
import { FaSearch, FaShoppingCart, FaUserCircle } from "react-icons/fa";
import styles from "./Header.module.css";
import { updateHeaderCSS } from "./../../utils/headerTheme";

export default function Header() {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

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
              <li>
                <Link to="/" className={styles.menuLink}>Home</Link>
              </li>
              <li>
                <Link to="/shop" className={styles.menuLink}>Shop</Link>
              </li>
              <li>
                <Link to="/community" className={styles.menuLink}>Community</Link>
              </li>
              <li>
                <Link to="/sale" className={styles.menuLink}>Sale</Link>
              </li>
              <li>
                <Link to="/about-us" className={styles.menuLink}>About Us</Link>
              </li>
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
              </ul>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
