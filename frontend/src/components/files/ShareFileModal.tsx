import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Box,
  Alert,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { FileType } from '../../types/file';
import axios from 'axios';
import api from '../../services/api';

interface ShareFileModalProps {
  open: boolean;
  onClose: () => void;
  file: FileType;
  onShare: () => void;
}

export const ShareFileModal: React.FC<ShareFileModalProps> = ({
  open,
  onClose,
  file,
  onShare,
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleShare = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await api.post(`/api/files/${file.id}/share/`, { email });
      setSuccess(true);
      onShare();
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setEmail('');
      }, 1500);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2 }}>
        Share "{file.name}"
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              File shared successfully!
            </Alert>
          )}
          <TextField
            fullWidth
            label="Share with (email)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            fullWidth
            variant="contained"
            onClick={handleShare}
            disabled={isLoading}
          >
            {isLoading ? 'Sharing...' : 'Share'}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}; 