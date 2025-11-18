import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./style.module.css";
import ShopHeader from "../../components/ShopHeader";
import PageLoader from "../../components/PageLoader"; 

const categoryMap = {
  1: "Exclusivo",
  2: "Times",
};

export default function Shop() {
  // 1. DEFINIÇÃO DO ESTADO DE CARREGAMENTO
  const [loading, setLoading] = useState(true); 
  const [rawProdutos, setRawProdutos] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortOption, setSortOption] = useState("destaque");

  useEffect(() => {
    // Garante que o loader esteja ativo antes de começar
    setLoading(true);

    fetch("http://localhost:5000/api/products")
      .then((res) => res.json())
      .then((data) => {
        setRawProdutos(data || []);
      })
      .catch((err) => console.error("Erro ao carregar produtos:", err))
     
      .finally(() => setLoading(false));
  }, []);

  // ... (O restante da lógica de categories e useEffect para ordenação permanece a mesma)

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

    // ... (Sua lógica de ordenação e filtros)

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


  
  if (loading) {
    return <PageLoader />;
  }
   return (
    <section className={styles.shop_section}>
      <div className={styles.shop_body}>
        <div className={styles.shop_container}>

          <div className={styles.shop_headerWrapper}>
            <ShopHeader
              // 1. Configuração de Categorias
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => setSelectedCategory(cat)}

              // 2. Configuração de Ordenação
              selectedSort={sortOption}
              onSelectSort={(val) => setSortOption(val)}
            />
          </div>

          <div className={styles.produtos_grid}>
            
            {produtos.length === 0 ? (
              <p>Nenhum produto encontrado na categoria selecionada.</p>
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