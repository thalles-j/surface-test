import React from "react";
import { useCart } from "../../context/CartContext";
import useAuth from "../../hooks/useAuth";
import styles from "./style.module.css";
import { useNavigate } from "react-router-dom";
import { resolveImageUrl } from "../../utils/resolveImageUrl";

export default function CartDrawer() {
  const {
    cartItems,
    isCartOpen,
    toggleCart,
    removeFromCart,
    updateQuantity,
    cartTotal,
    showAlertModal,
    hideAlertModal,
  } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const getImageUrl = (path) => {
    if (!path) return "https://via.placeholder.com/80?text=No+Image";
    return resolveImageUrl(path);
  };

  const getFrontImage = (fotos) => {
    if (!fotos || !Array.isArray(fotos) || fotos.length === 0) return null;
    const principal = fotos.find((f) => f.principal);
    if (principal) return principal.url;
    return fotos[0]?.url;
  };

  if (!isCartOpen) return null;

  const proceedToCheckout = () => {
    toggleCart();
    navigate('/checkout');
  };

  const handleCheckout = () => {
    if (user) {
      proceedToCheckout();
      return;
    }
    showAlertModal({
      title: 'Identificacao',
      message: 'Voce nao esta logado. Entre para salvar seus dados ou continue como convidado.',
      type: 'auth',
      actionLabel: 'Entrar',
      actionCallback: () => {
        toggleCart();
        navigate('/entrar');
      },
      dismissLabel: 'Continuar como convidado',
      dismissCallback: () => {
        proceedToCheckout();
      },
    });
  };

  return (
    <div className={`${styles.cartDrawerOverlay} ${isCartOpen ? styles.open : ""}`} onClick={toggleCart}>
      <div className={styles.cartDrawer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Carrinho de compras</h2>
          <button className={styles.closeButton} onClick={toggleCart}>
            &times;
          </button>
        </div>

        <div className={styles.itemsList}>
          {cartItems.length === 0 ? (
            <p className={styles.emptyCart}>Seu carrinho está vazio.</p>
          ) : (
            cartItems.map((item, index) => (
              <div key={`${item.id_produto}-${item.selectedSize || index}`} className={styles.cartItem}>
                <img
                  src={getImageUrl(getFrontImage(item.fotos))}
                  alt={item.nome_produto}
                  className={styles.itemImage}
                  onError={(e) => { e.target.src = "https://via.placeholder.com/80?text=Error"; }}
                />
                <div className={styles.itemDetails}>
                  <h3>{item.nome_produto}</h3>
                  {item.selectedSize && <p>Tamanho: {item.selectedSize}</p>}
                  <p className={styles.itemPrice}>
                    R$ {Number(item.preco).toFixed(2)}
                  </p>
                  <div className={styles.quantityControls}>
                    <button
                      className={styles.qtyButton}
                      onClick={() => updateQuantity(item.id_produto, item.selectedSize, -1)}
                    >
                      -
                    </button>
                    <span className={styles.quantity}>{item.quantity}</span>
                    <button
                      className={styles.qtyButton}
                      onClick={() => updateQuantity(item.id_produto, item.selectedSize, 1)}
                    >
                      +
                    </button>
                    <button
                      className={styles.removeButton}
                      onClick={() => removeFromCart(item.id_produto, item.selectedSize)}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.total}>
              <span>Total:</span>
              <span>R$ {cartTotal.toFixed(2)}</span>
            </div>
            <button className={styles.checkoutButton} onClick={handleCheckout}>
              Finalizar Compra
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
