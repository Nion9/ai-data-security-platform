import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Security as SecurityIcon,
  CloudUpload as UploadIcon,
  Storage as StorageIcon,
  TrendingUp as TrendingIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useAuth } from '../services/auth';
import FileUpload from '../components/FileUpload';
import DataTable from '../components/DataTable';
import api from '../services/api';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalPII: 0,
    processedFiles: 0,
    storageUsed: 0,
  });
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const datasets = await api.getDatasets();
      
      const totalPII = datasets.reduce((sum: number, ds: any) => sum + (ds.pii_count || 0), 0);
      const processedFiles = datasets.filter((ds: any) => ds.status === 'processed').length;
      const storageUsed = datasets.reduce((sum: number, ds: any) => sum + (ds.file_size || 0), 0);
      
      setStats({
        totalFiles: datasets.length,
        totalPII,
        processedFiles,
        storageUsed,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const StatCard = ({ title, value, icon, color, subtitle }: any) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.dark`, mr: 2 }}>
            {icon}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="div">
              {value}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {title}
            </Typography>
          </Box>
        </Box>
        {subtitle && (
          <Typography variant="caption" color="textSecondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Welcome Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Welcome back, {user?.full_name || user?.email?.split('@')[0]}!
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Secure your data with AI-powered PII detection and cleaning.
            </Typography>
          </Box>
          <IconButton onClick={fetchStats} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Paper>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Files"
            value={stats.totalFiles}
            icon={<StorageIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="PII Detected"
            value={stats.totalPII}
            icon={<SecurityIcon />}
            color="error"
            subtitle="Across all files"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Processed Files"
            value={stats.processedFiles}
            icon={<TrendingIcon />}
            color="success"
            subtitle={`${stats.totalFiles > 0 ? Math.round((stats.processedFiles / stats.totalFiles) * 100) : 0}% of total`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Storage Used"
            value={formatBytes(stats.storageUsed)}
            icon={<UploadIcon />}
            color="warning"
            subtitle={`${(stats.storageUsed / (100 * 1024 * 1024) * 100).toFixed(1)}% of 100MB`}
          />
        </Grid>
      </Grid>

      {/* Upload Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <UploadIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Upload New Dataset</Typography>
          <Tooltip title="Upload CSV, Excel, or JSON files for PII analysis">
            <InfoIcon sx={{ ml: 1, fontSize: 16, color: 'text.secondary' }} />
          </Tooltip>
        </Box>
        <FileUpload />
      </Paper>

      {/* Datasets Table */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <StorageIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Your Datasets</Typography>
          <Chip
            label={`${stats.totalFiles} files`}
            size="small"
            sx={{ ml: 2 }}
          />
        </Box>
        <DataTable />
      </Paper>

      {/* Security Tips */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <SecurityIcon sx={{ mr: 1 }} />
          Security Best Practices
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="textSecondary">
              <strong>Always validate</strong> user inputs and file types before processing.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="textSecondary">
              <strong>Regularly audit</strong> your datasets and delete unnecessary files.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="textSecondary">
              <strong>Use HTTPS</strong> in production to encrypt data in transit.
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Dashboard;