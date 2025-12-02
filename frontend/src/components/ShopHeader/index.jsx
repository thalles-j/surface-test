import React, { useState, useRef, useEffect } from "react";
import styles from "./style.module.css";

// Opções de ordenação (Label visível -> Valor técnico)
const SORT_OPTIONS = [
  { label: "Destaque", value: "destaque" },
  { label: "A - Z", value: "az" },
  { label: "Z - A", value: "za" },
  { label: "Menor Preço", value: "price_asc" },
  { label: "Maior Preço", value: "price_desc" },
  { label: "Mais Recentes", value: "date_new_old" },
];

export default function ShopHeader({ 
  categories = ["All"], 
  selectedCategory = "All", 
  onSelectCategory = () => {}, 
  types = ["All"],
  selectedType = "All",
  onSelectType = () => {},
  selectedSort = "destaque", 
  onSelectSort = () => {} 
}) {
  const [activeMenu, setActiveMenu] = useState(null); // 'cat' ou 'sort'
  const rootRef = useRef(null);

  // Fecha os menus se clicar fora de qualquer dropdown
  useEffect(() => {
    function onDoc(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const toggleMenu = (menu) => {
    setActiveMenu(prev => (prev === menu ? null : menu));
  };

  // Componente interno para o Ícone da Seta
  const Chevron = ({ isOpen }) => (
    <svg
      className={`${styles.chevron} ${isOpen ? styles.chevron_open : ""}`}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <div className={styles.shop_header_container} ref={rootRef}>
      
      {/* --- DROPDOWN 1: CATEGORIAS (incluindo Tipos) --- */}
      <div className={styles.dropdown_wrapper}>
        <button
          className={styles.dropdown_toggle}
          aria-expanded={activeMenu === "cat"}
          onClick={() => toggleMenu("cat")}
        >
          <span className={styles.toggle_label}>Categorias</span>
          <Chevron isOpen={activeMenu === "cat"} /> 
        </button>

        <ul className={`${styles.dropdown_list} ${activeMenu === "cat" ? styles.open : ""}`}>
          {/* Seção de Categorias */}
          <li className={styles.section_label}>Categorias</li>
          {categories.map((cat) => (
            <li key={`cat-${cat}`}>
              <button
                className={selectedCategory === cat ? styles.active : ""}
                onClick={() => {
                  onSelectCategory(cat);
                  setActiveMenu(null);
                }}
              >
                {cat === "All" ? "Todas" : cat}
              </button>
            </li>
          ))}
          
          {/* Divisor */}
          {types.length > 1 && <li className={styles.divider}></li>}
          
          {/* Seção de Tipos */}
          {types.length > 1 && <li className={styles.section_label}>Tipos</li>}
          {types.length > 1 && types.map((type) => (
            <li key={`type-${type}`}>
              <button
                className={selectedType === type ? styles.active : ""}
                onClick={() => {
                  onSelectType(type);
                  setActiveMenu(null);
                }}
              >
                {type === "All" ? "Todos" : type}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* --- DROPDOWN 2: ORDENAR POR --- */}
      <div className={styles.dropdown_wrapper}>
        <button
          className={styles.dropdown_toggle}
          aria-expanded={activeMenu === "sort"}
          onClick={() => toggleMenu("sort")}
        >
          <span className={styles.toggle_label}>Ordenar Por</span>
          {/* O SVG deve estar AQUI, dentro do botão */}
          <Chevron isOpen={activeMenu === "sort"} />
        </button>

        <ul className={`${styles.dropdown_list} ${activeMenu === "sort" ? styles.open : ""}`}>
          {SORT_OPTIONS.map((option) => (
            <li key={option.value}>
              <button
                className={selectedSort === option.value ? styles.active : ""}
                onClick={() => {
                  onSelectSort(option.value);
                  setActiveMenu(null);
                }}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}