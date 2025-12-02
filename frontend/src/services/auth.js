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

    const response = await api.get("/conta");
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