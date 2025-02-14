import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';

interface PromotionConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  newRole: string;
}

export const PromotionConfirmModal: React.FC<PromotionConfirmModalProps> = ({
  open,
  onClose,
  onConfirm,
  newRole,
}) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Promotion failed:', error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Confirm Promotion</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to promote this user to <strong>{newRole}</strong>?
          This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleConfirm} color="primary" variant="contained" disabled={loading}>
          {loading ? 'Promoting...' : 'Confirm Promotion'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 