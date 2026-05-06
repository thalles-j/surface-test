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

// ---------------------------------------------------------
// 1. COMPONENTE: ProductCard 
// ---------------------------------------------------------
// Adicionamos a prop "categoriaNome" que já virá resolvida pelo componente pai
const ProductCard = ({ produto, categoriaNome, onQuickAdd }) => {
  const [isHovered, setIsHovered] = useState(false);

  const { shouldOpenCart, toggleCart, setShouldOpenCart } = useCart();
  useEffect(() => {
    if (shouldOpenCart) {
      toggleCart();
      setShouldOpenCart(false);
    }
  }, [shouldOpenCart]);

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
          {/* Exibe o nome que buscamos dinamicamente na rota de categorias */}
          <span className={styles.produtoTag}>
            {categoriaNome}
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
  // Novo estado para guardar o mapa de categorias: { 1: "Times", 2: "Blusas" }
  const [categoriasMap, setCategoriasMap] = useState({});

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [sortOption, setSortOption] = useState("destaque");

  // Estados para Modal e Notificação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    setLoading(true);
    
    // Executa as duas requisições ao mesmo tempo
    // Mude '/categories' para a rota correta da sua API se for diferente (ex: '/categorias')
    Promise.all([
      api.get('/products'),
      api.get('/categories') 
    ])
    .then(([resProdutos, resCategorias]) => {
      // 1. Cria um dicionário com as categorias
      const catMap = {};
      const listaCategorias = resCategorias.data || [];
      
      listaCategorias.forEach((cat) => {
        // Se a sua API retorna { id_categoria: 1, nome: "Blusas" }
        // Ajuste 'cat.nome' se a chave for 'cat.nome_categoria'
        const id = cat.id_categoria || cat.id;
        const nome = cat.nome || cat.nome_categoria || cat.categoria || "Geral";
        if (id) {
          catMap[id] = nome;
        }
      });
      
      setCategoriasMap(catMap);
      setRawProdutos(resProdutos.data || []);
    })
    .catch((err) => console.error("Erro ao carregar dados:", err))
    .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set();
    rawProdutos.forEach((p) => {
      // Pega o nome no dicionário usando o ID que veio no produto
      const nomeCategoria = categoriasMap[p.id_categoria] || "Geral";
      set.add(nomeCategoria);
    });
    return ["All", ...Array.from(set)];
  }, [rawProdutos, categoriasMap]);

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
        const nomeCategoria = categoriasMap[p.id_categoria] || "Geral";
        return nomeCategoria === selectedCategory;
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
  }, [rawProdutos, selectedCategory, selectedType, sortOption, categoriasMap]);

  const handleOpenModal = (produto) => {
    setSelectedProduct(produto);
    setIsModalOpen(true);
  };

  const handleConfirmAddToCart = (produto, tamanhoSelecionado) => {
    const produtoFinalParaCarrinho = {
      ...produto,
      tamanho: tamanhoSelecionado || "Único"
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
                    // Passa o nome da categoria resolvido para o Card
                    categoriaNome={categoriasMap[produto.id_categoria] || "Geral"}
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
        <div className="fixed bottom-8 right-8 bg-black text-white px-8 py-5 flex items-center gap-4 shadow-2xl animate-in slide-in-from-bottom-5 z-[200]">
          <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center">
            <Check className="w-4 h-4" strokeWidth={3} />
          </div>
          <span className="text-sm font-bold uppercase tracking-wider">Adicionado ao carrinho</span>
        </div>
      )}
    </section>
  );
}