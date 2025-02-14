import React, { useState } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { PromotionConfirmModal } from './PromotionConfirmModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface UserManagementProps {
  users: Array<{
    id: string;
    email: string;
    role: 'admin' | 'regular' | 'guest';
  }>;
  onUpdate: () => void;
}

interface PromotionState {
  open: boolean;
  userId: string | null;
  currentRole: string;
  newRole: string;
}

interface DeleteState {
  open: boolean;
  userId: string | null;
  userEmail: string;
  userRole: string;
}

export const UserManagement: React.FC<UserManagementProps> = ({ users, onUpdate }) => {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [promotionDialog, setPromotionDialog] = useState<PromotionState>({
    open: false,
    userId: null,
    currentRole: '',
    newRole: '',
  });
  const [deleteDialog, setDeleteDialog] = useState<DeleteState>({
    open: false,
    userId: null,
    userEmail: '',
    userRole: '',
  });

  const getNextRole = (currentRole: string): string => {
    if (currentRole === 'guest') return 'regular';
    if (currentRole === 'regular') return 'admin';
    return currentRole;
  };

  const handlePromoteClick = (userId: string, currentRole: string) => {
    const newRole = getNextRole(currentRole);
    setPromotionDialog({
      open: true,
      userId,
      currentRole,
      newRole,
    });
  };

  const handlePromoteUser = async () => {
    if (!promotionDialog.userId || !promotionDialog.newRole) return;

    try {
      await api.post(`/api/auth/users/${promotionDialog.userId}/role/`, {
        role: promotionDialog.newRole
      });
      
      toast.success(`User promoted to ${promotionDialog.newRole}`);
      onUpdate();
    } catch (error) {
      console.error('Error promoting user:', error);
      toast.error('Failed to promote user');
    } finally {
      setPromotionDialog(prev => ({ ...prev, open: false }));
    }
  };

  const handleDeleteClick = (userId: string, userEmail: string, userRole: string) => {
    if (userRole === 'admin') {
      toast.error('Cannot delete admin users');
      return;
    }
    
    setDeleteDialog({
      open: true,
      userId,
      userEmail,
      userRole,
    });
  };

  const handleDeleteUser = async () => {
    if (!deleteDialog.userId) return;

    try {
      await api.delete(`/api/auth/users/${deleteDialog.userId}/`);
      toast.success('User deleted successfully');
      onUpdate();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
      throw error; // Re-throw to be caught by the modal
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'regular':
        return 'primary';
      default:
        return 'default';
    }
  };

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    label={user.role}
                    color={getRoleColor(user.role) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  {user.id !== currentUser?.id && (
                    <>
                      <Tooltip title={
                        user.role === 'admin' 
                          ? 'Admin users cannot be promoted further'
                          : `Promote to ${getNextRole(user.role)}`
                      }>
                        <span>
                          <IconButton
                            onClick={() => handlePromoteClick(user.id, user.role)}
                            color="primary"
                            size="small"
                            disabled={user.role === 'admin'}
                          >
                            <ArrowUpwardIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={
                        user.role === 'admin'
                          ? 'Admin users cannot be deleted'
                          : 'Delete user'
                      }>
                        <span>
                          <IconButton
                            onClick={() => handleDeleteClick(user.id, user.email, user.role)}
                            color="error"
                            size="small"
                            disabled={user.role === 'admin'}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <PromotionConfirmModal
        open={promotionDialog.open}
        onClose={() => setPromotionDialog(prev => ({ ...prev, open: false }))}
        onConfirm={handlePromoteUser}
        newRole={promotionDialog.newRole}
      />

      <DeleteConfirmModal
        open={deleteDialog.open}
        onClose={() => setDeleteDialog(prev => ({ ...prev, open: false }))}
        onConfirm={handleDeleteUser}
        userEmail={deleteDialog.userEmail}
      />
    </>
  );
}; 