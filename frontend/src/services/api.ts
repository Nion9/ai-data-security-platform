import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 errors (token expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (!refreshToken) {
              this.clearAuth();
              window.location.href = '/login';
              return Promise.reject(error);
            }

            const response = await this.refreshAccessToken(refreshToken);
            const { access_token } = response.data;

            localStorage.setItem('access_token', access_token);
            this.api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
            originalRequest.headers['Authorization'] = `Bearer ${access_token}`;

            return this.api(originalRequest);
          } catch (refreshError) {
            this.clearAuth();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        // Handle other errors
        if (error.response?.data?.detail) {
          toast.error(error.response.data.detail);
        } else if (error.message) {
          toast.error(error.message);
        }

        return Promise.reject(error);
      }
    );
  }

  private clearAuth() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    delete this.api.defaults.headers.common['Authorization'];
  }

  async refreshAccessToken(refreshToken: string): Promise<AxiosResponse> {
    return axios.post(`${API_BASE_URL}/api/auth/refresh`, {}, {
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
    });
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    const response = await this.api.post('/api/auth/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  }

  async register(email: string, password: string, fullName?: string) {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    if (fullName) formData.append('full_name', fullName);

    const response = await this.api.post('/api/auth/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }

  async logout() {
    try {
      await this.api.post('/api/auth/logout');
    } finally {
      this.clearAuth();
    }
  }

  async getCurrentUser() {
    const response = await this.api.get('/api/auth/me');
    return response.data;
  }

  // Data endpoints
  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.api.post('/api/data/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }

  async processDataset(datasetId: string, action: string, columns?: string[]) {
    const formData = new FormData();
    formData.append('action', action);
    if (columns && columns.length > 0) {
      columns.forEach(column => formData.append('columns', column));
    }

    const response = await this.api.post(`/api/data/process/${datasetId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }

  async getDatasets() {
    const response = await this.api.get('/api/data/datasets');
    return response.data;
  }

  async downloadDataset(datasetId: string) {
    const response = await this.api.get(`/api/data/download/${datasetId}`, {
      responseType: 'blob',
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cleaned_dataset_${datasetId}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  async deleteDataset(datasetId: string) {
    const response = await this.api.delete(`/api/data/dataset/${datasetId}`);
    return response.data;
  }
}

export default new ApiService();