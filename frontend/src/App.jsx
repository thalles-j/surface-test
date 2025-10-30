import { useEffect } from "react";
import { BrowserRouter as Router } from 'react-router-dom'; // 1. Importe o Router aqui

// Seus componentes de layout
import Header from "./components/Header";
import Footer from "./components/Footer"; // 2. Você precisa importar o Footer

// Seu arquivo de rotas
import AppRoutes from './routes';

export default function App() {
  // O seu useEffect para o light-mode está ótimo aqui.
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

  // 3. O return deve ser limpo:
  return (
    <Router> {/* O Router envolve tudo */}
      <Header />
      <main> {/* É uma boa prática ter um <main> */}
        <AppRoutes /> {/* 4. É AQUI que as páginas (Shop, Page404) serão trocadas */}
      </main>
      <Footer />
    </Router>
  );
}