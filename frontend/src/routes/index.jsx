import React, { useEffect } from 'react'; // Importado useEffect
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import useAuth from "../hooks/useAuth";

// Pages
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

// ============================
// Component: ScrollUp
// ============================
// Força o scroll para o topo apenas quando este wrapper é utilizado
const ScrollUp = ({ children }) => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    // Em vez de (0,0), passamos um objeto com o comportamento 'smooth'
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth' // Esta é a linha que cria a animação
    });
  }, [pathname]);

  return children;
};

// ============================
// Component: RequireAuth
// ============================
function RequireAuth({ children, role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh] text-gray-500">
        <span className="animate-pulse">Verificando sessão...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/entrar" state={{ from: location }} replace />;
  }

  if (role && Number(user.role) !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// ============================
// Rotas principais
// ============================
export default function AppRoutes() {
  return (
    <Routes>
      {/* Rotas públicas padrão (mantêm posição do scroll) */}
      <Route path="/" element={<ScrollUp><LandingPage /></ScrollUp>} />
      <Route path="/entrar" element={<Entrar />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/produto/:slug" element={<ProductDetail />} />

      {/* Rotas ESPECÍFICAS que resetam o scroll para o topo */}
      <Route path="/atendimento" element={<ScrollUp><Atendimento /></ScrollUp>} />
      <Route path="/trocas-devolucoes" element={<ScrollUp><TrocasDevolucoes /></ScrollUp>} />
      <Route path="/termos-de-uso" element={<ScrollUp><TermosDeUso /></ScrollUp>} />
      <Route path="/privacidade" element={<ScrollUp><Privacidade /></ScrollUp>} />
      <Route path="/about-us" element={<ScrollUp><About /></ScrollUp>} />

      {/* Rotas protegidas (Usuários logados) */}
      <Route 
        path="/account" 
        element={
          <RequireAuth>
            <Profile />
          </RequireAuth>
        } 
      />

      <Route 
        path="/checkout" 
        element={
          <RequireAuth>
            <Checkout />
          </RequireAuth>
        } 
      />

      {/* Rotas Admin (role=1) */}
      <Route 
        path="/admin/*" 
        element={
          <RequireAuth role={1}>
            <AdminPainel />
          </RequireAuth>
        } 
      />

      {/* Rota 404 - Página não encontrada */}
      <Route path="*" element={<Page404 />} />
    </Routes>
  );
}