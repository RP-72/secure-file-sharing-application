import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

interface LoginCredentials {
  username: string;
  password: string;
  totp_code?: string;
}

interface SignupData {
  username: string;
  password: string;
  email: string;
}

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials) => {
    const response = await api.post('/api/auth/login/', credentials);
    return response.data;
  }
);

export const signup = createAsyncThunk(
  'auth/signup',
  async (data: SignupData) => {
    const response = await api.post('/api/auth/signup/', data);
    return response.data;
  }
);

export const setupTwoFactor = createAsyncThunk(
  'auth/setupTwoFactor',
  async () => {
    const response = await api.post('/api/auth/setup-2fa/');
    return response.data;
  }
);

export const verifyTwoFactor = createAsyncThunk(
  'auth/verifyTwoFactor',
  async (code: string) => {
    const response = await api.post('/api/auth/verify-2fa/', { code });
    return response.data;
  }
); 