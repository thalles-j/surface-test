import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./Shop.module.css";
import CategoriasDropdown from "../../components/Categorias/CategoriasDropDown";

export default function Shop() {
  const [produtos, setProdutos] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/produtos") // sua API backend
      .then(res => res.json())
      .then(data => setProdutos(data))
      .catch(err => console.error("Erro ao carregar produtos:", err));
  }, []);

  return (
    <section className={styles.shop_section}>
      <div className={styles.shop_body}>
        <div className={styles.shop_container}>
          <div className={styles.shop_grid}>
            
            {/* Cabeçalho com categorias */}
            <div className={styles.shop_headerWrapper}>
              <CategoriasDropdown />
            </div>
            <div className={styles.produtos_grid}>
              <ul>
                <li>a</li>
                 <li>a</li>
                  <li>a</li>
                   <li>a</li>
                    <li>a</li>
                     <li>a</li>
                      <li>a</li>
                       <li>a</li>
                        <li>a</li>
                         <li>a</li>
                          <li>a</li>
                           <li>a</li>

              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
