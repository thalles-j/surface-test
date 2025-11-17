import { createContext, useContext, useState, useEffect } from "react";
import { apiMe, apiLogin, apiLogout } from "../services/auth.js";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Carrega usuário ao iniciar (useEffect)
  // Esta parte continua a mesma e é crucial
  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // A apiMe é chamada AQUI, no carregamento da página
        const data = await apiMe();

        // Se a sua apiMe retorna { usuario: {...} }, mantenha como está
        // Se ela retorna o usuário direto, mude para: setUser(data);
        setUser(data.usuario || data);

      } catch (err) {
        console.error("Erro ao carregar usuário:", err);
        localStorage.removeItem("token");
      }

      setLoading(false);
    }

    loadUser();
  }, []);

  // LOGIN (Função Corrigida)
  async function login(payload) {
    // 1. Chama a apiLogin, que retorna { token, usuario: { ... com role } }
    const res = await apiLogin(payload);

    if (!res.token) throw new Error("Token não recebido");
    if (!res.usuario) throw new Error("API de login não retornou o usuário");

    // 2. Salva o token
    localStorage.setItem("token", res.token);

    // 3. Pega o usuário que veio da RESPOSTA DO LOGIN (que tem a 'role')
    const usuario = res.usuario;

    // 4. Define o usuário no estado
    setUser(usuario);
    return usuario;
  }

  // LOGOUT
  async function logout() {
    await apiLogout();
    localStorage.removeItem("token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook customizado
export function useAuth() {
  return useContext(AuthContext);
}