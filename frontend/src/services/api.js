import axios from "axios";
import { getStoredToken } from "./token";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
});

// Attach token from localStorage (if present) for protected admin routes
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));
