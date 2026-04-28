import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styles from "./style.module.css";
import PageLoader from "../../components/PageLoader";
import ImageGallery from "./components/ImageGallery";
import ProductInfo from "./components/ProductInfo";
import RelatedProducts from "./components/RelatedProducts";
import { api } from "../../services/api";

export default function ProductDetail() {
  const { slug } = useParams();
  const [produto, setProduto] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [selectedSize, setSelectedSize] = useState(null);

  useEffect(() => {
    setSelectedSize(null);

    const fetchProduto = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/products/slug/${slug}`);
        const { produto: found, related } = res.data;
        
        if (!found) {
          setError("Produto não encontrado");
          return;
        }
        
        setProduto(found);
        setRelatedProducts(related || []);
        
      } catch (err) {
        console.error("Erro ao carregar produto:", err);
        if (err.response?.status === 404) {
          setError("Produto não encontrado");
        } else {
          setError(err.message || "Erro ao carregar produto");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduto();
  }, [slug]);

  if (loading) return <PageLoader />;
  if (error) return <div className={styles.erro}>{error}</div>;
  if (!produto) return <div className={styles.erro}>Produto não encontrado</div>;

  const variacoes = produto.variacoes_estoque || [];

  return (
    <div className={styles.detalheProduto}>
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
        />
      </div>

      <RelatedProducts 
        products={relatedProducts}
      />
    </div>
  );
}
