import FileViewerComponent from 'react-file-viewer';
import { Box, CircularProgress, Modal, Typography, Button } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { decryptFile, getKeyFromKMS } from '../../utils/encryption';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Buffer } from 'buffer';
import toast from 'react-hot-toast';

interface FileViewerModalProps {
  open: boolean;
  onClose: () => void;
  fileId: string;
  fileName: string;
  is_shared_link?: boolean;
}

const getFileType = (mimeType: string | null, fileName: string): string => {
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

    const type = mimeMap[mimeType ?? ''];
    if (type) return type;

    // Fallback to file extension
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    if (extension === 'mov') return 'mp4';
    return extension;
  };

export const FileViewerModal = ({ 
  open, 
  onClose, 
  fileId, 
  fileName, 
  is_shared_link = false 
}: FileViewerModalProps) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mimeType, setMimeType] = useState<string | null>(null);

  useEffect(() => {
    if (open && fileId) {
      if (is_shared_link) {
        fetchAndDecryptSharedFile();
      } else {
        fetchAndDecryptFile();
      }
    }
    // Cleanup on unmount or when modal closes
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
        setFileUrl(null);
      }
    };
  }, [open, fileId]);

  const handleClose = () => {
    setFileUrl(null);
    onClose();
  }

  const onError = (e: any) => {
    console.log('Error viewing file:', e);
    toast.error('Error viewing file');
  };

  const handleDownload = () => {
    if (fileUrl) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const fetchAndDecryptSharedFile = async () => {
    try {
      console.log('Fetching and decrypting shared file');
      setLoading(true);
      
      // Get metadata first
      const metadata = await api.get(`/api/files/shared/${fileId}/`, {
        params: { metadata: true }
      });
      const { iv, mime_type } = metadata.data;
      setMimeType(mime_type);
      
      // Get the encryption key for the shared file
      const key = await getKeyFromKMS(fileId);
      
      // Get the encrypted file content
      const response = await api.get(`/api/files/shared/${fileId}/`, {
        responseType: 'arraybuffer'
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
      
    } catch (error: any) {
      console.error('Error fetching shared file:', error);
      if (error.response?.status === 410) {
        toast.error('This share link has expired');
        handleClose()
      } else if (error.response?.status === 404) {
        toast.error('Share link not found');
      } else {
        toast.error('Error loading shared file');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAndDecryptFile = async () => {
    try {
      setLoading(true);
      
      // Get metadata first
      const metadata = await api.get(`/api/files/${fileId}/download/`, {
        params: { metadata: true }
      });
      const { iv, mime_type } = metadata.data;
      setMimeType(mime_type);
      
      // Get the key from KMS
      const key = await getKeyFromKMS(fileId);
      
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
      toast.error('Error loading file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="file-viewer-modal"
      aria-describedby="modal-to-view-file-contents"
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '70%',
          height: '80%',
          borderRadius: '20px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          flexDirection: 'column',
        }}
      >
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          width: '99%',
          height: '100%',
          overflowY: 'scroll',
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
          ) : fileUrl ? (
            <div key={Math.random()} style={{ width: '100%', height: '100%' }}>
              <FileViewerComponent
                fileType={getFileType(mimeType, fileName)}
                filePath={fileUrl}
                onError={onError}
              />
            </div>
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