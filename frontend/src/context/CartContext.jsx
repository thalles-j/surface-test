import { createContext, useState, useContext, useEffect, useCallback, useRef } from "react";
import { api } from "../services/api";
import AlertModal from "../components/AlertModal";

export const CartContext = createContext({});

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [preCheckoutData, setPreCheckoutData] = useState({
    nome: "",
    email: "",
    telefone: "",
  });

  const [shouldOpenCart, setShouldOpenCart] = useState(false);

  // ANTI DUPLICACAO
  const lastAddedRef = useRef(null);

  // LOAD LOCAL STORAGE
  useEffect(() => {
    const savedCart = localStorage.getItem("cartItems");

    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch {
        localStorage.removeItem("cartItems");
      }
    }

    const savedPreCheckout = localStorage.getItem("preCheckoutData");
    if (savedPreCheckout) {
      try {
        setPreCheckoutData(JSON.parse(savedPreCheckout));
      } catch {
        localStorage.removeItem("preCheckoutData");
      }
    }
  }, []);

  // SAVE LOCAL STORAGE
  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem("preCheckoutData", JSON.stringify(preCheckoutData));
  }, [preCheckoutData]);

  // ALERT MODAL
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
    setAlertModal({
      isOpen: true,
      title,
      message,
      type,
      actionLabel,
      actionCallback,
    });
  };

  const hideAlertModal = () =>
    setAlertModal((prev) => ({ ...prev, isOpen: false }));

  // CART CONTROL
  const toggleCart = () => setIsCartOpen((prev) => !prev);
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  // ADD TO CART
  const addToCart = (product, options = {}) => {
    const { openDrawer = true } = options;

    const key = `${product.id_produto}-${product.selectedSize}`;

    // Bloqueia duplicacao em milissegundos (StrictMode / double click)
    if (lastAddedRef.current === key) return;
    lastAddedRef.current = key;

    setTimeout(() => {
      lastAddedRef.current = null;
    }, 300);

    setCartItems((prevItems) => {
      const index = prevItems.findIndex(
        (item) =>
          item.id_produto === product.id_produto &&
          item.selectedSize === product.selectedSize
      );

      if (index !== -1) {
        const updated = [...prevItems];
        updated[index].quantity += 1;
        return updated;
      }

      return [
        ...prevItems,
        {
          ...product,
          quantity: 1,
        },
      ];
    });

    if (openDrawer) openCart();
  };

  // REMOVE
  const removeFromCart = (productId, selectedSize) => {
    setCartItems((prevItems) =>
      prevItems.filter(
        (item) =>
          !(
            item.id_produto === productId &&
            item.selectedSize === selectedSize
          )
      )
    );
  };

  // UPDATE QTD
  const updateQuantity = (productId, selectedSize, amount) => {
    setCartItems((prevItems) =>
      prevItems
        .map((item) => {
          if (
            item.id_produto === productId &&
            item.selectedSize === selectedSize
          ) {
            const newQuantity = item.quantity + amount;

            if (newQuantity <= 0) return null;

            return { ...item, quantity: newQuantity };
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  // CLEAR
  const clearCart = () => {
    setCartItems([]);
    setPreCheckoutData({ nome: "", email: "", telefone: "" });
  };

  // TOTAL
  const cartTotal = cartItems.reduce(
    (total, item) => total + Number(item.preco) * item.quantity,
    0
  );

  // CREATE ORDER
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const createOrder = useCallback(async (codigoCupom = null, cliente = null) => {
    if (cartItems.length === 0) return null;

    setCheckoutLoading(true);

    try {
      const items = cartItems.map((item) => ({
        id_produto: item.id_produto,
        selectedSize: item.selectedSize,
        sku_variacao: item.sku_variacao || null,
        quantity: item.quantity,
      }));

      const { data } = await api.post("/orders", {
        items,
        codigo_cupom: codigoCupom,
        cliente: cliente || preCheckoutData,
      });

      clearCart();
      return data;
    } catch (error) {
      const message =
        error?.response?.data?.mensagem ||
        error?.response?.data?.message ||
        "Nao foi possivel finalizar o pedido.";

      showAlertModal({
        title: "Erro no pedido",
        message,
        type: "error",
      });

      throw error;
    } finally {
      setCheckoutLoading(false);
    }
  }, [cartItems, preCheckoutData]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isCartOpen,
        toggleCart,
        openCart,
        closeCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        showAlertModal,
        hideAlertModal,
        createOrder,
        checkoutLoading,
        preCheckoutData,
        setPreCheckoutData,
        shouldOpenCart,
        setShouldOpenCart,
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
