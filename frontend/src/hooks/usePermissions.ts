import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

export const usePermissions = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  return {
    isAdmin: user?.role === 'admin',
    canUpload: user?.role === 'admin' || user?.role === 'regular',
    canShare: user?.role === 'admin' || user?.role === 'regular',
    canDelete: user?.role === 'admin' || user?.role === 'regular',
    role: user?.role
  };
}; 