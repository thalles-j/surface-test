import { useEffect, useState } from "react"; // Adicionei useState
import { BrowserRouter as Router } from 'react-router-dom'; 
import { AuthProvider } from './context/AuthContext.jsx'; 
import Header from "./components/Header";
import Footer from "./components/Footer"; 
import AppRoutes from './routes';
import PageLoader from "./components/PageLoader"; 

export default function App() {

  const [loading, setLoading] = useState(true);

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


    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => {
      observer.disconnect();
      clearTimeout(timer); 
    };
  }, []);

  return (
    <AuthProvider>
      <Router> 

        {loading && <PageLoader />}

        <Header />
        <main> 
          <AppRoutes />
        </main>
        <Footer />
      </Router>
    </AuthProvider>
  );
}