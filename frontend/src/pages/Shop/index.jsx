import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import styles from "./style.module.css";
import ShopHeader from "../../components/ShopHeader";
import PageLoader from "../../components/PageLoader";
import { useCart } from "../../context/CartContext";
import { FaCartPlus } from "react-icons/fa";
import { resolveImageUrl, handleImgError } from "../../utils/resolveImageUrl";
import { api } from "../../services/api";

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
  const { addToCart } = useCart();

  // Função para criar slug a partir do nome
  const createSlug = (name) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // Ordena as fotos: principal primeiro, depois por id
  const sortedFotos = produto.fotos ? [...produto.fotos].sort((a, b) => {
      if (a.principal && !b.principal) return -1;
      if (!a.principal && b.principal) return 1;
      return (a.id_foto || 0) - (b.id_foto || 0);
  }) : [];

  // Pega a primeira e a segunda imagem (se existir)
  const fotoPrincipal = sortedFotos?.[0]?.url ? resolveImageUrl(sortedFotos[0].url) : null;
  const fotoSecundaria = sortedFotos?.[1]?.url ? resolveImageUrl(sortedFotos[1].url) : null;

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
      <Link to={`/produto/${createSlug(produto.nome_produto)}`} className={styles.cardLink}>
        <div className={styles.imageContainer}>
          {imagemAtual ? (
            <img
              src={imagemAtual}
              alt={produto.nome_produto}
              className={styles.produtoImage}
              style={{ transition: 'opacity 0.2s ease-in-out' }}
              onError={handleImgError}
            />
          ) : (
            <div className={styles.produtoPlaceholder}>
              Sem imagem
            </div>
          )}
          
          <button 
            className={styles.cartIconButton}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addToCart(produto);
            }}
            title="Adicionar ao Carrinho"
          >
            <FaCartPlus />
          </button>
        </div>

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
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const [loading, setLoading] = useState(true);
  const [rawProdutos, setRawProdutos] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [sortOption, setSortOption] = useState("destaque");
  const [maintenance, setMaintenance] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
    api.get(`/products${params}`)
      .then(res => setRawProdutos(res.data || []))
      .catch((err) => {
        if (err.response?.status === 503 && err.response?.data?.manutencao) {
          setMaintenance(true);
        } else {
          console.error("Erro ao carregar produtos:", err);
        }
      })
      .finally(() => setLoading(false));
  }, [searchQuery]);

  const categories = useMemo(() => {
    const set = new Set();
    rawProdutos.forEach((p) => {
      const cat = categoryMap[p.id_categoria] || "Geral";
      set.add(cat);
    });
    return ["All", ...Array.from(set)];
  }, [rawProdutos]);

  const types = useMemo(() => {
    const set = new Set();
    rawProdutos.forEach((p) => {
      if (p.tipo) set.add(p.tipo);
    });
    return ["All", ...Array.from(set).sort()];
  }, [rawProdutos]);

  useEffect(() => {
    let list = rawProdutos.slice();

    if (selectedCategory && selectedCategory !== "All") {
      list = list.filter((p) => {
        const cat = categoryMap[p.id_categoria] || "Geral";
        return cat === selectedCategory;
      });
    }

    if (selectedType && selectedType !== "All") {
      list = list.filter((p) => p.tipo === selectedType);
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
  }, [rawProdutos, selectedCategory, selectedType, sortOption]);

  if (loading) {
    return <PageLoader />;
  }

  if (maintenance) {
    return (
      <section className={styles.shop_section}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="text-6xl mb-6">🔧</div>
          <h1 className="text-3xl font-bold mb-3">Estamos em Manutenção</h1>
          <p className="text-gray-500 max-w-md">A loja está temporariamente indisponível. Estamos trabalhando para voltar o mais rápido possível.</p>
        </div>
      </section>
    );
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
              types={types}
              selectedType={selectedType}
              onSelectType={(type) => setSelectedType(type)}
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