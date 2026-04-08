import { useState, useContext } from 'react';
import styles from './style.module.css';
import { useCart } from '../../../../context/CartContext';
import { AuthContext } from '../../../../context/AuthContext';
import { api } from '../../../../services/api';
import { useNavigate } from 'react-router-dom';

export default function ProductInfo({ 
  produto, 
  variacoes, 
  selectedSize, 
  setSelectedSize
}) {
  const [expandedSection, setExpandedSection] = useState(null);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  const { showAlertModal, addToCart, toggleCart } = useCart();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const selectedVariacao = variacoes.find(v => v.tamanho === selectedSize);
  const isSoldOut = selectedSize && selectedVariacao?.estoque === 0;
  const isAllSoldOut =
    produto.status === 'inativo' ||
    (variacoes.length > 0 && variacoes.every(v => v.estoque === 0));

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // ============================
  // ADICIONAR AO CARRINHO
  // ============================
  const [loading, setLoading] = useState(false);

  const handleAddToCart = () => {
  if (!selectedSize || loading) return;

  setLoading(true);

  addToCart({
    ...produto,
    id_produto: produto.id_produto || produto.id,
    selectedSize: selectedSize || "Único"
  });

  setShouldOpenCart(true);
  navigate('/shop');
};

  

  // ============================
  // AVISE-ME
  // ============================
  const handleNotifyMe = async () => {
    if (!user) {
      showAlertModal({
        title: "Login necessário",
        message: "Você precisa estar logado para ser avisado.",
        type: "auth",
        actionLabel: "Entrar",
        actionCallback: () => navigate('/entrar')
      });
      return;
    }

    try {
      await api.post("/notify-me", {
        id_produto: produto.id_produto || produto.id,
        tamanho: selectedSize
      });

      showAlertModal({
        title: "Aviso ativado",
        message: "Te avisaremos quando voltar ao estoque.",
        type: "success"
      });

    } catch (err) {
      console.error("Erro notify-me:", err?.response?.data || err);

      showAlertModal({
        title: "Erro",
        message: err?.response?.data?.message || "Não foi possível ativar o aviso.",
        type: "error"
      });
    }
  };

  return (
    <div className={styles.infoSection}>
      <h1 className={styles.productName}>{produto.nome_produto}</h1>
      <p className={styles.productPrice}>
        R$ {parseFloat(produto.preco).toFixed(2)}
      </p>

      <div className={styles.accordions}>
        <div className={styles.accordion}>
          <button 
            className={styles.accordionHeader}
            onClick={() => toggleSection('description')}
          >
            <span>Descrição</span>
            <span>{expandedSection === 'description' ? '▲' : '▼'}</span>
          </button>

          {expandedSection === 'description' && (
            <div className={styles.accordionContent}>
              <p>{produto.descricao || "Sem descrição disponível"}</p>
            </div>
          )}
        </div>
      </div>

      {variacoes.length > 0 && (
        <div className={styles.sizeSection}>
          <div className={styles.sizeButtons}>
            {variacoes.map((v) => {
              const outOfStock = v.estoque === 0;

              return (
                <button
                  key={v.sku}
                  className={`${styles.sizeBtn} ${selectedSize === v.tamanho ? styles.selected : ""} ${outOfStock ? styles.disabled : ""}`}
                  onClick={() => setSelectedSize(v.tamanho)}
                >
                  {v.tamanho}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className={styles.actions}>
        
        <button
          className={`${styles.buyBtn} ${(isSoldOut || isAllSoldOut) ? styles.soldOut : ""}`}
          onClick={handleAddToCart}
          disabled={!selectedSize || isSoldOut || isAllSoldOut}
        >
          {!selectedSize
            ? "SELECIONE UM TAMANHO"
            : (isSoldOut || isAllSoldOut)
            ? "ESGOTADO"
            : "COMPRAR"}
        </button>

        {!isSoldOut && !isAllSoldOut && (
          <button
            className={styles.cartBtn}
            onClick={handleAddToCart}
            disabled={!selectedSize}
          >
            ADICIONAR AO CARRINHO
          </button>
        )}

        {(isSoldOut || isAllSoldOut) && selectedSize && (
          <button
            className={styles.cartBtn}
            onClick={handleNotifyMe}
          >
            AVISE-ME
          </button>
        )}

      </div>
    </div>
  );
}