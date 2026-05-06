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
  setSelectedSize,
}) {
  const [expandedSection, setExpandedSection] = useState(null);
  const [loading, setLoading] = useState(false);

  const { showAlertModal, addToCart } = useCart();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const isProductInactive = String(produto.status || '').toLowerCase() !== 'ativo';
  const hasVariations = variacoes.length > 0;
  const availableVariacoes = isProductInactive
    ? variacoes
    : variacoes.filter((v) => Number(v?.estoque || 0) > 0);
  const selectedVariacao = variacoes.find((v) => v.tamanho === selectedSize);
  const isSoldOut = !!selectedSize && Number(selectedVariacao?.estoque || 0) <= 0;
  const isAllSoldOut = !isProductInactive && hasVariations && availableVariacoes.length === 0;

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const buildCartItem = () => ({
    ...produto,
    id_produto: produto.id_produto || produto.id,
    selectedSize: hasVariations ? (selectedSize || 'Unico') : 'Unico',
  });

  const canPurchase = () => {
    if (loading || isSoldOut || isAllSoldOut || isProductInactive) return false;
    if (hasVariations && !selectedSize) return false;
    return true;
  };

  const runIfGuestOrContinue = (onContinue) => {
    if (user) {
      onContinue();
      return;
    }
    showAlertModal({
      title: 'Identificacao',
      message: 'Voce nao esta logado. Entre para salvar seus dados ou continue como convidado.',
      type: 'auth',
      actionLabel: 'Entrar',
      actionCallback: () => navigate('/entrar'),
      dismissLabel: 'Continuar como convidado',
      dismissCallback: () => {
        onContinue();
      },
    });
  };

  const handleBuyNow = () => {
    if (!canPurchase()) return;
    runIfGuestOrContinue(() => {
      setLoading(true);
      addToCart(buildCartItem(), { openDrawer: false });
      setLoading(false);
      navigate('/checkout');
    });
  };

  const handleAddToCart = () => {
    if (!canPurchase()) return;
    runIfGuestOrContinue(() => {
      setLoading(true);
      addToCart(buildCartItem(), { openDrawer: true });
      setLoading(false);
    });
  };

  const handleNotifyMe = async () => {
    if (!user) {
      showAlertModal({
        title: 'Login necessario',
        message: 'Voce precisa estar logado para ser avisado.',
        type: 'auth',
        actionLabel: 'Entrar',
        actionCallback: () => navigate('/entrar'),
      });
      return;
    }

    try {
      await api.post('/notify-me', {
        id_produto: produto.id_produto || produto.id,
        tamanho: selectedSize,
      });

      showAlertModal({
        title: 'Aviso ativado',
        message: 'Te avisaremos quando voltar ao estoque.',
        type: 'success',
      });
    } catch (err) {
      showAlertModal({
        title: 'Erro',
        message: err?.response?.data?.message || 'Nao foi possivel ativar o aviso.',
        type: 'error',
      });
    }
  };

  return (
    <div className={styles.infoSection}>
      <h1 className={styles.productName}>{produto.nome_produto}</h1>
      <p className={styles.productPrice}>R$ {parseFloat(produto.preco).toFixed(2)}</p>

      <div className={styles.accordions}>
        <div className={styles.accordion}>
          <button
            className={styles.accordionHeader}
            onClick={() => toggleSection('description')}
          >
            <span>Descricao</span>
            <span>{expandedSection === 'description' ? '?' : '?'}</span>
          </button>

          {expandedSection === 'description' && (
            <div className={styles.accordionContent}>
              <p>{produto.descricao || 'Sem descricao disponivel'}</p>
            </div>
          )}
        </div>
      </div>

      {variacoes.length > 0 && (
        <div className={styles.sizeSection}>
          <div className={styles.sizeButtons}>
            {isProductInactive
              ? variacoes.map((v) => (
                  <button
                    key={v.sku || v.tamanho}
                    className={`${styles.sizeBtn} ${styles.disabled}`}
                    disabled
                  >
                    {v.tamanho} - ESGOTADO
                  </button>
                ))
              : availableVariacoes.map((v) => (
                  <button
                    key={v.sku || v.tamanho}
                    className={`${styles.sizeBtn} ${selectedSize === v.tamanho ? styles.selected : ''}`}
                    onClick={() => setSelectedSize(v.tamanho)}
                  >
                    {v.tamanho}
                  </button>
                ))}
          </div>

          {isAllSoldOut && (
            <p className={styles.stockMessage}>
              Todos os tamanhos estao esgotados no momento.
            </p>
          )}

          {isProductInactive && (
            <p className={styles.stockMessage}>
              Produto indisponivel. Nenhum tamanho pode ser comprado enquanto estiver inativo.
            </p>
          )}
        </div>
      )}

      <div className={styles.actions}>
        <button
          className={`${styles.buyBtn} ${(isSoldOut || isAllSoldOut || isProductInactive) ? styles.soldOut : ''}`}
          onClick={handleBuyNow}
          disabled={!selectedSize || isSoldOut || isAllSoldOut || isProductInactive}
        >
          {isProductInactive
            ? 'INDISPONIVEL'
            : (isSoldOut || isAllSoldOut)
              ? 'ESGOTADO'
              : (hasVariations && !selectedSize)
                ? 'SELECIONE UM TAMANHO'
                : (loading ? 'PROCESSANDO...' : 'COMPRAR')}
        </button>

        {!isProductInactive && !isSoldOut && !isAllSoldOut && (
          <button
            className={styles.cartBtn}
            onClick={handleAddToCart}
            disabled={!selectedSize || loading}
          >
            {loading ? 'ADICIONANDO...' : 'ADICIONAR AO CARRINHO'}
          </button>
        )}

        {!isProductInactive && (isSoldOut || isAllSoldOut) && selectedSize && (
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
