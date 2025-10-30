import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// Create axios instance with base configuration
const api: AxiosInstance = axios.create({
  baseURL: '/api', // Proxied through Vite to backend
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('auth_token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (userData: any) =>
    api.post('/auth/register', userData),
};

// Pages API
export const pagesAPI = {
  getAll: () => api.get('/pages'),
  
  getById: (id: string) => api.get(`/pages/${id}`),
  
  create: (pageData: any) => api.post('/pages', pageData),
  
  update: (id: string, pageData: any) => api.put(`/pages/${id}`, pageData),
  
  delete: (id: string) => api.delete(`/pages/${id}`),
};

// Collections API
export const collectionsAPI = {
  getAll: () => api.get('/collections'),
  
  create: (collectionData: any) => api.post('/collections', collectionData),
};

// Media API
export const mediaAPI = {
  getAll: () => api.get('/media'),
  
  upload: (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    };
    
    return api.post('/media/upload', formData, config);
  },
};

// Menus API
export const menusAPI = {
  getAll: () => api.get('/menus'),
  
  create: (menuData: any) => api.post('/menus', menuData),
};

// Forms API
export const formsAPI = {
  getAll: () => api.get('/forms'),
  
  create: (formData: any) => api.post('/forms', formData),
  
  submitResponse: (formId: string, responseData: any) =>
    api.post(`/forms/${formId}/responses`, responseData),
};

// Health check
export const healthCheck = () => api.get('/health');

export default api;


