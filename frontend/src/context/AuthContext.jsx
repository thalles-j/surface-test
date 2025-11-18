import { createContext, useContext, useState, useEffect } from "react";

import { apiMe, apiLogin, apiLogout } from "../services/auth.js";

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // --- CORREÇÃO AQUI ---
        // Antes de chamar apiMe(), precisamos avisar o Axios que o token existe.
        // Se você não fizer isso, a requisição vai "pelada" e dá erro 401.
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        // ---------------------

        const data = await apiMe();
        setUser(data.usuario || data);

      } catch (err) {
        console.error("Erro ao validar token no reload:", err);
        // Se deu erro (token expirado ou inválido), aí sim limpamos tudo
        localStorage.removeItem("token");
        api.defaults.headers.common['Authorization'] = undefined; // Limpa o header
        setUser(null);
      }

      setLoading(false);
    }

    loadUser();
  }, []);

  async function login(payload) {
    const res = await apiLogin(payload);
    
    if (!res.token) throw new Error("Token não recebido");

    localStorage.setItem("token", res.token);
    
    // --- CORREÇÃO TAMBÉM NO LOGIN ---
    // Garante que as próximas requisições (sem dar F5) já tenham o token
    api.defaults.headers.common['Authorization'] = `Bearer ${res.token}`;
    // --------------------------------

    const usuario = res.usuario;
    setUser(usuario);
    return usuario;
  }

  async function logout() {
    // Tenta avisar o backend, mas limpa o front de qualquer jeito
    try { await apiLogout(); } catch (e) {} 
    
    localStorage.removeItem("token");
    api.defaults.headers.common['Authorization'] = undefined; // Remove do header
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

