import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./style.module.css";
import CategoriasDropdown from "../../components/Categorias/";

// category mapping based on seed (id_categoria)
const categoryMap = {
  1: "Exclusivo",
  2: "Times",
};

export default function Shop() {
  const [rawProdutos, setRawProdutos] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortOption, setSortOption] = useState("destaque");

  useEffect(() => {
    fetch("http://localhost:5000/api/products")
      .then((res) => res.json())
      .then((data) => {
        setRawProdutos(data || []);
      })
      .catch((err) => console.error("Erro ao carregar produtos:", err));
  }, []);

  

  const categories = useMemo(() => {
    const set = new Set();
    rawProdutos.forEach((p) => {
      const cat = categoryMap[p.id_categoria] || "Geral";
      set.add(cat);
    });
    return ["All", ...Array.from(set)];
  }, [rawProdutos]);

  useEffect(() => {
    let list = rawProdutos.slice();

    if (selectedCategory && selectedCategory !== "All") {
      list = list.filter((p) => {
        const cat = categoryMap[p.id_categoria] || "Geral";
        return cat === selectedCategory;
      });
    }

    const sorters = {
      destaque: (a, b) => (b.destaque ? 1 : 0) - (a.destaque ? 1 : 0),
      az: (a, b) => String(a.nome_produto || "").localeCompare(String(b.nome_produto || "")),
      za: (a, b) => String(b.nome_produto || "").localeCompare(String(a.nome_produto || "")),
      price_desc: (a, b) => (parseFloat(b.preco) || 0) - (parseFloat(a.preco) || 0),
      price_asc: (a, b) => (parseFloat(a.preco) || 0) - (parseFloat(b.preco) || 0),
      date_new_old: (a, b) => {
        const da = new Date(a.createdAt || a.data_criacao || a.created_at || a.data || 0).getTime();
        const db = new Date(b.createdAt || b.data_criacao || b.created_at || b.data || 0).getTime();
        return db - da;
      },
      date_old_new: (a, b) => {
        const da = new Date(a.createdAt || a.data_criacao || a.created_at || a.data || 0).getTime();
        const db = new Date(b.createdAt || b.data_criacao || b.created_at || b.data || 0).getTime();
        return da - db;
      },
    };

    const sorter = sorters[sortOption] || sorters.destaque;
    try {
      list.sort(sorter);
    } catch (e) {
      console.warn("Sort failed", e);
    }

    setProdutos(list);
  }, [rawProdutos, selectedCategory, sortOption]);

  return (
    <section className={styles.shop_section}>
      <div className={styles.shop_body}>
        <div className={styles.shop_container}>

          <div className={styles.shop_headerWrapper}>
            <CategoriasDropdown
              categories={categories}
              selected={selectedCategory}
              onSelect={(c) => setSelectedCategory(c)}
            />

            <div className={styles.shop_filters}>
              <div className={styles.filter_group}>
                <label htmlFor="category">Categoria:</label>
                <select id="category" className={styles.category_select} value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className={styles.filter_group}>
                <label htmlFor="sort">Ordenar por:</label>
                <select id="sort" className={styles.sort_select} value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                  <option value="destaque">Destaque</option>
                  <option value="az">Ordem alfabética A → Z</option>
                  <option value="za">Ordem alfabética Z → A</option>
                  <option value="price_desc">Preço: Maior → Menor</option>
                  <option value="price_asc">Preço: Menor → Maior</option>
                  <option value="date_new_old">Data: Mais novo → Mais antigo</option>
                  <option value="date_old_new">Data: Mais antigo → Mais novo</option>
                </select>
              </div>
            </div>
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

                      <div className={styles.produtoInfo}>
                        <span className={styles.produtoTag}>{categoryMap[produto.id_categoria] || "Geral"}</span>
                        <h3 className={styles.produtoNome}>{produto.nome_produto}</h3>
                        <p className={styles.produtoPreco}>R$ {parseFloat(produto.preco).toFixed(2)}</p>
                      </div>

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