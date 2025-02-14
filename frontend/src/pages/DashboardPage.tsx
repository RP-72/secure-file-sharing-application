import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button,
  Paper,
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { RootState } from '../store/store';
import { logout } from '../features/auth/authSlice';
import { FileList } from '../components/files/FileList';
import { FileUploader } from '../components/files/FileUploader';
import api from '../services/api';
import { FileType } from '../types/file';
import { FileViewerModal } from '../components/files/FileViewer';
import toast from 'react-hot-toast';
import { UserManagement } from '../components/users/UserManagement';

const DashboardPage = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [files, setFiles] = useState<FileType[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [sharedFiles, setSharedFiles] = useState<FileType[]>([]);
  const [sharedFileView, setSharedFileView] = useState({
    open: false,
    fileUrl: '',
    fileType: '',
    status: 'loading',
    fileName: ''
  });
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === 0) {
      fetchFiles();
    } else if (activeTab === 1) {
      fetchSharedFiles();
    } else if (activeTab === 2 && user?.role === 'admin') {
      fetchUsers();
    }
  }, [activeTab]);

  useEffect(() => {
    // Check if we're trying to view a shared file
    const match = location.pathname.match(/\/shared\/(.+)/);
    if (match) {
      const shareId = match[1];
      handleSharedFileView(shareId);
    }
  }, [location]);

  useEffect(() => {
    // Log user role when component mounts
    if (user) {
      console.log('User Role:', user.role);
      console.log('User Permissions:', {
        isAdmin: user.role === 'admin',
        canUpload: ['admin', 'regular'].includes(user.role),
        canViewFiles: true // all authenticated users can view files
      });
    }
  }, [user]);

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

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/auth/users/');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleUpload = (file: FileType) => {
    setFiles([file, ...files]);
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

  const handleSharedFileView = async (shareId: string) => {
    setSharedFileView(prev => ({ ...prev, open: true, status: 'loading' }));
    try {
      const response = await api.get(`/api/files/shared/${shareId}/`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data]);
      const blobUrl = window.URL.createObjectURL(blob);
      setSharedFileView({
        open: true,
        fileUrl: blobUrl,
        fileType: response.headers['content-type'],
        status: 'loaded',
        fileName: ''
      });
    } catch (error: any) {
      if (error.response?.status === 410) {
        toast.error('This share link has expired');
      } else if (error.response?.status === 404) {
        toast.error('Share link not found');
      } else {
        toast.error('Error loading shared file');
      }
      setSharedFileView(prev => ({ ...prev, open: false, status: 'error' }));
      navigate('/dashboard');
    }
  };

  const handleCloseSharedView = () => {
    setSharedFileView({
      open: false,
      fileUrl: '',
      fileType: '',
      status: 'loading',
      fileName: ''
    });
    navigate('/dashboard');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', position: 'relative', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Secure File Sharing Application</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'absolute', right: 0 }}>
          {/* Add role chip */}
          <Chip 
            label={`Role: ${user?.role}`} 
            color={user?.role === 'admin' ? 'error' : user?.role === 'regular' ? 'primary' : 'default'}
          />
          <Button variant="outlined" color="error" onClick={() => dispatch(logout())}>
            Logout
          </Button>
        </Box>
      </Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }} />

      {/* Only show file uploader for admin and regular users */}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          aria-label="file tabs"
          sx={{
            '& .MuiTab-root': { 
              textTransform: 'none',
              color: '#666666', // gray color for inactive tabs
              // fontSize: '20px',
              fontWeight: 500,
              '&.Mui-selected': {
                color: '#000000', // black color for active tab
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#000000', // black indicator line
              height: 2,
            }
          }}
        >
          <Tab label="My Files" />
          <Tab label="Shared with Me" />
          {user?.role === 'admin' && <Tab label="Manage Users" />}
        </Tabs>
        {user?.role !== 'guest' && (
          <Box>
            <FileUploader onUploadComplete={fetchFiles} />
          </Box>
        )}
      </Box>

      {activeTab === 0 ? (
        <>
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
      ) : activeTab === 1 ? (
        <Paper>
          <FileList
            files={sharedFiles}
            onDownload={handleDownload}
            onDelete={undefined} // Disable delete for shared files
            onShare={undefined} // Disable sharing for shared files
            showShareOption={false}
          />
        </Paper>
      ) : (
        user?.role === 'admin' && <UserManagement users={users} onUpdate={fetchUsers} />
      )}

      <FileViewerModal
        open={sharedFileView.open}
        onClose={handleCloseSharedView}
        fileId={sharedFileView.fileUrl}
        fileType={sharedFileView.fileType}
        fileName={sharedFileView.fileName}
      />
    </Box>
  );
};

export default DashboardPage; 