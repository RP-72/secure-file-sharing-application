import FileViewerComponent from 'react-file-viewer';
import { Box, CircularProgress, Modal, Typography, Button } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { decryptFile, importKey, getKeyForFile } from '../../utils/encryption';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Buffer } from 'buffer';

interface FileViewerModalProps {
  open: boolean;
  onClose: () => void;
  fileId: string;
  fileType: string;
  status: string;
}

const getFileType = (mimeType: string, fileName: string): string => {
    // Map MIME types to file types that react-file-viewer supports
    const mimeMap: { [key: string]: string } = {
      'application/pdf': 'pdf',
      'image/png': 'png',
      'image/jpeg': 'jpeg',
      'image/gif': 'gif',
      'text/plain': 'txt',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
      'video/mp4': 'mp4',
      'video/quicktime': 'mp4',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
    };

    const type = mimeMap[mimeType];
    if (type) return type;

    // Fallback to file extension
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    if (extension === 'mov') return 'mp4';
    return extension;
  };

export const FileViewerModal = ({ open, onClose, fileId, fileType, status }: FileViewerModalProps) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && fileId) {
      fetchAndDecryptFile();
    }
    // Cleanup on unmount or when modal closes
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
        setFileUrl(null);
      }
    };
  }, [open, fileId]);

  const onError = (e: any) => {
    console.log('Error viewing file:', e);
    setError('Error viewing file');
  };

  const handleDownload = () => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };

  const fetchAndDecryptFile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get metadata first
      const metadata = await api.get(`/api/files/${fileId}/download/`, {
        params: { metadata: true }
      });
      const { iv } = metadata.data;
      
      // Get the stored key
      const keyString = getKeyForFile(fileId);
      if (!keyString) {
        throw new Error('Encryption key not found');
      }
      
      // Import the key
      const key = await importKey(keyString);
      
      // Then get file content
      const response = await api.get(`/api/files/${fileId}/download/`, {
        responseType: 'arraybuffer',
      });
      
      const ivArray = new Uint8Array(Buffer.from(iv, 'base64'));
      
      const decryptedData = await decryptFile({
        encryptedData: response.data,
        iv: ivArray,
        key,
      });
      
      const blob = new Blob([decryptedData]);
      const url = URL.createObjectURL(blob);
      
      setFileUrl(url);
    } catch (error) {
      console.error('Error fetching file:', error);
      setError('Error loading file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="file-viewer-modal"
      aria-describedby="modal-to-view-file-contents"
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          height: '80%',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          overflow: 'auto',
          '& .pg-viewer-wrapper': {
            overflow: 'auto',
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          },
        }}>
          {loading ? (
            <CircularProgress />
          ) : error ? (
            <Typography variant="h6">{error}</Typography>
          ) : fileUrl ? (
            <FileViewerComponent
              fileType={getFileType(fileType, fileUrl)}
              filePath={fileUrl}
              onError={onError}
            />
          ) : null}
        </Box>
        <Box sx={{ 
          mt: 2, 
          display: 'flex', 
          justifyContent: 'center'
        }}>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            disabled={!fileUrl}
          >
            Download
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

// Ensure that the fileType prop is correctly set to one of the supported types
// such as 'pdf', 'doc', 'docx', 'jpg', 'png', 'mp4', etc.
// You may need to add logic to determine the fileType based on the file extension
// if it's not already provided.