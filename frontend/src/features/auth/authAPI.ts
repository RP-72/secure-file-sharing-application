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
  async (code: string, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    try {
      const response = await api.post('/api/auth/verify-2fa/', 
        { code },
        {
          headers: {
            Authorization: `Bearer ${state.auth.verificationToken}`
          }
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('2FA Setup Verification Error:', {
        error,
        response: error.response?.data,
        status: error.response?.status
      });
      
      return rejectWithValue(error.response?.data || {
        error: 'Verification failed'
      });
    }
  }
);

export const loginVerify2FA = createAsyncThunk(
  'auth/loginVerify2FA',
  async (data: LoginVerify2FAData, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const token = state.auth.verificationToken;
    
    console.log('2FA Verification Request:', {
      data,
      token,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    try {
      const response = await api.post('/api/auth/login-verify-2fa/', data, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('2FA Verification Error:', {
        error,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Return the error payload to be handled by the rejected action
      return rejectWithValue(error.response?.data || {
        error: 'Invalid verification code'
      });
    }
  }
); 