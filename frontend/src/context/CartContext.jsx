import { createContext, useState, useContext, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import { useNavigate } from "react-router-dom";

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

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  const addToCart = (product) => {
    if (!user) {
      alert("Você precisa estar logado para adicionar itens ao carrinho.");
      navigate("/entrar");
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
      }}
    >
      {children}
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
