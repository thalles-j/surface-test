import { createContext, useState, useContext, useEffect, useRef } from "react";
import { AuthContext } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import AlertModal from "../components/AlertModal";
import { api } from "../services/api";
import { useToast } from "./ToastContext";

export const CartContext = createContext({});

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();
  const addLocksRef = useRef(new Set());

  useEffect(() => {
    const savedCart = localStorage.getItem("cartItems");
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    actionLabel: null,
    actionCallback: null,
  });

  const showAlertModal = ({
    title = "",
    message = "",
    type = "info",
    actionLabel = null,
    actionCallback = null,
  }) => {
    setAlertModal({ isOpen: true, title, message, type, actionLabel, actionCallback });
  };

  const hideAlertModal = () => setAlertModal((prev) => ({ ...prev, isOpen: false }));

  const toggleCart = () => {
    setIsCartOpen((prev) => !prev);
  };

  const addToCart = (product, options = {}) => {
    const { openCart = true } = options;

    if (!user) {
      showAlertModal({
        title: "Login necessario",
        message: "Voce precisa estar logado para adicionar itens ao carrinho.",
        type: "auth",
        actionLabel: "Entrar",
        actionCallback: () => navigate("/entrar"),
      });
      return false;
    }

    const lockKey = `${product.id_produto}-${product.selectedSize || "default"}`;
    if (addLocksRef.current.has(lockKey)) {
      return false;
    }

    addLocksRef.current.add(lockKey);
    setTimeout(() => {
      addLocksRef.current.delete(lockKey);
    }, 300);

    setCartItems((prevItems) => {
      const itemExists = prevItems.find(
        (item) =>
          item.id_produto === product.id_produto && item.selectedSize === product.selectedSize
      );

      if (itemExists) {
        return prevItems.map((item) =>
          item.id_produto === product.id_produto && item.selectedSize === product.selectedSize
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prevItems, { ...product, quantity: 1 }];
    });

    if (openCart) {
      setIsCartOpen(true);
    }

    return true;
  };

  const removeFromCart = (productId, selectedSize) => {
    setCartItems((prevItems) =>
      prevItems.filter(
        (item) => !(item.id_produto === productId && item.selectedSize === selectedSize)
      )
    );
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

  const createOrder = async (codigoCupom = null) => {
    if (!cartItems.length) return null;

    setCheckoutLoading(true);
    try {
      const payload = {
        items: cartItems.map((item) => ({
          id_produto: item.id_produto,
          selectedSize: item.selectedSize,
          sku_variacao: item.sku_variacao || null,
          quantity: item.quantity,
        })),
        codigo_cupom: codigoCupom || null,
      };

      const { data } = await api.post("/orders", payload);
      clearCart();
      setIsCartOpen(false);
      toast.success("Pedido criado com sucesso.");
      return data;
    } catch (error) {
      const message =
        error.response?.data?.mensagem ||
        error.response?.data?.error ||
        "Nao foi possivel finalizar seu pedido.";
      toast.error(message);
      return null;
    } finally {
      setCheckoutLoading(false);
    }
  };

  const cartTotal = cartItems.reduce(
    (total, item) => total + Number(item.preco) * item.quantity,
    0
  );

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
        createOrder,
        checkoutLoading,
        cartTotal,
        showAlertModal,
        hideAlertModal,
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
