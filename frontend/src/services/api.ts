import axios from 'axios';
import { store } from '../store/store';
import { logout } from '../features/auth/authSlice';

export const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to refresh token
const refreshToken = async () => {
  try {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) throw new Error('No refresh token');

    const response = await api.post('/api/auth/token/refresh/', {
      refresh,
    });

    localStorage.setItem('token', response.data.access);
    return response.data.access;
  } catch (error) {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    store.dispatch(logout());
    throw error;
  }
};

// Add request interceptor
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    try {
      // Decode token to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiration = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();

      // If token is expired, refresh it
      if (expiration < now) {
        const newToken = await refreshToken();
        config.headers.Authorization = `Bearer ${newToken}`;
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      // If token is invalid, remove it
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      store.dispatch(logout());
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api; 