import { createContext, useState, useContext, useEffect, useCallback } from "react";
import { AuthContext } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import AlertModal from "../components/AlertModal";

export const CartContext = createContext({});

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Load cart from localStorage on mount (optional, if we want persistence across refreshes)
  useEffect(() => {
    const savedCart = localStorage.getItem("cartItems");
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    actionLabel: null,
    actionCallback: null,
  });

  const showAlertModal = ({ title = '', message = '', type = 'info', actionLabel = null, actionCallback = null }) => {
    setAlertModal({ isOpen: true, title, message, type, actionLabel, actionCallback });
  };

  const hideAlertModal = () => setAlertModal(prev => ({ ...prev, isOpen: false }));

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  const addToCart = (product) => {
    if (!user) {
      showAlertModal({
        title: 'Login necessário',
        message: 'Você precisa estar logado para adicionar itens ao carrinho.',
        type: 'auth',
        actionLabel: 'Entrar',
        actionCallback: () => navigate('/entrar')
      });
      return;
    }

    setCartItems((prevItems) => {
      const itemExists = prevItems.find((item) => item.id_produto === product.id_produto && item.selectedSize === product.selectedSize);
      if (itemExists) {
        return prevItems.map((item) =>
          item.id_produto === product.id_produto && item.selectedSize === product.selectedSize
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevItems, { ...product, quantity: 1 }];
      }
    });
    setIsCartOpen(true); // Open cart when item is added
  };

  const removeFromCart = (productId, selectedSize) => {
    setCartItems((prevItems) => prevItems.filter((item) => !(item.id_produto === productId && item.selectedSize === selectedSize)));
  };

  const updateQuantity = (productId, selectedSize, amount) => {
    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id_produto === productId && item.selectedSize === selectedSize) {
          const newQuantity = item.quantity + amount;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce((total, item) => total + Number(item.preco) * item.quantity, 0);

  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const createOrder = useCallback(async (codigoCupom = null) => {
    if (cartItems.length === 0) return null;
    setCheckoutLoading(true);
    try {
      const items = cartItems.map(item => ({
        id_produto: item.id_produto,
        selectedSize: item.selectedSize,
        sku_variacao: item.sku_variacao || null,
        quantity: item.quantity,
      }));
      const { data } = await api.post('/orders', { items, codigo_cupom: codigoCupom });
      clearCart();
      return data;
    } finally {
      setCheckoutLoading(false);
    }
  }, [cartItems]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isCartOpen,
        toggleCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        showAlertModal,
        hideAlertModal,
        createOrder,
        checkoutLoading,
      }}
    >
      {children}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={hideAlertModal}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        actionLabel={alertModal.actionLabel}
        actionCallback={alertModal.actionCallback}
      />
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart deve ser usado dentro de um CartProvider");
  }
  return context;
}
