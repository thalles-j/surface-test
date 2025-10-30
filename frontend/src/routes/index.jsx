import { Routes, Route } from 'react-router-dom';

// Importe TODAS as suas páginas aqui
import LandingPage from '../pages/LandingPage'; // Você vai precisar disso
import Shop from '../pages/Shop';
import ProductDetail from '../pages/ProductDetail';
import Login from '../pages/Login';


export default function AppRoutes() {
  return (
    <Routes> {/* Note: É Routes (plural) e não Router */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/produto/:id" element={<ProductDetail />} />
      <Route path="/login" element={<Login />} />
      
      {/* Sua rota 404 "catch-all" fica aqui no final */}
      
    </Routes>
  );
}