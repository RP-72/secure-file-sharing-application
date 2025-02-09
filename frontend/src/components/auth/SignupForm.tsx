import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../../store/store';
import { signup, setupTwoFactor, verifyTwoFactor } from '../../features/auth/authAPI';
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

const steps = ['Account Details', 'Setup 2FA', 'Verify 2FA'];

const SignupForm = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading, error, twoFactorSetup } = useSelector((state: RootState) => state.auth);
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [verificationCode, setVerificationCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      // Handle password mismatch
      return;
    }
    
    const result = await dispatch(signup({
      username: formData.username,
      email: formData.email,
      password: formData.password,
    }));

    if (signup.fulfilled.match(result)) {
      // Token is now automatically saved in localStorage by the reducer
      dispatch(setupTwoFactor());
      setActiveStep(1);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(verifyTwoFactor(verificationCode));
    if (verifyTwoFactor.fulfilled.match(result)) {
      setActiveStep(2);
      // Navigate to login after successful signup
      setTimeout(() => navigate('/login'), 2000);
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

        {activeStep === 0 && (
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Username"
              name="username"
              autoComplete="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
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
              >
                Verify Code
              </Button>
            </Box>
          </Box>
        )}

        {activeStep === 2 && (
          <Box sx={{ textAlign: 'center' }}>
            <Alert severity="success">
              Account created successfully! You can now log in.
            </Alert>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default SignupForm; 