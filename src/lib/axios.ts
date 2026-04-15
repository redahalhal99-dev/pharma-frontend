import axios from 'axios';

// The Laravel backend runs on port 8000 usually. We'll set this in .env.local, fallback to localhost:8000
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor for adding the auth token
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      // Check both storages for the token, or better, the auth-storage json
      let token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        const authData = localStorage.getItem('auth-storage') || sessionStorage.getItem('auth-storage');
        if (authData) {
          try {
            token = JSON.parse(authData).state?.token;
          } catch {}
        }
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors globally (like 401 Unauthorized)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login if unauthorized
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
