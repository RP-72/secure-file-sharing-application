import React, { useRef } from 'react';
import { Button, Box, Typography } from '@mui/material';
import { CloudUpload } from '@mui/icons-material';

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Box sx={{ textAlign: 'center', mb: 3, position: 'fixed', bottom: 0, right: '20px' }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <Button
        variant="contained"
        startIcon={<CloudUpload />}
        onClick={handleClick}
      >
        Upload File
      </Button>
    </Box>
  );
}; 