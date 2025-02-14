import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { login, signup, verifyTwoFactor, loginVerify2FA } from './authAPI';

interface AuthState {
  user: {
    id: string;
    email: string;
    is_totp_enabled: boolean;
    role: 'admin' | 'regular' | 'guest';
  } | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  twoFactorSetup: {
    qrCode: string | null;
    secret: string | null;
    isComplete: boolean;
  };
  pendingLoginEmail: string | null;
  setupToken: string | null;
  verificationToken: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: false,
  error: null,
  twoFactorSetup: {
    qrCode: null,
    secret: null,
    isComplete: false,
  },
  pendingLoginEmail: null,
  setupToken: null,
  verificationToken: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
    },
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    setPendingLoginEmail: (state, action) => {
      state.pendingLoginEmail = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.requires_2fa) {
          state.pendingLoginEmail = action.payload.email;
          state.verificationToken = action.payload.verification_token;
        } else if (action.payload.requires_2fa_setup) {
          state.pendingLoginEmail = action.payload.email;
          state.twoFactorSetup.qrCode = action.payload.qr_code;
          state.twoFactorSetup.secret = action.payload.secret;
          state.verificationToken = action.payload.verification_token;
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Login failed';
      })
      // Signup cases
      .addCase(signup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.twoFactorSetup.qrCode = action.payload.qr_code;
        state.twoFactorSetup.secret = action.payload.secret;
        state.verificationToken = action.payload.verification_token;
        console.log('Stored verification token:', action.payload.verification_token); // Debug log
      })
      .addCase(signup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Signup failed';
      })
      // 2FA Verification cases
      .addCase(verifyTwoFactor.fulfilled, (state) => {
        state.twoFactorSetup.isComplete = true;
        state.setupToken = null;
      })
      // Login 2FA Verification cases
      .addCase(loginVerify2FA.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginVerify2FA.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.access;
        state.user = action.payload.user;
        state.pendingLoginEmail = null;
        localStorage.setItem('token', action.payload.access);
        localStorage.setItem('refresh_token', action.payload.refresh);
      })
      .addCase(loginVerify2FA.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Verification failed';
      });
  },
});

export const { logout, clearError, setUser, setPendingLoginEmail } = authSlice.actions;
export default authSlice.reducer; 