import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  LinearProgress,
  CircularProgress,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import api from '../services/api';

interface Dataset {
  id: string;
  original_filename: string;
  processed_filename: string | null;
  file_size: number;
  status: string;
  pii_count: number;
  total_records: number;
  action_taken: string | null;
  created_at: string;
  processed_at: string | null;
  sensitive_fields?: any;
}

const DataTable: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [processingAction, setProcessingAction] = useState<'redact' | 'anonymize' | 'remove'>('redact');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      const data = await api.getDatasets();
      setDatasets(data);
    } catch (error) {
      toast.error('Failed to fetch datasets');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, dataset: Dataset) => {
    setAnchorEl(event.currentTarget);
    setSelectedDataset(dataset);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDownload = async () => {
    if (!selectedDataset) return;
    
    try {
      await api.downloadDataset(selectedDataset.id);
      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download file');
    }
    
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!selectedDataset) return;
    
    if (window.confirm(`Are you sure you want to delete "${selectedDataset.original_filename}"?`)) {
      try {
        await api.deleteDataset(selectedDataset.id);
        setDatasets(datasets.filter(d => d.id !== selectedDataset.id));
        toast.success('Dataset deleted successfully');
      } catch (error) {
        toast.error('Failed to delete dataset');
      }
    }
    
    handleMenuClose();
  };

  const handleProcess = () => {
    if (!selectedDataset) return;
    
    // Load analysis data
    const dataset = datasets.find(d => d.id === selectedDataset.id);
    if (dataset && dataset.sensitive_fields) {
      setAnalysis(dataset.sensitive_fields);
      
      // Auto-select columns with PII
      const columnsWithPII = dataset.sensitive_fields.columns
        ?.filter((col: any) => col.pii_count > 0 || col.suspected_types.length > 0)
        .map((col: any) => col.name) || [];
      
      setSelectedColumns(columnsWithPII);
    }
    
    setProcessDialogOpen(true);
    handleMenuClose();
  };

  const handleProcessSubmit = async () => {
    if (!selectedDataset) return;
    
    setProcessing(true);
    try {
      await api.processDataset(selectedDataset.id, processingAction, selectedColumns);
      toast.success(`Data ${processingAction}ed successfully`);
      setProcessDialogOpen(false);
      fetchDatasets(); // Refresh list
    } catch (error) {
      toast.error('Failed to process dataset');
    } finally {
      setProcessing(false);
    }
  };

  const handleColumnToggle = (columnName: string) => {
    setSelectedColumns(prev =>
      prev.includes(columnName)
        ? prev.filter(name => name !== columnName)
        : [...prev, columnName]
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploaded':
        return 'default';
      case 'analyzed':
        return 'info';
      case 'processing':
        return 'warning';
      case 'processed':
        return 'success';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Filename</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>PII Count</TableCell>
                <TableCell>Records</TableCell>
                <TableCell>Uploaded</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {datasets
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map(dataset => (
                  <TableRow key={dataset.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {dataset.original_filename}
                        </Typography>
                        {dataset.action_taken && (
                          <Chip
                            label={dataset.action_taken}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ mt: 0.5 }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{formatFileSize(dataset.file_size)}</TableCell>
                    <TableCell>
                      <Chip
                        label={dataset.status}
                        color={getStatusColor(dataset.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={dataset.pii_count}
                        color={dataset.pii_count > 0 ? 'error' : 'success'}
                        size="small"
                        icon={<SecurityIcon />}
                      />
                    </TableCell>
                    <TableCell>{dataset.total_records}</TableCell>
                    <TableCell>{formatDate(dataset.created_at)}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, dataset)}
                      >
                        <MoreIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={datasets.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedDataset?.processed_filename && (
          <MenuItem onClick={handleDownload}>
            <DownloadIcon sx={{ mr: 1 }} /> Download
          </MenuItem>
        )}
        <MenuItem onClick={handleProcess}>
          <SecurityIcon sx={{ mr: 1 }} /> Process/Clean
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <DeleteIcon sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      <Dialog
        open={processDialogOpen}
        onClose={() => !processing && setProcessDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Process Dataset: {selectedDataset?.original_filename}
        </DialogTitle>
        <DialogContent>
          {analysis && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Detected PII Summary
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2">
                  Total PII Items: {analysis.pii_summary?.total_pii || 0}
                </Typography>
                <Typography variant="body2">
                  PII Percentage: {analysis.pii_summary?.pii_percentage?.toFixed(2) || 0}%
                </Typography>
              </Box>

              <Typography variant="subtitle1" gutterBottom>
                Select Action
              </Typography>
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={processingAction === 'redact'}
                      onChange={() => setProcessingAction('redact')}
                    />
                  }
                  label="Redact PII (Replace with █)"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={processingAction === 'anonymize'}
                      onChange={() => setProcessingAction('anonymize')}
                    />
                  }
                  label="Anonymize (Replace with [TYPE_REDACTED])"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={processingAction === 'remove'}
                      onChange={() => setProcessingAction('remove')}
                    />
                  }
                  label="Remove Columns"
                />
              </Box>

              <Typography variant="subtitle1" gutterBottom>
                Select Columns to Process
              </Typography>
              <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                {analysis.columns?.map((column: any, index: number) => (
                  <FormControlLabel
                    key={index}
                    control={
                      <Checkbox
                        checked={selectedColumns.includes(column.name)}
                        onChange={() => handleColumnToggle(column.name)}
                        disabled={column.pii_count === 0 && column.suspected_types.length === 0}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2">
                          {column.name}
                          {column.pii_count > 0 && (
                            <Chip
                              label={`${column.pii_count} PII`}
                              size="small"
                              color="error"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Typography>
                        {column.suspected_types.length > 0 && (
                          <Typography variant="caption" color="textSecondary">
                            Suspected: {column.suspected_types.join(', ')}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                ))}
              </Box>
            </Box>
          )}

          {processing && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                Processing dataset...
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setProcessDialogOpen(false)}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleProcessSubmit}
            variant="contained"
            disabled={processing || selectedColumns.length === 0}
          >
            {processing ? 'Processing...' : 'Process'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DataTable;