import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import api from '../services/api';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
  datasetId?: string;
  analysis?: any;
}

const FileUpload: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      status: 'pending' as const,
      progress: 0,
    }));

    setFiles(prev => [...prev, ...newFiles]);
    
    // Auto-upload files
    for (const file of acceptedFiles) {
      await handleUpload(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/json': ['.json'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  });

  const handleUpload = async (file: File) => {
    const fileId = Math.random().toString(36).substr(2, 9);
    
    setFiles(prev =>
      prev.map(f =>
        f.name === file.name ? { ...f, status: 'uploading', progress: 0 } : f
      )
    );

    setUploading(true);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setFiles(prev =>
          prev.map(f =>
            f.name === file.name
              ? { ...f, progress: Math.min(f.progress + 10, 90) }
              : f
          )
        );
      }, 200);

      // Actual upload
      const response = await api.uploadFile(file);
      
      clearInterval(progressInterval);

      setFiles(prev =>
        prev.map(f =>
          f.name === file.name
            ? {
                ...f,
                status: 'completed',
                progress: 100,
                datasetId: response.dataset_id,
                analysis: response.analysis,
              }
            : f
        )
      );

      toast.success(`File "${file.name}" uploaded successfully!`);
      
      // Refresh datasets list
      // You can add a callback prop here if needed

    } catch (error: any) {
      setFiles(prev =>
        prev.map(f =>
          f.name === file.name
            ? {
                ...f,
                status: 'error',
                error: error.message || 'Upload failed',
              }
            : f
        )
      );
      toast.error(`Failed to upload "${file.name}"`);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const retryUpload = async (file: UploadedFile) => {
    const fileObj = new File([], file.name, {
      type: 'text/csv',
      lastModified: Date.now(),
    });
    
    // Note: We need the actual file object to retry
    // In a real app, you'd store the file object
    toast.error('Please re-select the file to retry upload');
  };

  return (
    <Box>
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'action.hover',
          },
        }}
      >
        <input {...getInputProps()} />
        <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          or click to select files
        </Typography>
        <Typography variant="caption" color="textSecondary">
          Supports CSV, Excel, JSON files (Max 10MB)
        </Typography>
      </Paper>

      {files.length > 0 && (
        <Paper sx={{ mt: 3, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Upload Queue ({files.length})
          </Typography>
          <List>
            {files.map(file => (
              <ListItem
                key={file.id}
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:last-child': { borderBottom: 'none' },
                }}
                secondaryAction={
                  <IconButton
                    edge="end"
                    onClick={() => removeFile(file.id)}
                    disabled={file.status === 'uploading'}
                  >
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemIcon>
                  {file.status === 'completed' ? (
                    <CheckIcon color="success" />
                  ) : file.status === 'error' ? (
                    <ErrorIcon color="error" />
                  ) : (
                    <FileIcon />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box>
                      <Typography variant="body1">{file.name}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {formatFileSize(file.size)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    file.status === 'uploading' ? (
                      <Box sx={{ width: '100%', mt: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={file.progress}
                        />
                        <Typography variant="caption">
                          {file.progress}%
                        </Typography>
                      </Box>
                    ) : file.status === 'error' ? (
                      <Typography color="error" variant="caption">
                        {file.error}
                      </Typography>
                    ) : file.status === 'completed' ? (
                      <Typography color="success" variant="caption">
                        Upload complete • {file.analysis?.pii_summary?.total_pii || 0} PII items found
                      </Typography>
                    ) : null
                  }
                />
                {file.status === 'error' && (
                  <Button
                    size="small"
                    onClick={() => retryUpload(file)}
                    sx={{ ml: 2 }}
                  >
                    Retry
                  </Button>
                )}
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {uploading && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress />
          <Typography variant="body2" align="center" sx={{ mt: 1 }}>
            Uploading files...
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default FileUpload;