import { Box, Typography, Button } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store/store';
import { logout } from '../features/auth/authSlice';

const DashboardPage = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Welcome, {user?.username}!</Typography>
        <Button 
          variant="contained" 
          color="error" 
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Box>
      <Typography variant="body1">
        You have successfully logged in.
      </Typography>
    </Box>
  );
};

export default DashboardPage; 