import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, LinearProgress, Button, Modal } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { encryptFile, exportKey, generateEncryptionKey, storeKeyForFile } from '../../utils/encryption';
import { Buffer } from 'buffer';
import { FileType } from '../../types/file';

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
    setUploading(true);
    setProgress(0);

    try {
      // Generate a new encryption key
      const key = await generateEncryptionKey();
      
      // Export key to store it
      const keyString = await exportKey(key);
      
      // Encrypt file...
      const { encryptedData, iv } = await encryptFile(
        await file.arrayBuffer(),
        key
      );
      console.log("encryptedData: ", encryptedData, "\n\n", "iv: ", iv)

      const encryptedFile = new File([encryptedData], file.name, { type: file.type });
      // Upload file...
      const formData = new FormData();
      formData.append('file', encryptedFile);
      formData.append('iv', Buffer.from(iv).toString('base64'));

      
      const response = await api.post('/api/files/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }});
      
      // Store the key for later use
      storeKeyForFile(response.data.id, keyString);
      
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
        style={{position: 'absolute', bottom: '30px', right: '30px'}}
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