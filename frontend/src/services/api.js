import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
});

// Early access email stored in memory
let earlyAccessEmail = null;
export const setEarlyAccessEmail = (email) => { earlyAccessEmail = email; };
export const getEarlyAccessEmail = () => earlyAccessEmail;

// Attach token from localStorage (if present) for protected admin routes
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Attach early access email if set
  if (earlyAccessEmail) {
    config.headers = config.headers || {};
    config.headers['x-early-access-email'] = earlyAccessEmail;
  }
  return config;
}, (error) => Promise.reject(error));

// Store maintenance event handler
let onMaintenanceCallback = null;
export const setOnMaintenance = (cb) => { onMaintenanceCallback = cb; };

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 503 && error.response?.data?.manutencao) {
      if (onMaintenanceCallback) onMaintenanceCallback(error.response.data);
    }
    return Promise.reject(error);
  }
);