import { useEffect, useState } from "react";
import { BrowserRouter as Router, useLocation } from 'react-router-dom'; 
import { AuthProvider } from './context/AuthContext.jsx'; 
import { CartProvider } from './context/CartContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx'; // 1. Importei o ToastProvider aqui
import Header from "./components/Header";
import Footer from "./components/Footer"; 
import AppRoutes from './routes';
import PageLoader from "./components/PageLoader";
import CartDrawer from "./components/CartDrawer";

// Componente que renderiza condicionalmente Header/Footer
function AppLayout() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <>
      {!isAdmin && <Header />}
      <CartDrawer />
      <main>
        <AppRoutes />
      </main>
      {!isAdmin && <Footer />}
    </>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function autoLightMode() {
      const bodyBg = getComputedStyle(document.body).backgroundColor;
      const rgb = bodyBg.match(/\d+/g);
      if (!rgb) return;

      const brightness = (parseInt(rgb[0])*299 + parseInt(rgb[1])*587 + parseInt(rgb[2])*114)/1000;
      if (brightness > 200) {
        document.body.classList.add("light-mode");
      } else {
        document.body.classList.remove("light-mode");
      }
    }

    autoLightMode();
    const observer = new MutationObserver(autoLightMode);
    observer.observe(document.body, { attributes: true, attributeFilter: ["style"] });

    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => {
      observer.disconnect();
      clearTimeout(timer); 
    };
  }, []);

  return (
    <AuthProvider>
      {/* 2. Envolvi a aplicação com o ToastProvider aqui */}
      <ToastProvider>
        <Router> 
          <CartProvider>
            {loading && <PageLoader />}
            <AppLayout />
          </CartProvider>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}