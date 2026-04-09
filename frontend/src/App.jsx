import { useEffect, useState } from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import Header from './components/Header';
import Footer from './components/Footer';
import AppRoutes from './routes';
import PageLoader from './components/PageLoader';
import CartDrawer from './components/CartDrawer';
import StoreClosed from './components/StoreClosed';
import { setOnMaintenance, setEarlyAccessEmail } from './services/api';

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
  const [storeClosed, setStoreClosed] = useState(false);

  useEffect(() => {
    setOnMaintenance(() => {
      setStoreClosed(true);
    });
  }, []);

  const handleEarlyAccess = (email) => {
    setEarlyAccessEmail(email);
    setStoreClosed(false);
  };

  useEffect(() => {
    function autoLightMode() {
      const bodyBg = getComputedStyle(document.body).backgroundColor;
      const rgb = bodyBg.match(/\d+/g);
      if (!rgb) return;

      const brightness =
        (parseInt(rgb[0], 10) * 299 + parseInt(rgb[1], 10) * 587 + parseInt(rgb[2], 10) * 114) /
        1000;

      if (brightness > 200) {
        document.body.classList.add('light-mode');
      } else {
        document.body.classList.remove('light-mode');
      }
    }

    autoLightMode();
    const observer = new MutationObserver(autoLightMode);
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });

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
      <ToastProvider>
        <Router>
          <CartProvider>
            {loading && <PageLoader />}
            {storeClosed ? <StoreClosed onEarlyAccess={handleEarlyAccess} /> : <AppLayout />}
          </CartProvider>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}
