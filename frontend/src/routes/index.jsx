import { Routes, Route, Navigate } from 'react-router-dom';
import useAuth from "../hooks/useAuth";
import { useCart } from "../context/CartContext";
import { isPreCheckoutComplete } from "../utils/preCheckout";

//pages
import LandingPage from '../pages/LandingPage';
import Shop from '../pages/Shop';
import ProductDetail from '../pages/ProductDetail';
import Entrar from '../pages/Entrar';
import Page404 from '../pages/Page404';
import Profile from '../pages/Profile';
import AdminPainel from '../pages/Admin';
import About from '../pages/About';
import Atendimento from '../pages/Atendimento';
import TrocasDevolucoes from '../pages/TrocasDevolucoes';
import TermosDeUso from '../pages/TermosDeUso';
import Privacidade from '../pages/Privacidade';
import Checkout from '../pages/Checkout';
import PreCheckout from '../pages/PreCheckout';

// ======================
// ProtectedRoute
// ======================
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();


  if (loading) {
    return <div style={{ display:'flex', justifyContent:'center', padding: 50 }}>Carregando sessão...</div>;
  }

  if (!user) {
    return <Navigate to="/entrar" replace />;
  }

  return children;
}

// =========================================
// 2. Rota de Admin (Para Role 1)
// =========================================
function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  // --- MESMA CORREÇÃO AQUI ---
  if (loading) {
    return <div>Verificando permissões...</div>;
  }

  if (!user) {
    return <Navigate to="/entrar" replace />;
  }

  if (Number(user.role) !== 1) {
    console.log("Acesso negado. Role do usuário:", user.role);
    return <Navigate to="/" replace />;
  }

  return children;
}

function CheckoutGuard({ children }) {
  const { preCheckoutData } = useCart();

  if (!isPreCheckoutComplete(preCheckoutData)) {
    return <Navigate to="/pre-checkout" replace />;
  }

  return children;
}

// =========================================
// Rotas Principais
// =========================================
export default function AppRoutes() {
  
  return (
    <Routes>
      {/* Rotas Públicas */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/entrar" element={<Entrar />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/produto/:slug" element={<ProductDetail />} />
      <Route path="/about-us" element={<About />} />
      <Route path="/atendimento" element={<Atendimento />} />
      <Route path="/trocas-devolucoes" element={<TrocasDevolucoes />} />
      <Route path="/termos-de-uso" element={<TermosDeUso />} />
      <Route path="/privacidade" element={<Privacidade />} />
      <Route path="/pre-checkout" element={<PreCheckout />} />

      <Route
        path="/checkout"
        element={
          <CheckoutGuard>
            <Checkout />
          </CheckoutGuard>
        }
      />

      <Route 
        path="/admin/*" 
        element={
          <AdminRoute>
            <AdminPainel />
          </AdminRoute>
        } 
      />

       <Route 
        path="/account" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
      
      <Route path="*" element={<Page404 />} />
    </Routes>
  );
}
