import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import api from '../services/api';

// Check for existing token and decode user info
const token = localStorage.getItem('token');
let preloadedState = {};

if (token) {
  preloadedState = {
    auth: {
      token,
      isAuthenticated: true,
      loading: false,
      error: null,
      user: null, // We'll fetch user info in a moment
      twoFactorSetup: {
        qrCode: null,
        secret: null,
        isComplete: false,
      }
    }
  };
}

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  preloadedState
});

// If we have a token, fetch the user info
if (token) {
  api.get('/api/auth/me/')
    .then(response => {
      store.dispatch({
        type: 'auth/setUser',
        payload: response.data
      });
    })
    .catch(() => {
      // If the token is invalid, logout
      store.dispatch({ type: 'auth/logout' });
    });
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 