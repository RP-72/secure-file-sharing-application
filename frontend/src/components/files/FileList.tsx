import React, { useState } from 'react';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Box,
  Typography,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Share as ShareIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { FileType } from '../../types/file';
import { ShareFileModal } from './ShareFileModal';
import { formatFileSize } from '../../utils/formatters';
import { FileViewerModal } from './FileViewer';
import api from '../../services/api';
import { getShareUrl } from '../../utils/urls';
import toast from 'react-hot-toast';

interface FileListProps {
  files: FileType[];
  onDownload: (file: FileType) => void;
  onDelete?: (file: FileType) => void;
  onShare?: (file: FileType) => void;
  showShareOption?: boolean;
}


export const FileList: React.FC<FileListProps> = ({
  files = [],
  onDownload,
  onDelete,
  onShare,
  showShareOption = false,
}) => {
  const [selectedFile, setSelectedFile] = useState<FileType | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuFile, setMenuFile] = useState<FileType | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerStatus, setViewerStatus] = useState<string>("");

  const handleViewFile = async (file: FileType) => {
    setViewerOpen(true);
    setViewerStatus("loading");
    try {
      // Fetch the file content
      const response = await api.get(file.url, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data]);
      const blobUrl = window.URL.createObjectURL(blob);
      setSelectedFile({
        ...file,
        url: blobUrl
      });
      setViewerStatus("loaded");
    } catch (error) {
      setViewerStatus("error");
      console.error('Error loading file for preview:', error);
      // You might want to add error handling UI here
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, file: FileType) => {
    setAnchorEl(event.currentTarget);
    setMenuFile(file);
  };

  const handleCreateShareLink = async (fileId: string) => {
    try {
      const response = await api.post(`/api/files/${fileId}/create-share-link/`);
      const shareId = response.data.id;
      const shareUrl = getShareUrl(shareId);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      // Show success message
      toast.success('Share link copied to clipboard');
    } catch (error) {
      toast.error('Failed to create share link');
    }
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuFile(null);
  };

  const handleRowClick = (file: FileType) => {
    handleViewFile(file);
  };

  console.log("Files", files)

  if (!Array.isArray(files)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Size</TableCell>
            <TableCell>Type</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {files.map((file) => (
            <TableRow 
              key={file.id}
              onClick={() => handleRowClick(file)}
              sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
            >
              <TableCell>{file.name}</TableCell>
              <TableCell>{formatFileSize(file.size)}</TableCell>
              <TableCell>{file.mime_type}</TableCell>
              <TableCell align="right">
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  {showShareOption && (
                    <>
                      <Tooltip title="Share">
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(file);
                            setIsShareModalOpen(true);
                          }}
                          size="small"
                        >
                          <ShareIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Get Share Link">
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateShareLink(file.id);
                          }}
                          size="small"
                        >
                          <LinkIcon />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                  {onDelete && (
                    <Tooltip title="Delete">
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(file);
                        }}
                        size="small"
                        sx={{ color: 'error.main' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {files.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">No files found</Typography>
        </Box>
      )}

      {selectedFile && (
        <ShareFileModal
          open={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          file={selectedFile}
          onShare={() => onShare?.(selectedFile)}
        />
      )}
      {selectedFile && (
        <FileViewerModal
          open={viewerOpen}
          onClose={() => setViewerOpen(false)}
          fileId={selectedFile.id}
          fileType={selectedFile.mime_type}
          fileName={selectedFile.name}
        />
      )}
    </>
  );
}; 