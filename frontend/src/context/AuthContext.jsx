import { createContext, useEffect, useState } from "react";
import { api } from "../services/api";
import { apiLogin, apiLogout, apiMe } from "../services/auth.js";
import { clearToken, getStoredToken, saveToken } from "../services/token.js";

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = getStoredToken();

      if (token) {
        try {
          api.defaults.headers.common.Authorization = `Bearer ${token}`;
          const data = await apiMe();
          setUser(data.usuario || data);
        } catch (err) {
          // Token invalido/expirado nao deve quebrar a aplicacao.
          if (err?.response?.status !== 401) {
            console.error("Falha ao carregar sessao:", err);
          }
          clearToken();
          api.defaults.headers.common.Authorization = undefined;
          setUser(null);
        }
      }

      setLoading(false);
    }

    loadUser();
  }, []);

  async function login(payload) {
    const res = await apiLogin(payload);
    const tokenRecebido = res.token;
    const usuarioRecebido = res.usuario;

    if (tokenRecebido) {
      saveToken(tokenRecebido);
      api.defaults.headers.common.Authorization = `Bearer ${tokenRecebido}`;
      setUser(usuarioRecebido);
      return usuarioRecebido;
    }

    return null;
  }

  async function logout() {
    setUser(null);
    clearToken();
    api.defaults.headers.common.Authorization = undefined;

    try {
      await apiLogout();
    } catch (_error) {
      // Sem impacto de UX no logout local.
    }
  }

  return (
    <AuthContext.Provider value={{ user, signed: !!user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
