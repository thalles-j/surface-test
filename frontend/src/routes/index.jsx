import React from 'react';
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
// Component: RequireAuth
// ============================
// role: number | undefined -> se definido, valida o role do usuário
function RequireAuth({ children, role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // UX de carregamento (utilizando classes do Tailwind)
    return (
      <div className="flex justify-center items-center h-[60vh] text-gray-500">
        <span className="animate-pulse">Verificando sessão...</span>
      </div>
    );
  }

  if (!user) {
    // Redireciona para login, salvando a rota original na qual o usuário tentou entrar
    return <Navigate to="/entrar" state={{ from: location }} replace />;
  }

  if (role && Number(user.role) !== role) {
    // Redireciona para a home se não tiver a permissão necessária (ex: não for admin)
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
      {/* Rotas públicas */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/entrar" element={<Entrar />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/produto/:slug" element={<ProductDetail />} />
      <Route path="/about-us" element={<About />} />
      <Route path="/atendimento" element={<Atendimento />} />
      <Route path="/trocas-devolucoes" element={<TrocasDevolucoes />} />
      <Route path="/termos-de-uso" element={<TermosDeUso />} />
      <Route path="/privacidade" element={<Privacidade />} />

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