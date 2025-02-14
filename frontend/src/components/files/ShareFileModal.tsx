import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Box,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { FileType } from '../../types/file';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { validateEmail } from '../../utils/validators';

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

  const handleShare = async () => {
    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);
      await api.post(`/api/files/${file.id}/share/`, { email });
      toast.success('File shared successfully!');
      onShare();
      setTimeout(() => {
        onClose();
        setEmail('');
      }, 1500);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to share file');
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