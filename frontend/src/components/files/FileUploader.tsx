import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, LinearProgress, Button, Modal } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { encryptFile, storeKeyForFile } from '../../utils/encryption';
import { Buffer } from 'buffer';
import { FileType } from '../../types/file';
import { validateFile } from '../../utils/validators';

interface FileUploaderProps {
  onUploadComplete: (file: FileType) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    // Validate file before upload
    const validation = validateFile(file);
    if (!validation.isValid) {
      toast.error(validation.message);
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Encrypt file and get the key
      const { encryptedData, iv, key } = await encryptFile(
        await file.arrayBuffer()
      );

      const encryptedFile = new File([encryptedData], file.name, { type: file.type });
      const formData = new FormData();
      formData.append('file', encryptedFile);
      formData.append('iv', Buffer.from(iv).toString('base64'));

      // Upload encrypted file
      const response = await api.post('/api/files/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      // Store the encryption key in KMS after successful file upload
      await storeKeyForFile(response.data.id, key);
      
      toast.success('File uploaded successfully');
      const fileData: FileType = {
        id: response.data.id,
        name: file.name,
        mime_type: file.type,
        size: file.size,
        created_at: response.data.created_at,
        updated_at: response.data.updated_at,
        url: response.data.url,
        owner: response.data.owner
      };
      await onUploadComplete(fileData);
      handleClose();
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false
  });

  return (
    <>
      <Button
        variant="contained"
        startIcon={<CloudUploadIcon />}
        onClick={handleOpen}
        sx={{
          bgcolor: '#000000',
          color: '#ffffff',
          '&:hover': {
            bgcolor: '#333333',
          },
          textTransform: 'none',
          px: 3,
          py: 1,
          borderRadius: 1,
        }}
      >
        Upload File
      </Button>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="upload-modal"
        aria-describedby="upload-modal-description"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 800,
            height: 500,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2
          }}
        >
          <Box
            {...getRootProps()}
            sx={{
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'grey.300',
              borderRadius: 1,
              p: 3,
              textAlign: 'center',
              cursor: 'pointer',
              bgcolor: isDragActive ? 'action.hover' : 'background.paper',
              '&:hover': {
                bgcolor: 'action.hover',
              },
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
            }}
          >
            <input {...getInputProps()} />
            <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h6" gutterBottom>
              {isDragActive ? 'Drop the file here' : 'Drag & drop a file here, or click to select'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Files are encrypted before uploading for security
            </Typography>
            
            {uploading && (
              <Box sx={{ width: '100%', mt: 2 }}>
                <LinearProgress variant="determinate" value={progress} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {progress < 50 ? 'Encrypting...' : `Uploading... ${progress}%`}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Modal>
    </>
  );
};