import { api } from "./api";

export async function apiLogin(payload) {
    const response = await api.post("/auth/login", payload);
    return response.data; 
}

export async function apiRegister(payload) {
    const response = await api.post("/auth/register", payload);
    return response.data;
}

export async function apiMe() {

    const response = await api.get("/conta?light=true");
    return response.data;
}

export async function apiUpdateMe(payload) {
    const response = await api.put("/conta", payload);
    return response.data;
}

export async function apiLogout() {
    localStorage.removeItem("token");
    return true;
}

export async function apiForgotPassword(payload) {
    const response = await api.post("/auth/forgot-password", payload);
    return response.data;
}

export async function apiResetPassword(payload) {
    const response = await api.post("/auth/reset-password", payload);
    return response.data;
}

export async function apiFirstAccessStatus(payload) {
    const response = await api.post("/auth/first-access-status", payload);
    return response.data;
}
