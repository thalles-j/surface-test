import React, { useState, useRef, useEffect } from "react";
import styles from "./style.module.css";

export default function CategoriasDropdown({ categories = ["All"], onSelect = () => {}, selected }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  return (
    <div className={styles.dropdown_categorias} ref={rootRef}>
      <button
        className={styles.dropdown_toggle}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.toggle_label}>Categorias</span>
        <svg
          className={`${styles.chevron} ${open ? styles.chevron_open : ""}`}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <ul className={`${styles.categorias_list} ${open ? styles.open : ""}`}>
        {categories.map((cat) => (
          <li key={cat}>
            <button
              className={selected === cat ? styles.active : ""}
              onClick={() => {
                onSelect(cat);
                setOpen(false);
              }}
            >
              {cat}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
