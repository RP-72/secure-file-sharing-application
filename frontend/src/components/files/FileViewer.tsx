import FileViewerComponent from 'react-file-viewer';
import { Box, CircularProgress, Modal, Typography, Button } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';

interface FileViewerModalProps {
  open: boolean;
  onClose: () => void;
  fileUrl: string;
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

export const FileViewerModal = ({ open, onClose, fileUrl, fileType, status }: FileViewerModalProps) => {
  const onError = (e: any) => {
    console.log('Error viewing file:', e);
    // You might want to add additional error handling logic here
  };

  const handleDownload = () => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
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
          {
            status === "loaded" ? (
              <FileViewerComponent
                fileType={getFileType(fileType, fileUrl)}
                filePath={fileUrl}
                onError={onError}
              />
            ) : status === "loading" ? (
              <CircularProgress />
            ) : (
              <Typography variant="h6">Error loading file</Typography>
            )
          }
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