import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./Shop.module.css";
import CategoriasDropdown from "../../components/Categorias/CategoriasDropDown";

export default function Shop() {
  const [produtos, setProdutos] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/products") // API backend
      .then(res => res.json())
      .then(data => setProdutos(data))
      .catch(err => console.error("Erro ao carregar produtos:", err));
  }, []);

  return (
    <section className={styles.shop_section}>
      <div className={styles.shop_body}>
        <div className={styles.shop_container}>
          {/* Cabeçalho com categorias */}
          <div className={styles.shop_headerWrapper}>
            <CategoriasDropdown />
          </div>

          {/* Grid de produtos */}
          <div className={styles.produtos_grid}>
            {produtos.length === 0 ? (
              <p>Carregando produtos...</p>
            ) : (
              <div className={styles.grid}>
                {produtos.map((produto) => (
                  <div key={produto.id_produto} className={styles.card}>
                    <Link to={`/product/${produto.id_produto}`}>
                      {produto.fotos && produto.fotos.length > 0 ? (
                        <img
                          src={produto.fotos[0].url}
                          alt={produto.nome_produto}
                          className={styles.produtoImage}
                        />
                      ) : (
                        <div className={styles.produtoPlaceholder}>Sem imagem</div>
                      )}
                      <h3 className={styles.produtoNome}>{produto.nome_produto}</h3>
                      <p>R$ {parseFloat(produto.preco).toFixed(2)}</p>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
