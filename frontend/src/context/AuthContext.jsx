import { createContext, useState, useEffect } from "react";
import { api } from "../services/api"; 
import { apiMe, apiLogin, apiLogout } from "../services/auth.js";

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem("token");

      if (token) {
        try {

          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const data = await apiMe();
          setUser(data.usuario || data);

        } catch (err) {
          console.error("Token inválido:", err);
          // Se o token expirou, limpa tudo
          localStorage.removeItem("token");
          api.defaults.headers.common['Authorization'] = undefined;
          setUser(null);
        }
      }
      
      setLoading(false);
    }

    loadUser();
  }, []);

  // --- LOGIN ---
  async function login(payload) {
    const res = await apiLogin(payload);


    const tokenRecebido = res.token; 
    const usuarioRecebido = res.usuario;

    if (tokenRecebido) {
      // 1. Salva no Storage
      localStorage.setItem("token", tokenRecebido);
      

      api.defaults.headers.common['Authorization'] = `Bearer ${tokenRecebido}`;
      

      setUser(usuarioRecebido);
      return usuarioRecebido;
    }
  }

  // --- LOGOUT ---
async function logout() {
    setUser(null);
    localStorage.removeItem("token");
    api.defaults.headers.common['Authorization'] = undefined; // Limpa o Axios

    try {
      await apiLogout(); 
    } catch (error) {
      // Silencioso
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      signed: !!user, 
      loading, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

