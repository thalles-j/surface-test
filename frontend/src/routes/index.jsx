import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
function ProtectedRoute({ element }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/entrar" replace />;

  return element;
}

// ======================
// AdminRoute
// ======================
function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    // Substitua o null por algo visual para você saber que está carregando
    return <div>Carregando verificação de admin...</div>; 
  }

  if (!user) {
    console.log("AdminRoute: Usuário não logado.");
    return <Navigate to="/entrar" replace />;
  }

  // --- AQUI ESTÁ O DEBUG ---
  console.log("AdminRoute: Usuário carregado:", user);
  console.log("Role do usuário:", user.role, "| Tipo:", typeof user.role);
  
  // Verifique se role é 1 (number) ou "1" (string)
  // Use != (dois iguais) para aceitar string "1" ou number 1, se preferir
  if (user.role != 1) { 
    console.log("AdminRoute: Acesso negado. Role incorreto.");
    return <Navigate to="/" replace />;
  }

  return children;
}



// ======================
// Rotas
// ======================
export default function AppRoutes() {
  return (
    <Routes> 
      <Route path="/" element={<LandingPage />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/produto/:id" element={<ProductDetail />} />
      <Route path="/entrar" element={<Entrar />} />

      <Route
        path="/conta"
        element={<ProtectedRoute element={<Profile />} />}
      />

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminPainel />
          </AdminRoute>
        }
      />

      <Route path="*" element={<Page404 />} />
    </Routes>
  );
}
