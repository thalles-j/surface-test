import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuth from "../hooks/useAuth";

// Páginas críticas no boot (eager)
import LandingPage from '../pages/LandingPage';
import Page404 from '../pages/Page404';

// Páginas pesadas carregadas sob demanda
const Shop = lazy(() => import('../pages/Shop'));
const ProductDetail = lazy(() => import('../pages/ProductDetail'));
const Entrar = lazy(() => import('../pages/Entrar'));
const Profile = lazy(() => import('../pages/Profile'));
const AdminPainel = lazy(() => import('../pages/Admin'));
const About = lazy(() => import('../pages/About'));
const Atendimento = lazy(() => import('../pages/Atendimento'));
const TrocasDevolucoes = lazy(() => import('../pages/TrocasDevolucoes'));
const TermosDeUso = lazy(() => import('../pages/TermosDeUso'));
const Privacidade = lazy(() => import('../pages/Privacidade'));
const Checkout = lazy(() => import('../pages/Checkout'));

function LazyFallback() {
  return <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}>Carregando...</div>;
}

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

// =========================================
// Rotas Principais
// =========================================
export default function AppRoutes() {
  return (
    <Suspense fallback={<LazyFallback />}>
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

      <Route path="/checkout" element={<Checkout />} />

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
    </Suspense>
  );
}
