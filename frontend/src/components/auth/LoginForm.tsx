import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/store';
import { login, loginVerify2FA, verifyTwoFactor } from '../../features/auth/authAPI';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Alert,
  Link,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';

const LoginForm = () => {
  const [step, setStep] = useState(1);
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [verificationCode, setVerificationCode] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading, error, twoFactorSetup } = useSelector((state: RootState) => state.auth);

  const handleLoginSuccess = () => {
    const redirectPath = localStorage.getItem('redirectAfterLogin');
    if (redirectPath) {
      localStorage.removeItem('redirectAfterLogin');
      navigate(redirectPath);
    } else {
      navigate('/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      const result = await dispatch(login(credentials));
      if (login.fulfilled.match(result)) {
        if (result.payload.requires_2fa) {
          setStep(2);  // Show verification code input
        } else if (result.payload.requires_2fa_setup) {
          setStep(3);  // Show QR code setup
        }
      }
    } else if (step === 2) {
      // Handle 2FA verification
      const result = await dispatch(loginVerify2FA({
        email: credentials.email,
        code: verificationCode
      }));
      if (loginVerify2FA.fulfilled.match(result)) {
        handleLoginSuccess();
      }
    } else if (step === 3) {
      // Handle initial 2FA setup verification
      const result = await dispatch(verifyTwoFactor(verificationCode));
      if (verifyTwoFactor.fulfilled.match(result)) {
        handleLoginSuccess();
      }
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ mt: 8 }}>
        <Typography component="h1" variant="h5" align="center">
          {step === 1 ? 'Sign in' : (step === 2 ? 'Enter 2FA Code' : 'Setup 2FA')}
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          {step === 1 ? (
            <>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                value={credentials.email}
                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Password"
                type="password"
                name="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              />
            </>
          ) : step === 2 ? (
            <TextField
              margin="normal"
              required
              fullWidth
              label="Verification Code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
            />
          ) : (
            <>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Scan this QR code with Google Authenticator
                </Typography>
                <QRCode value={twoFactorSetup.qrCode!} />
              </Box>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Verification Code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
              />
            </>
          )}
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? 'Please wait...' : (step === 1 ? 'Sign In' : 'Verify')}
          </Button>

          {step === 1 && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2">
                Don't have an account?{' '}
                <Link component={RouterLink} to="/signup">
                  Sign up
                </Link>
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default LoginForm; 