import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiMe, apiLogin, apiRegister, apiLogout } from "../services/auth.js";

export const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        
        if (!token) {
            setLoading(false);
            setInitialized(true);
            return;
        }

        (async () => {
            try {
                const { usuario } = await apiMe();
                setUser(usuario);
            } catch {
                localStorage.removeItem("token");
                setUser(null);
            } finally {
                setLoading(false);
                setInitialized(true);
            }
        })();
    }, []);

    const value = useMemo(() => ({
        user,
        loading,
        initialized,
        login: async (data) => {
            setLoading(true);
            try {
                const res = await apiLogin(data);
                
                if (!res?.token) {
                    throw new Error("No token in response: " + JSON.stringify(res));
                }
                
                localStorage.setItem("token", res.token);
                
                const me = await apiMe();
                const usuario = me?.usuario || me;
                setUser(usuario);
                setLoading(false);
                return res;
            } catch (error) {
                localStorage.removeItem("token");
                setUser(null);
                setLoading(false);
                throw error;
            }
        },
        register: async (payload) => apiRegister(payload),
        logout: async () => {
            setLoading(true);
            await apiLogout();
            localStorage.removeItem("token");
            setUser(null);
            setLoading(false);
        },
        refreshMe: async () => {
            setLoading(true);
            const { usuario } = await apiMe();
            setUser(usuario);
            setLoading(false);
        },
    }), [user, loading, initialized]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}