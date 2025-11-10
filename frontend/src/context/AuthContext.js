import { createContext, useEffect, useMemo, useState } from "react";
import { apiMe, apiLogin, apiRegister, apiLogout } from "../services/apiAuth";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // carregar usuário automaticamente se tiver token
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return setLoading(false);

        (async () => {
            try {
                const { usuario } = await apiMe();
                setUser(usuario);
            } catch {
                localStorage.removeItem("token");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const value = useMemo(
        () => ({
            user,
            loading,
            async login(data) {
                const res = await apiLogin(data);
                localStorage.setItem("token", res.token);
                const me = await apiMe();
                setUser(me.usuario);
                return res;
            },
            async register(payload) {
                return apiRegister(payload);
            },
            async logout() {
                await apiLogout();
                localStorage.removeItem("token");
                setUser(null);
            },
            async refreshMe() {
                const { usuario } = await apiMe();
                setUser(usuario);
            },
        }),
        [user, loading]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
