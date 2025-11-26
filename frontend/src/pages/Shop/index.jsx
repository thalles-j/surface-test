import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./style.module.css";
import ShopHeader from "../../components/ShopHeader";
import PageLoader from "../../components/PageLoader";

const categoryMap = {
  1: "Exclusivo",
  2: "Times",
};

// ---------------------------------------------------------
// 1. NOVO COMPONENTE: ProductCard
// Ele gerencia qual imagem mostrar baseado no mouse
// ---------------------------------------------------------
const ProductCard = ({ produto }) => {
  const [isHovered, setIsHovered] = useState(false);
  const baseUrl = "http://localhost:5000";

  // Pega a primeira e a segunda imagem (se existir)
  const fotoPrincipal = produto.fotos?.[0]?.url ? `${baseUrl}${produto.fotos[0].url}` : null;
  const fotoSecundaria = produto.fotos?.[1]?.url ? `${baseUrl}${produto.fotos[1].url}` : null;

  // Lógica: Se o mouse estiver em cima E existir uma segunda foto, mostra ela.
  // Caso contrário, mostra a principal.
  const imagemAtual = (isHovered && fotoSecundaria) ? fotoSecundaria : fotoPrincipal;

  return (
    <div 
      className={styles.card}
      // Eventos para detectar o mouse
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/produto/${produto.id_produto}`}>
        {imagemAtual ? (
          <img
            src={imagemAtual}
            alt={produto.nome_produto}
            className={styles.produtoImage}
            // Dica: Adicione uma transição suave no seu CSS se desejar
            style={{ transition: 'opacity 0.2s ease-in-out' }} 
          />
        ) : (
          <div className={styles.produtoPlaceholder}>
            Sem imagem
          </div>
        )}

        <div className={styles.produtoInfo}>
          <span className={styles.produtoTag}>
            {categoryMap[produto.id_categoria] || "Geral"}
          </span>
          <h3 className={styles.produtoNome}>{produto.nome_produto}</h3>
          <p className={styles.produtoPreco}>
            R$ {parseFloat(produto.preco).toFixed(2)}
          </p>
        </div>
      </Link>
    </div>
  );
};
// ---------------------------------------------------------

export default function Shop() {
  const [loading, setLoading] = useState(true);
  const [rawProdutos, setRawProdutos] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortOption, setSortOption] = useState("destaque");

  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:5000/api/products")
      .then((res) => res.json())
      .then((data) => {
        setRawProdutos(data || []);
      })
      .catch((err) => console.error("Erro ao carregar produtos:", err))
      .finally(() => setLoading(false));
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
        const da = new Date(a.createdAt || a.data_criacao || 0).getTime();
        const db = new Date(b.createdAt || b.data_criacao || 0).getTime();
        return db - da;
      },
      date_old_new: (a, b) => {
        const da = new Date(a.createdAt || a.data_criacao || 0).getTime();
        const db = new Date(b.createdAt || b.data_criacao || 0).getTime();
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
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => setSelectedCategory(cat)}
              selectedSort={sortOption}
              onSelectSort={(val) => setSortOption(val)}
            />
          </div>

          <div className={styles.produtos_grid}>
            {produtos.length === 0 ? (
              <p>Nenhum produto encontrado na categoria selecionada.</p>
            ) : (
              <div className={styles.grid}>
                {/* 2. USANDO O NOVO COMPONENTE AQUI */}
                {produtos.map((produto) => (
                  <ProductCard key={produto.id_produto} produto={produto} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}