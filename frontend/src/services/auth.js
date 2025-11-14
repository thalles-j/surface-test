const API = "http://localhost:5000/api";

function getAuthHeaders() {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiLogin(payload) {
    const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    let data;
    try {
        data = await res.json();
    } catch (e) {
        throw new Error("Erro de conexão com o servidor");
    }
    if (!res.ok) throw new Error(data.mensagem || "Erro ao fazer login");
    return data;
}

export async function apiRegister(payload) {
    const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    let data;
    try {
        data = await res.json();
    } catch (e) {
        throw new Error("Erro de conexão com o servidor");
    }
    if (!res.ok) throw new Error(data.mensagem || "Erro ao registrar");
    return data;
}

export async function apiMe() {
    const res = await fetch(`${API}/conta`, {
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    });

    let data;
    try {
        data = await res.json();
    } catch (e) {
        throw new Error("Erro de conexão com o servidor");
    }
    if (!res.ok) throw new Error(data.mensagem || "Erro ao carregar perfil");
    return data;
}

export async function apiUpdateMe(payload) {
    const res = await fetch(`${API}/conta`, {
        method: "PUT",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    let data;
    try {
        data = await res.json();
    } catch (e) {
        throw new Error("Erro de conexão com o servidor");
    }
    if (!res.ok) throw new Error(data.mensagem || "Erro ao atualizar perfil");
    return data;
}

export async function apiLogout() {
    localStorage.removeItem("token");
    return true;
}