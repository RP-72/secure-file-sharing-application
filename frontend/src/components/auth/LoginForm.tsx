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
  Link,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import toast from 'react-hot-toast';
import { validateEmail, validatePassword, sanitizeLoginInput } from '../../utils/validators';

const LoginForm = () => {
  const [step, setStep] = useState(1);
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [verificationCode, setVerificationCode] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading, twoFactorSetup } = useSelector((state: RootState) => state.auth);

  const handleLoginSuccess = () => {
    const redirectPath = localStorage.getItem('redirectAfterLogin');
    if (redirectPath) {
      localStorage.removeItem('redirectAfterLogin');
      navigate(redirectPath);
    } else {
      navigate('/dashboard');
    }
  };

  const validateForm = (): boolean => {
    // Validate email/username
    const sanitizedEmail = sanitizeLoginInput(credentials.email);
    if (!sanitizedEmail) {
      toast.error('Email is required');
      return false;
    } else if (sanitizedEmail.includes('@') && !validateEmail(sanitizedEmail)) {
      toast.error('Invalid email format');
      return false;
    }

    // Validate password
    const passwordValidation = validatePassword(credentials.password);
    if (!passwordValidation.isValid) {
      toast.error(passwordValidation.message);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const sanitizedCredentials = {
        email: sanitizeLoginInput(credentials.email),
        password: credentials.password
      };

      const result = await dispatch(login(sanitizedCredentials));
      
      if (login.rejected.match(result)) {
        toast.error('Invalid email or password');
        return;
      }

      if (result.payload?.requires_2fa) {
        setStep(2);
      } else if (result.payload?.requires_2fa_setup) {
        setStep(3);
      } else {
        handleLoginSuccess();
        toast.success('Login successful!');
      }

    } catch (error: any) {
      let errorMessage = 'Invalid email or password';
      
      if (error.response?.status === 429) {
        errorMessage = 'Too many login attempts. Please try again later.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      toast.error(errorMessage);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await dispatch(loginVerify2FA({
        email: credentials.email,
        code: verificationCode
      }));

      if (loginVerify2FA.rejected.match(result)) {
        toast.error('Invalid verification code');
        return;
      }

      handleLoginSuccess();
      toast.success('Login successful!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Invalid verification code');
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ mt: 8 }}>
        <Typography component="h1" variant="h5" align="center">
          {step === 1 ? 'Sign in' : (step === 2 ? 'Enter 2FA Code' : 'Setup 2FA')}
        </Typography>
        
        <Box 
          component="form" 
          onSubmit={step === 1 ? handleSubmit : handleVerificationSubmit} 
          sx={{ mt: 1 }}
        >
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