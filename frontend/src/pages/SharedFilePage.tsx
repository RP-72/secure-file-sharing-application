import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { FileViewerModal } from '../components/files/FileViewer';
import api from '../services/api';
import { Box, Typography, CircularProgress } from '@mui/material';

const SharedFilePage = () => {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedFile = async () => {
      try {
        if (!isAuthenticated) {
          // Store the current URL to redirect back after login
          localStorage.setItem('redirectAfterLogin', window.location.pathname);
          navigate('/login');
          return;
        }

        const response = await api.get(`/api/files/shared/${shareId}/`, {
          responseType: 'blob'
        });
        
        const blob = new Blob([response.data]);
        const blobUrl = window.URL.createObjectURL(blob);
        setFileUrl(blobUrl);
        setFileType(response.headers['content-type']);
        setStatus('loaded');
      } catch (error: any) {
        if (error.response?.status === 410) {
          setError('This share link has expired');
        } else if (error.response?.status === 404) {
          setError('Share link not found');
        } else {
          setError('Error loading shared file');
        }
        setStatus('error');
      }
    };

    fetchSharedFile();
  }, [shareId, isAuthenticated, navigate]);

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <FileViewerModal
      open={true}
      onClose={() => navigate('/')}
      fileUrl={fileUrl || ''}
      fileType={fileType || ''}
      status={status}
    />
  );
};

export default SharedFilePage; 