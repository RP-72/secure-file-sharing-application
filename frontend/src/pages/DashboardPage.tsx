import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store/store';
import { logout } from '../features/auth/authSlice';
import { FileList } from '../components/files/FileList';
import { FileUploader } from '../components/files/FileUploader';
import api from '../services/api';
import { FileType } from '../types/file';

const DashboardPage = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileType[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [sharedFiles, setSharedFiles] = useState<FileType[]>([]);

  useEffect(() => {
    if (activeTab === 0) {
      fetchFiles();
    } else {
      fetchSharedFiles();
    }
  }, [activeTab]);

  const fetchFiles = async () => {
    try {
      const response = await api.get('/api/files/');
      setFiles(response.data);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const fetchSharedFiles = async () => {
    try {
      const response = await api.get('/api/files/shared_with_me/');
      setSharedFiles(response.data);
    } catch (error) {
      console.error('Error fetching shared files:', error);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleUpload = async (file: File) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/api/files/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      fetchFiles();
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (file: FileType) => {
    try {
      await api.delete(`/api/files/${file.id}/`);
      fetchFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleDownload = async (file: FileType) => {
    try {
      const response = await api.get(file.url, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', file.name);
      
      document.body.appendChild(link);
      link.click();
      
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleShare = async (file: FileType) => {
    // This function will be called from the ShareFileModal
    // The actual sharing logic is handled within the modal component
    await fetchFiles(); // Refresh the file list after sharing
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          File Dashboard
        </Typography>
        <Button 
          variant="contained" 
          color="error" 
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          aria-label="file tabs"
          sx={{ '& .MuiTab-root': { textTransform: 'none' } }}
        >
          <Tab label="My Files" />
          <Tab label="Shared with Me" />
        </Tabs>
      </Box>

      {activeTab === 0 ? (
        <>
          <FileUploader onFileUpload={handleUpload} />
          <Paper sx={{ mt: 2 }}>
            <FileList
              files={files}
              onDownload={handleDownload}
              onDelete={handleDelete}
              onShare={handleShare}
              showShareOption={true}
            />
          </Paper>
        </>
      ) : (
        <Paper>
          <FileList
            files={sharedFiles}
            onDownload={handleDownload}
            onDelete={undefined} // Disable delete for shared files
            onShare={undefined} // Disable sharing for shared files
            showShareOption={false}
          />
        </Paper>
      )}
    </Box>
  );
};

export default DashboardPage; 