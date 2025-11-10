import { Routes, Route } from 'react-router-dom';

//pages
import LandingPage from '../pages/LandingPage';
import Shop from '../pages/Shop';
import ProductDetail from '../pages/ProductDetail';
import Entrar from '../pages/Entrar';
import Page404 from '../pages/Page404';
import Profile from '../pages/Profile';

export default function AppRoutes() {
  return (
    <Routes> 
      <Route path="/" element={<LandingPage />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/produto/:id" element={<ProductDetail />} />
      <Route path="/entrar" element={<Entrar />} />
      <Route path="/conta" element={<Profile />} />

      <Route path="*" element={<Page404 />} />
    </Routes>
  );
}