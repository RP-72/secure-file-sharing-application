import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { RootState } from '../../store/store';

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupData {
  email: string;
  password: string;
}

interface LoginVerify2FAData {
  email: string;
  code: string;
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

export const verifyTwoFactor = createAsyncThunk(
  'auth/verifyTwoFactor',
  async (code: string, { getState }) => {
    const state = getState() as RootState;
    console.log('Verification token being sent:', state.auth.verificationToken);
    const response = await api.post('/api/auth/verify-2fa/', 
      { code },
      {
        headers: {
          Authorization: `Bearer ${state.auth.verificationToken}`
        }
      }
    );
    return response.data;
  }
);

export const loginVerify2FA = createAsyncThunk(
  'auth/loginVerify2FA',
  async (data: LoginVerify2FAData) => {
    const response = await api.post('/api/auth/login-verify-2fa/', data);
    return response.data;
  }
); 