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
    if (!res.ok) throw new Error(data.mensagem || "Erro no login");
    return data;
}

export async function apiRegister(payload) {
    const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.mensagem || "Erro no registro");
    return data;
}

export async function apiMe() {
    const res = await fetch(`${API}/conta`, {
        headers: getAuthHeaders()
    });

    // Se o backend devolver HTML (token inválido), não tente parsear JSON
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Resposta não é JSON. Token inválido ou sessão expirada.");
    }

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.mensagem || "Erro ao carregar conta");
    }

    return data;
}

export async function apiUpdateMe(payload) {
    const res = await fetch(`${API}/conta/`, {
        method: "PUT",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.mensagem || "Erro ao atualizar");
    return data;
}

export async function apiLogout() {
    localStorage.removeItem("token");
    return true;
}
