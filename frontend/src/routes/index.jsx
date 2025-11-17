import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

//pages
import LandingPage from '../pages/LandingPage';
import Shop from '../pages/Shop';
import ProductDetail from '../pages/ProductDetail';
import Entrar from '../pages/Entrar';
import Page404 from '../pages/Page404';
import Profile from '../pages/Profile';
import AdminDestop from '../pages/Admin';

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

  if (loading) return null;
  if (!user) return <Navigate to="/entrar" replace />;

  if (user.role !== 1) return <Navigate to="/" replace />;

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
            <AdminDestop />
          </AdminRoute>
        }
      />

      <Route path="*" element={<Page404 />} />
    </Routes>
  );
}
