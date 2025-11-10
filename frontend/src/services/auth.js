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

    const data = await res.json();
    if (!res.ok) throw new Error(data.mensagem);
    return data;
}

export async function apiRegister(payload) {
    const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.mensagem);
    return data;
}

export async function apiMe() {
    const res = await fetch(`${API}/conta`, {
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.mensagem);
    return data;
}

export async function apiUpdateMe(payload) {
    const res = await fetch(`${API}/conta`, {
        method: "PUT",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.mensagem);
    return data;
}

export async function apiLogout() {
    localStorage.removeItem("token");
    return true;
}