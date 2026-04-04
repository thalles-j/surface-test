import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styles from "./style.module.css";
import PageLoader from "../../components/PageLoader";
import ImageGallery from "./components/ImageGallery";
import ProductInfo from "./components/ProductInfo";
import RelatedProducts from "./components/RelatedProducts";
import { useCart } from "../../context/CartContext";
import { api } from "../../services/api";

export default function ProductDetail() {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const [produto, setProduto] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  
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

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert("Por favor, selecione um tamanho");
      return;
    }
    
    const selectedVariacao = variacoes.find(v => v.tamanho === selectedSize);
    if (selectedVariacao?.estoque === 0) return;
    
    addToCart({ ...produto, selectedSize });
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
        />
      </div>

      <RelatedProducts 
        products={relatedProducts}
        createSlug={createSlug}
      />
    </div>
  );
}
