import React from "react";
import { FaSearch, FaShoppingCart, FaUserCircle } from "react-icons/fa"; // ícones corretos
import styles from "../Header/Header.module.css";
import logo from "../../assets/logo192white.png"; // caminho correto para o logo

export default function Header() {
  return (
    <header>
      <div className={styles.navbarWrapper}>
        <div className={styles.nav}>
          <div className={styles.centeredMenu}>
            <ul className={styles.noBreak}>

              <li className={styles.navItem}>Home</li>
              <li className={styles.navItem}>Exclusiv</li>
              <li className={styles.navItem}>Futebol</li>
              <li className={styles.navItem}>Communit</li>
              <li className={styles.navItem}>Sale</li>
              <li className={styles.navItem}>about us</li>

            </ul>
          </div>

          <div className={styles.logoWrapper}>
            <a href="/">
              <img src={logo} alt="Logo" className={styles.defaultImage} />
            </a>
          </div>

          <div className={styles.rightMenuWrapper}>
            <div className={styles.rightMenu}>
              <ul>
                <li>
                  <button type="button" className="search-icon-desktop">
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
