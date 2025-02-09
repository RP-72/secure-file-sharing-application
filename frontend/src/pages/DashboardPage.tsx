import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  List, 
  ListItem, 
  ListItemText, 
  IconButton,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store/store';
import { logout } from '../features/auth/authSlice';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FileViewer from 'react-file-viewer';
import { formatFileSize, formatDate } from '../utils/formatters';
import api from '../services/api';

interface FileItem {
  id: string;
  name: string;
  size: number;
  mime_type: string;
  created_at: string;
  url: string;
}

const DashboardPage = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerFile, setViewerFile] = useState<FileItem | null>(null);
  const [viewerError, setViewerError] = useState<string | null>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await api.get('/api/files/');
      setFiles(response.data);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await api.post('/api/files/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploadOpen(false);
      setSelectedFile(null);
      fetchFiles();
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    try {
      await api.delete(`/api/files/${fileId}/`);
      fetchFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleDownload = async (url: string, fileName: string) => {
    try {
      const response = await api.get(url, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', fileName);
      
      document.body.appendChild(link);
      link.click();
      
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleView = async (file: FileItem) => {
    try {
      // Fetch the file content
      const response = await api.get(file.url, {
        responseType: 'blob'
      });
      
      // Create a local blob URL
      const blob = new Blob([response.data], { type: file.mime_type });
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Update viewer file with local URL
      setViewerFile({
        ...file,
        url: blobUrl
      });
      setViewerOpen(true);
      setViewerError(null);
    } catch (error) {
      console.error('Error loading file for preview:', error);
      setViewerError('Error loading file. Try downloading instead.');
    }
  };

  const handleCloseViewer = () => {
    if (viewerFile) {
      // Clean up blob URL
      window.URL.revokeObjectURL(viewerFile.url);
    }
    setViewerOpen(false);
    setViewerFile(null);
    setViewerError(null);
  };

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

  const isViewable = (mimeType: string): boolean => {
    const viewableMimeTypes = [
      'application/pdf',
      'image/',
      'text/plain',
      'video/',
      'audio/',
      'application/vnd.openxmlformats-officedocument',
    ];

    return viewableMimeTypes.some(type => mimeType.startsWith(type));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Welcome, {user?.email}!</Typography>
        <Box>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<CloudUploadIcon />}
            onClick={() => setUploadOpen(true)}
            sx={{ mr: 2 }}
          >
            Upload File
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mt: 2 }}>
        <List>
          {files.map((file) => (
            <ListItem
              key={file.id}
              secondaryAction={
                <Box>
                  {isViewable(file.mime_type) && (
                    <IconButton 
                      edge="end" 
                      aria-label="view"
                      onClick={() => handleView(file)}
                      sx={{ mr: 1 }}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  )}
                  <IconButton 
                    edge="end" 
                    aria-label="download"
                    onClick={() => handleDownload(file.url, file.name)}
                    sx={{ mr: 1 }}
                  >
                    <DownloadIcon />
                  </IconButton>
                  <IconButton 
                    edge="end" 
                    aria-label="delete"
                    onClick={() => handleDelete(file.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              }
            >
              <ListItemText
                primary={file.name}
                secondary={`${formatFileSize(file.size)} • Uploaded ${formatDate(file.created_at)}`}
              />
            </ListItem>
          ))}
          {files.length === 0 && (
            <ListItem>
              <ListItemText 
                primary="No files uploaded yet"
                secondary="Click the Upload button to add files"
              />
            </ListItem>
          )}
        </List>
      </Paper>

      <Dialog 
        open={uploadOpen} 
        onClose={() => setUploadOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload File</DialogTitle>
        <DialogContent>
          <input
            type="file"
            onChange={handleFileSelect}
            style={{ marginTop: '16px' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleUpload} 
            disabled={!selectedFile || loading}
            variant="contained"
          >
            {loading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={viewerOpen} 
        onClose={handleCloseViewer}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>{viewerFile?.name}</DialogTitle>
        <DialogContent>
          {viewerFile && (
            <Box sx={{ height: '70vh', width: '100%' }}>
              <FileViewer
                fileType={getFileType(viewerFile.mime_type, viewerFile.name)}
                filePath={viewerFile.url}
                onError={(error: Error) => {
                  console.error('Error viewing file:', error);
                  setViewerError('Error viewing file. Try downloading instead.');
                }}
              />
              {viewerError && (
                <Typography color="error" sx={{ mt: 2 }}>
                  {viewerError}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewer}>Close</Button>
          {viewerFile && (
            <Button 
              onClick={() => handleDownload(viewerFile.url, viewerFile.name)}
              variant="contained"
            >
              Download
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DashboardPage; 