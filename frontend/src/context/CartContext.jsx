import { createContext, useState, useContext, useEffect, useCallback } from "react";
import { AuthContext } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import AlertModal from "../components/AlertModal";
import { api } from "../services/api";
import { buildWhatsAppCheckoutUrl } from "../utils/whatsapp";

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
    if (cartItems.length === 0) {
      showAlertModal({ title: 'Carrinho vazio', message: 'Adicione itens ao carrinho antes de finalizar.', type: 'info' });
      return null;
    }
    if (!user) {
      showAlertModal({
        title: 'Login necessário',
        message: 'Faça login para finalizar a compra.',
        type: 'auth',
        actionLabel: 'Entrar',
        actionCallback: () => navigate('/entrar'),
      });
      return null;
    }

    setCheckoutLoading(true);
    try {
      const items = cartItems.map((item) => ({
        id_produto: item.id_produto,
        selectedSize: item.selectedSize,
        sku_variacao: item.sku_variacao || null,
        quantity: item.quantity,
      }));

      const { data: order } = await api.post('/orders', { items, codigo_cupom: codigoCupom });

      // Build WhatsApp URL with full financial breakdown
      const whatsappUrl = buildWhatsAppCheckoutUrl({
        customerName: user.nome,
        items: cartItems,
        total: Number(order.total),
        orderId: order.id_pedido,
        subtotal: order.subtotal != null ? Number(order.subtotal) : null,
        desconto: order.desconto != null ? Number(order.desconto) : null,
        frete: order.frete != null ? Number(order.frete) : null,
        codigoCupom: order.codigo_cupom,
      });

      clearCart();
      setIsCartOpen(false);

      window.open(whatsappUrl, '_blank');

      showAlertModal({
        title: 'Pedido criado!',
        message: `Pedido #${order.id_pedido} registrado com sucesso. Você será redirecionado para o WhatsApp.`,
        type: 'info',
      });

      return order;
    } catch (error) {
      const msg = error.response?.data?.mensagem || error.response?.data?.erro || error.response?.data?.message || 'Erro ao criar pedido.';
      showAlertModal({ title: 'Erro no pedido', message: msg, type: 'info' });
      return null;
    } finally {
      setCheckoutLoading(false);
    }
  }, [cartItems, user, cartTotal, navigate]);

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
        createOrder,
        checkoutLoading,
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
