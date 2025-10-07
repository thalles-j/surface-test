import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header/Header.jsx";
import Footer from "./components/Footer/footer.jsx";
import LandingPage from "./components/LandingPage/LandingPage.jsx";
import Shop from "./pages/Shop/Shop.jsx";
import ProductDetail from "./pages/ProductDetail/ProductCard.jsx";

export default function App() {
  useEffect(() => {
  function autoLightMode() {
    const bodyBg = getComputedStyle(document.body).backgroundColor;
    const rgb = bodyBg.match(/\d+/g);
    if (!rgb) return;

    const brightness = (parseInt(rgb[0])*299 + parseInt(rgb[1])*587 + parseInt(rgb[2])*114)/1000;
    if (brightness > 200) {
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.remove("light-mode");
    }
  }

  autoLightMode();
  const observer = new MutationObserver(autoLightMode);
  observer.observe(document.body, { attributes: true, attributeFilter: ["style"] });

  return () => observer.disconnect();
}, []);
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/shop" element={<Shop />} />
        
      </Routes>
      <Footer />
    </Router>
  );
}
