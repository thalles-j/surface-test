import { useEffect, useMemo, useState } from "react";
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

  const [selectedSize, setSelectedSize] = useState(null);
  const [restockLoading, setRestockLoading] = useState(false);
  const [restockRequests, setRestockRequests] = useState({});
  const [showGuestEmailInput, setShowGuestEmailInput] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");

  const createSlug = (name) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  useEffect(() => {
    const fetchProduto = async () => {
      setLoading(true);
      try {
        const res = await api.get("/products");
        const data = res.data;

        const found = data.find((p) => createSlug(p.nome_produto) === slug);
        if (!found) {
          setError("Produto nao encontrado");
          return;
        }

        setProduto(found);

        const related = data
          .filter(
            (p) => p.id_produto !== found.id_produto && (p.id_categoria === found.id_categoria || p.destaque)
          )
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

  const variacoes = produto?.variacoes_estoque || [];

  const selectedVariacao = useMemo(
    () => variacoes.find((v) => v.tamanho === selectedSize),
    [variacoes, selectedSize]
  );
  const isSelectedSizeSoldOut = Boolean(
    selectedSize && Number(selectedVariacao?.estoque || 0) <= 0
  );
  const hasRequestedRestock = Boolean(selectedSize && restockRequests[selectedSize]);

  useEffect(() => {
    setShowGuestEmailInput(false);
    setGuestEmail("");
  }, [selectedSize]);

  if (loading) return <PageLoader />;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!produto) return <div className={styles.error}>Produto nao encontrado</div>;

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.warning("Selecione um tamanho.");
      return;
    }

    if (Number(selectedVariacao?.estoque || 0) <= 0) return;

    addToCart({ ...produto, selectedSize });
  };

  const handleRestockButtonClick = async () => {
    if (!isSelectedSizeSoldOut) return;
    if (!selectedSize) {
      toast.warning("Selecione um tamanho.");
      return;
    }
    if (restockLoading || hasRequestedRestock) return;

    if (!signed) {
      setShowGuestEmailInput(true);
      return;
    }

    await submitRestockRequest();
  };

  const submitRestockRequest = async (guestEmailInput = "") => {
    if (!selectedSize || !isSelectedSizeSoldOut || restockLoading || hasRequestedRestock) return;

    const payload = {
      produto_id: produto.id_produto,
      variacao: selectedSize,
    };

    if (signed) {
      if (user?.email) payload.email = user.email;
    } else {
      const email = String(guestEmailInput || guestEmail).trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error("Digite um e-mail valido.");
        return;
      }
      payload.email = email;
    }

    setRestockLoading(true);
    try {
      await api.post("/products/restock-request", payload);
      setRestockRequests((prev) => ({ ...prev, [selectedSize]: true }));
      setShowGuestEmailInput(false);
      setGuestEmail("");
      toast.success("Avisaremos quando este tamanho voltar ao estoque");
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
        <ImageGallery fotos={produto.fotos} productName={produto.nome_produto} />

        <ProductInfo
          produto={produto}
          variacoes={variacoes}
          selectedSize={selectedSize}
          setSelectedSize={setSelectedSize}
          handleAddToCart={handleAddToCart}
          isSelectedSizeSoldOut={isSelectedSizeSoldOut}
          onRestockRequest={handleRestockButtonClick}
          onGuestRestockSubmit={() => submitRestockRequest()}
          restockLoading={restockLoading}
          hasRequestedRestock={hasRequestedRestock}
          signed={signed}
          showGuestEmailInput={showGuestEmailInput}
          guestEmail={guestEmail}
          setGuestEmail={setGuestEmail}
        />
      </div>

      <RelatedProducts products={relatedProducts} createSlug={createSlug} />
    </div>
  );
}
