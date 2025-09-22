import React from "react";
import styles from "./CategoriasDropdown.module.css";

export default function CategoriasDropdown() {
  return (
    <div className={styles.dropdown_categorias}>
      <div className={styles.dropdown_toggle}>
        <ul className={styles.categorias_list}>
          <li>
            <button onClick={() => alert("Abrindo NEW DROP")}>
                <strong>NEW DROP</strong>
            </button>
          </li>
            <li>
                <button onClick={() => alert("Abrindo")}>
                    EXCLUSIV
                </button>
            </li>
            <li>
                <button onClick={() => alert("Abrindo ")}>
                    FUTEBOL
                </button>
            </li>
        </ul>
      </div>
    </div>
  );
}
