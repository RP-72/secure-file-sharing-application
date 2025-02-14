import axios from 'axios';

// Create a separate axios instance for KMS service
export const kmsApi = axios.create({
  baseURL: import.meta.env.VITE_KMS_URL || 'http://localhost:5001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
kmsApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}); 