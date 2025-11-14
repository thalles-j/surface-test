import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

//pages
import LandingPage from '../pages/LandingPage';
import Shop from '../pages/Shop';
import ProductDetail from '../pages/ProductDetail';
import Entrar from '../pages/Entrar';
import Page404 from '../pages/Page404';
import Profile from '../pages/Profile';

function ProtectedRoute({ element }) {
  const auth = useAuth();
  
  if (!auth?.initialized) {
    return null;
  }
  
  if (!auth?.user) {
    return <Navigate to="/entrar" replace />;
  }
  
  return element;
}

export default function AppRoutes() {
  return (
    <Routes> 
      <Route path="/" element={<LandingPage />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/produto/:id" element={<ProductDetail />} />
      <Route path="/entrar" element={<Entrar />} />
      <Route path="/conta" element={<ProtectedRoute element={<Profile />} />} />

      <Route path="*" element={<Page404 />} />
    </Routes>
  );
}