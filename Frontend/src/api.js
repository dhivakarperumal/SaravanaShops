import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL?.replace(/\/$/, '') || "/api",
  timeout: 15000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT token into requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && token !== 'undefined' && token !== 'null') {
      config.headers = config.headers || {};
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('API request unauthorized:', error.config?.url, 'token present:', !!localStorage.getItem('token'));
      localStorage.removeItem('token');
      // Optionally, the app can refresh/unmount the auth state to force re-login.
    }
    return Promise.reject(error);
  }
);

export default api;