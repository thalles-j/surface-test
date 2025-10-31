import { Routes, Route } from 'react-router-dom';

//pages
import LandingPage from '../pages/LandingPage';
import Shop from '../pages/Shop';
import ProductDetail from '../pages/ProductDetail';
import Login from '../pages/Login';
import Page404 from '../pages/Page404';

export default function AppRoutes() {
  return (
    <Routes> 
      <Route path="/" element={<LandingPage />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/produto/:id" element={<ProductDetail />} />
      <Route path="/login" element={<Login />} />
      

      <Route path="*" element={<Page404 />} />
    </Routes>
  );
}