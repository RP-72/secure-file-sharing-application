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
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  InputAdornment,
  Stack,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

const steps = ['Account Details', 'Setup 2FA', 'Complete'];

const passwordRequirements = [
  { id: 'length', label: 'At least 8 characters long' },
  { id: 'uppercase', label: 'Contains uppercase letter' },
  { id: 'lowercase', label: 'Contains lowercase letter' },
  { id: 'number', label: 'Contains number' },
  { id: 'special', label: 'Contains special character (!@#$%^&*)' },
];

const SignupForm = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading, twoFactorSetup } = useSelector((state: RootState) => state.auth);
  const [activeStep, setActiveStep] = useState(0);
  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });
  const [twoFactorCode, setTwoFactorCode] = useState(['', '', '', '', '', '']);

  const updatePasswordChecks = (password: string) => {
    setPasswordChecks({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*]/.test(password),
    });
  };

  const allChecksPass = Object.values(passwordChecks).every(Boolean);

  const handleInitialSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await dispatch(signup(signupData));
      
      if(signup.fulfilled.match(response)) {
        // Only advance to next step if initial signup succeeds
        setActiveStep(1);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Signup failed');
    }
  };

  const handle2FAInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits
    
    const newCode = [...twoFactorCode];
    newCode[index] = value;
    setTwoFactorCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.querySelector(`input[name="2fa-${index + 1}"]`) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
  };

  const handleComplete2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = twoFactorCode.join('');
    if (code.length !== 6) {
      toast.error('Please enter all 6 digits');
      return;
    }
    
    try {
      const response = await dispatch(verifyTwoFactor(code));
      
      if (verifyTwoFactor.fulfilled.match(response)) {
        dispatch(setUser(response.payload.user));
        localStorage.setItem('token', response.payload.access);
        localStorage.setItem('refresh_token', response.payload.refresh);
        
        setActiveStep(2);
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || '2FA verification failed');
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

        {activeStep === 0 && (
          <Box component="form" onSubmit={handleInitialSignup}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              value={signupData.email}
              onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={signupData.password}
              onChange={(e) => {
                setSignupData({ ...signupData, password: e.target.value })
                updatePasswordChecks(e.target.value)
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {/* Password Requirements Checklist */}
            <Typography 
              variant="body2" 
              sx={{ 
                mt: 1,
                fontWeight: 500,
                fontSize: '16px'
              }}
            >
              Password Requirements:
            </Typography>
            <List dense sx={{ mb: 2 }}>
              {passwordRequirements.map(({ id, label }) => (
                <ListItem key={id} dense>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {passwordChecks[id as keyof typeof passwordChecks] ? (
                      <CheckIcon color="success" />
                    ) : (
                      <CloseIcon color="error" />
                    )}
                  </ListItemIcon>
                  <ListItemText 
                    primary={label}
                    primaryTypographyProps={{
                      variant: 'body2',
                      color: passwordChecks[id as keyof typeof passwordChecks] ? 'success.main' : 'error.main'
                    }}
                  />
                </ListItem>
              ))}
            </List>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3 }}
              disabled={loading || !allChecksPass}
              onClick={handleInitialSignup}
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
            <Box component="form" onSubmit={handleComplete2FA} sx={{ mt: 3 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Enter the 6-digit code from your authenticator app
              </Typography>
              <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 3 }}>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <TextField
                    key={index}
                    name={`2fa-${index}`}
                    value={twoFactorCode[index]}
                    onChange={(e) => handle2FAInputChange(index, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !twoFactorCode[index] && index > 0) {
                        const prevInput = document.querySelector(`input[name="2fa-${index - 1}"]`) as HTMLInputElement;
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
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading || twoFactorCode.join('').length !== 6}
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