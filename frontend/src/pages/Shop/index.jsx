import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./style.module.css";
import CategoriasDropdown from "../../components/Categorias/";

export default function Shop() {
  const [produtos, setProdutos] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/products")
      .then(res => res.json())
      .then(data => setProdutos(data))
      .catch(err => console.error("Erro ao carregar produtos:", err));
  }, []);

  return (
    <section className={styles.shop_section}>
      <div className={styles.shop_body}>
        <div className={styles.shop_container}>

          <div className={styles.shop_headerWrapper}>
            <CategoriasDropdown />
          </div>

          <div className={styles.produtos_grid}>
            {produtos.length === 0 ? (
              <p>Carregando produtos...</p>
            ) : (
              <div className={styles.grid}>
                {produtos.map((produto) => (
                  <div key={produto.id_produto} className={styles.card}>
                    <Link to={`/produto/${produto.id_produto}`}>

                      {produto.fotos?.length > 0 ? (
                        <img
                          src={`http://localhost:5000${produto.fotos[0].url}`}
                          alt={produto.nome_produto}
                          className={styles.produtoImage}
                        />
                      ) : (
                        <div className={styles.produtoPlaceholder}>
                          Sem imagem
                        </div>
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