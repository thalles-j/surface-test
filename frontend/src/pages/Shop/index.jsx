import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./style.module.css";
import ShopHeader from "../../components/ShopHeader";
import PageLoader from "../../components/PageLoader";
import { useCart } from "../../context/CartContext";
import { FaCartPlus } from "react-icons/fa";
import { Check } from "lucide-react"; 
import { resolveImageUrl } from "../../utils/resolveImageUrl";
import { api } from "../../services/api";
import ProductModal from "../../components/ProductModal";

const categoryMap = {
  1: "Exclusivo",
  2: "Times",
};



// ---------------------------------------------------------
// 1. COMPONENTE: ProductCard 
// ---------------------------------------------------------
const ProductCard = ({ produto, onQuickAdd }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const createSlug = (name) => {
    if (!name) return "";
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const fotos = produto?.fotos || [];
  const fotoPrincipal = fotos[0]?.url ? resolveImageUrl(fotos[0].url) : null;
  const fotoSecundaria = fotos[1]?.url ? resolveImageUrl(fotos[1].url) : null;
  const imagemAtual = (isHovered && fotoSecundaria) ? fotoSecundaria : fotoPrincipal;

  return (
    <div 
      className={styles.card}
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
              onQuickAdd(produto); 
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
            R$ {parseFloat(produto.preco || 0).toFixed(2)}
          </p>
        </div>
      </Link>
    </div>
  );
};
// ---------------------------------------------------------

export default function Shop() {
  const { addToCart } = useCart(); 
  const [loading, setLoading] = useState(true);
  const [rawProdutos, setRawProdutos] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [sortOption, setSortOption] = useState("destaque");

  // Estados para modal e notificacao
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get('/products')
      .then(res => {
        setRawProdutos(res.data || []);
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

  const handleOpenModal = (produto) => {
    setSelectedProduct(produto);
    setIsModalOpen(true);
  };

  const handleConfirmAddToCart = (produto, tamanhoSelecionado) => {
    // Monta o objeto final para o carrinho.
    const produtoFinalParaCarrinho = {
      ...produto,
      selectedSize: tamanhoSelecionado || "Unico" // Fallback seguro
    };
    
    addToCart(produtoFinalParaCarrinho);
    
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000); 
  };

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
                {produtos.map((produto) => (
                  <ProductCard 
                    key={produto.id_produto} 
                    produto={produto} 
                    onQuickAdd={handleOpenModal} 
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ProductModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        produto={selectedProduct}
        onAddToCart={handleConfirmAddToCart}
      />

      {showNotification && (
        <div
          className="fixed bottom-8 right-8 px-8 py-5 flex items-center gap-4 shadow-2xl animate-in slide-in-from-bottom-5 z-[200]"
          style={{ background: "var(--app-primary-bg)", color: "var(--app-primary-text)" }}
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: "var(--app-surface)", color: "var(--app-text)" }}
          >
            <Check className="w-4 h-4" strokeWidth={3} />
          </div>
          <span className="text-sm font-bold uppercase tracking-wider">Adicionado ao carrinho</span>
        </div>
      )}
    </section>
  );
}

