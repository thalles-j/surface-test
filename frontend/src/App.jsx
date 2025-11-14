import { useEffect } from "react";
import { BrowserRouter as Router } from 'react-router-dom'; 
import { AuthProvider } from './context/AuthContext.jsx'; 
import Header from "./components/Header";
import Footer from "./components/Footer"; 
import AppRoutes from './routes';

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
    <AuthProvider>
      <Router> 
        <Header />
        <main> 
          <AppRoutes />
        </main>
        <Footer />
      </Router>
    </AuthProvider>
  );
}