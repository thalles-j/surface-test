import { useEffect, useLayoutEffect, useState } from "react";
import { BrowserRouter as Router, useLocation } from 'react-router-dom'; 
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { ThemeProvider, applyThemeAttribute, LIGHT_THEME } from './context/ThemeContext.jsx';
import Header from "./components/Header";
import Footer from "./components/Footer"; 
import AppRoutes from './routes';
import PageLoader from "./components/PageLoader";
import { CartProvider } from './context/CartContext.jsx';
import CartDrawer from "./components/CartDrawer";
import StoreClosed from "./components/StoreClosed";
import { setOnMaintenance, setEarlyAccessEmail } from './services/api';
import useTheme from "./hooks/useTheme";

function ThemeRouteSync() {
  const location = useLocation();
  const { theme } = useTheme();
  const isAdmin = location.pathname.startsWith('/admin');

  useLayoutEffect(() => {
    applyThemeAttribute(isAdmin ? theme : LIGHT_THEME);
  }, [isAdmin, theme]);

  return null;
}

// 🔥 Componente modificado para esconder Header/Footer no Checkout
function AppLayout() {
  const location = useLocation();
  
  // Verifica se a página atual deve esconder o Header e o Footer
  const hideHeaderFooter = 
    location.pathname.startsWith('/admin') || 
    location.pathname === '/checkout' || 
    location.pathname === '/pre-checkout';

  return (
    <>
      {!hideHeaderFooter && <Header />}
      <CartDrawer />
      <main>
        <AppRoutes />
      </main>
      {!hideHeaderFooter && <Footer />}
    </>
  );
}

export default function App() {

  const [loading, setLoading] = useState(true);
  const [storeClosed, setStoreClosed] = useState(false);

  useEffect(() => {
    // Listen for 503 maintenance responses
    setOnMaintenance(() => {
      setStoreClosed(true);
    });
  }, []);

  const handleEarlyAccess = (email) => {
    setEarlyAccessEmail(email);
    setStoreClosed(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => {
      clearTimeout(timer); 
    };
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Router> 
            <CartProvider>
              <ThemeRouteSync />
              {loading && <PageLoader />}
              {storeClosed ? (
                <StoreClosed onEarlyAccess={handleEarlyAccess} />
              ) : (
                <AppLayout />
              )}
            </CartProvider>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}