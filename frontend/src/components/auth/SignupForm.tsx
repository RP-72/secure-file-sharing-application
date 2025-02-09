import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../../store/store';
import { signup, verifyTwoFactor } from '../../features/auth/authAPI';
import { setUser } from '../../features/auth/authSlice';
import QRCode from 'react-qr-code';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Alert,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';

const steps = ['Account Details', 'Setup 2FA', 'Complete'];

const SignupForm = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading, error, twoFactorSetup } = useSelector((state: RootState) => state.auth);
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [verificationCode, setVerificationCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return;
    }
    
    const result = await dispatch(signup({
      email: formData.email,
      password: formData.password,
    }));

    if (signup.fulfilled.match(result)) {
      setActiveStep(1);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(verifyTwoFactor(verificationCode));
    if (verifyTwoFactor.fulfilled.match(result)) {
      // Store user data and tokens
      dispatch(setUser(result.payload.user));
      localStorage.setItem('token', result.payload.access);
      localStorage.setItem('refresh_token', result.payload.refresh);
      
      setActiveStep(2);
      // Navigate to dashboard directly
      setTimeout(() => navigate('/dashboard'), 1500);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ mt: 8 }}>
        <Typography component="h1" variant="h5" align="center">
          Sign up
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ mt: 3, mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {activeStep === 2 && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Account created successfully! Redirecting to dashboard...
          </Alert>
        )}

        {activeStep === 0 && (
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3 }}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </Box>
        )}

        {activeStep === 1 && twoFactorSetup.qrCode && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Scan this QR code with Google Authenticator
            </Typography>
            <QRCode value={twoFactorSetup.qrCode} />
            <Box component="form" onSubmit={handleVerifyCode}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Verification Code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 2 }}
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default SignupForm; 