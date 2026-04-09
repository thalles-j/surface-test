import axios from 'axios';
import { getStoredToken } from './token';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
});

let earlyAccessEmail = null;
export const setEarlyAccessEmail = (email) => {
  earlyAccessEmail = email;
};
export const getEarlyAccessEmail = () => earlyAccessEmail;

api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (earlyAccessEmail) {
      config.headers = config.headers || {};
      config.headers['x-early-access-email'] = earlyAccessEmail;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let onMaintenanceCallback = null;
export const setOnMaintenance = (cb) => {
  onMaintenanceCallback = cb;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 503 && error.response?.data?.manutencao) {
      if (onMaintenanceCallback) onMaintenanceCallback(error.response.data);
    }
    return Promise.reject(error);
  }
);
