import { createContext, useState, useContext, useEffect, useCallback, useRef } from "react";
import { api } from "../services/api";
import AlertModal from "../components/AlertModal";

export const CartContext = createContext({});

const PRE_CHECKOUT_DEFAULTS = {
  nome: "",
  email: "",
  telefone: "",
  endereco: "",
  tipo_pagamento: "PIX",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  cep: "",
};

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [preCheckoutData, setPreCheckoutData] = useState(PRE_CHECKOUT_DEFAULTS);

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
        const parsed = JSON.parse(savedPreCheckout);
        setPreCheckoutData({
          ...PRE_CHECKOUT_DEFAULTS,
          ...(parsed && typeof parsed === "object" ? parsed : {}),
        });
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
    const quantityToAdd = Math.max(1, Number(product?.quantity) || 1);
    const productStatus = String(product?.status || "").toLowerCase();
    const variations = Array.isArray(product?.variacoes_estoque)
      ? product.variacoes_estoque
      : [];
    const hasVariations = variations.length > 0;
    const selectedVariation = variations.find(
      (item) =>
        item?.tamanho === product?.selectedSize ||
        item?.sku === product?.sku_variacao
    );

    if (productStatus && productStatus !== "ativo") {
      showAlertModal({
        title: "Produto indisponivel",
        message: "Este produto esta inativo e nao pode ser adicionado ao carrinho.",
        type: "error",
      });
      return;
    }

    if (hasVariations && !selectedVariation) {
      showAlertModal({
        title: "Tamanho indisponivel",
        message: "Selecione um tamanho disponivel para continuar.",
        type: "error",
      });
      return;
    }

    if (selectedVariation && Number(selectedVariation.estoque || 0) <= 0) {
      showAlertModal({
        title: "Sem estoque",
        message: "O tamanho selecionado esta indisponivel no momento.",
        type: "error",
      });
      return;
    }

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
        updated[index] = {
          ...updated[index],
          quantity: updated[index].quantity + quantityToAdd,
        };
        return updated;
      }

      return [
        ...prevItems,
        {
          ...product,
          quantity: quantityToAdd,
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
    setPreCheckoutData(PRE_CHECKOUT_DEFAULTS);
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
