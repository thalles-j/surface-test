import { Routes, Route, Navigate } from 'react-router-dom';
import useAuth from "../hooks/useAuth";

//pages
import LandingPage from '../pages/LandingPage';
import Shop from '../pages/Shop';
import ProductDetail from '../pages/ProductDetail';
import Entrar from '../pages/Entrar';
import Page404 from '../pages/Page404';
import Profile from '../pages/Profile';
import AdminPainel from '../pages/Admin';

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
    <Routes>
      {/* Rotas Públicas */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/entrar" element={<Entrar />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/produto/:slug" element={<ProductDetail />} />
      

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