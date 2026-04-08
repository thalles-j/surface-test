import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styles from "./style.module.css";
import PageLoader from "../../components/PageLoader";
import ImageGallery from "./components/ImageGallery";
import ProductInfo from "./components/ProductInfo";
import RelatedProducts from "./components/RelatedProducts";
import { useCart } from "../../context/CartContext";
import { api } from "../../services/api";
import useAuth from "../../hooks/useAuth";
import { useToast } from "../../context/ToastContext";

export default function ProductDetail() {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { signed, user } = useAuth();
  const toast = useToast();
  const [produto, setProduto] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [restockLoading, setRestockLoading] = useState(false);
  const [restockRequests, setRestockRequests] = useState({});
  
  const [selectedSize, setSelectedSize] = useState(null);

  // Função para criar slug a partir do nome
  const createSlug = (name) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };



  useEffect(() => {
    const fetchProduto = async () => {
      setLoading(true);
      try {
        const res = await api.get('/products');
        const data = res.data;
        
        // Buscar produto pelo slug (nome convertido)
        const found = data.find(p => createSlug(p.nome_produto) === slug);
        
        if (!found) {
          setError("Produto não encontrado");
          return;
        }
        
        setProduto(found);
        
        // Buscar produtos relacionados (mesma categoria ou destaque)
        const related = data
          .filter(p => p.id_produto !== found.id_produto && 
                      (p.id_categoria === found.id_categoria || p.destaque))
          .slice(0, 4);
        setRelatedProducts(related);
        
      } catch (err) {
        console.error("Erro ao carregar produto:", err);
        setError(err.message || "Erro ao carregar produto");
      } finally {
        setLoading(false);
      }
    };

    fetchProduto();
  }, [slug]);

  if (loading) return <PageLoader />;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!produto) return <div className={styles.error}>Produto não encontrado</div>;

  const variacoes = produto.variacoes_estoque || [];
  const isProductSoldOut =
    variacoes.length > 0 && variacoes.every((v) => Number(v?.estoque || 0) <= 0);
  const restockKey = selectedSize || "produto";
  const hasRequestedRestock = Boolean(restockRequests[restockKey]);

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert("Por favor, selecione um tamanho");
      return;
    }
    
    const selectedVariacao = variacoes.find(v => v.tamanho === selectedSize);
    if (selectedVariacao?.estoque === 0) return;
    
    addToCart({ ...produto, selectedSize });
  };

  const handleRestockRequest = async () => {
    if (restockLoading || hasRequestedRestock) return;

    let variacao = selectedSize;
    if (!variacao && variacoes.length === 1) {
      variacao = variacoes[0].tamanho || variacoes[0].sku || "unico";
      setSelectedSize(variacao);
    }

    if (!variacao) {
      toast.warning("Selecione o tamanho para ser avisado.");
      return;
    }

    let email = user?.email || null;
    if (!signed) {
      const promptedEmail = window.prompt("Digite seu e-mail para avisarmos quando voltar:");
      if (!promptedEmail) return;
      email = promptedEmail.trim().toLowerCase();

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error("E-mail invalido.");
        return;
      }
    }

    setRestockLoading(true);
    try {
      await api.post("/products/restock-request", {
        produto_id: produto.id_produto,
        variacao,
        ...(email ? { email } : {}),
      });

      setRestockRequests((prev) => ({ ...prev, [variacao]: true }));
      toast.success("Avisaremos quando voltar");
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.mensagem ||
        "Nao foi possivel registrar seu interesse.";
      toast.error(message);
    } finally {
      setRestockLoading(false);
    }
  };

  return (
    <div className={styles.productDetail}>
      <div className={styles.container}>
        <ImageGallery 
          fotos={produto.fotos} 
          productName={produto.nome_produto}
        />

        <ProductInfo 
          produto={produto}
          variacoes={variacoes}
          selectedSize={selectedSize}
          setSelectedSize={setSelectedSize}
          handleAddToCart={handleAddToCart}
          isProductSoldOut={isProductSoldOut}
          onRestockRequest={handleRestockRequest}
          restockLoading={restockLoading}
          hasRequestedRestock={hasRequestedRestock}
        />
      </div>

      <RelatedProducts 
        products={relatedProducts}
        createSlug={createSlug}
      />
    </div>
  );
}
