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
  Stack,
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
  const [verificationCode, setVerificationCode] = useState<string[]>(['', '', '', '', '', '']);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading } = useSelector((state: RootState) => state.auth);

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

  const handle2FAInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits
    
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.querySelector(`input[name="2fa-login-${index + 1}"]`) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = verificationCode.join('');
    if (code.length !== 6) {
      toast.error('Please enter all 6 digits');
      return;
    }
    
    try {
      const result = await dispatch(loginVerify2FA({
        email: credentials.email,
        code: code
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
            <>
              <Typography variant="body1" sx={{ mb: 2, textAlign: 'center' }}>
                Enter the 6-digit code from your authenticator app
              </Typography>
              <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 3 }}>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <TextField
                    key={index}
                    name={`2fa-login-${index}`}
                    value={verificationCode[index]}
                    onChange={(e) => handle2FAInputChange(index, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
                        const prevInput = document.querySelector(`input[name="2fa-login-${index - 1}"]`) as HTMLInputElement;
                        if (prevInput) prevInput.focus();
                      }
                    }}
                    inputProps={{
                      maxLength: 1,
                      style: { textAlign: 'center', fontSize: '1.5rem', padding: '8px' },
                      autoFocus: index === 0,
                    }}
                    sx={{ width: '48px' }}
                  />
                ))}
              </Stack>
            </>
          ) : (
            <>
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