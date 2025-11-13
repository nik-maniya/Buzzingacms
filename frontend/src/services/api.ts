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
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
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
      localStorage.removeItem('token');
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
  getAll: () => api.get('/collections/getAll'),
  
  create: (collectionData: any) => api.post('/collections/create', collectionData),

  delete: (id: string) => api.delete(`/collections/deleteCollection/${id}`),
  
  update: (id: string, collectionData: any) => api.put(`/collections/updateCollection/${id}`, collectionData),
};

// Collection Fields API
export const collectionFieldsAPI = {
  getAll: (collectionId: string) => api.get(`/collection-fields/getAllCollectionFields/${collectionId}`),
  getAllFieldName: (collectionId: string) => api.get(`/collection-fields/getAllFieldName/${collectionId}`),
  getById: (id: string) => api.get(`/collection-fields/getCollectionFieldById/${id}`),
  create: (collectionFieldData: any) => api.post('/collection-fields/createCollectionField', collectionFieldData),
  update: (id: string, collectionFieldData: any) => api.put(`/collection-fields/updateCollectionField/${id}`, collectionFieldData),
  delete: (id: string) => api.delete(`/collection-fields/deleteCollectionField/${id}`),
};

// Collection Items API
export const collectionItemsAPI = {
  getAll: (collectionId: string) => api.get(`/collection-items/getAllCollectionItems/${collectionId}`),
  getById: (id: string) => api.get(`/collection-items/getCollectionItemById/${id}`),
  create: (itemData: any) => api.post('/collection-items/createCollectionItem', itemData),
  update: (id: string, itemData: any) => api.put(`/collection-items/updateCollectionItem/${id}`, itemData),
  delete: (id: string) => api.delete(`/collection-items/deleteCollectionItem/${id}`),
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
  getAll: () => api.get('/forms/getAllForms'),
  getById: (id: string) => api.get(`/forms/getFormById/${id}`),
  update: (id: string, formData: any) => api.put(`/forms/updateForms/${id}`, formData),
  
  create: (formData: any) => api.post('/forms/createForms', formData),
  
  submitResponse: (formId: string, responseData: any) =>
    api.post(`/forms/${formId}/responses`, responseData),
  
  delete: (formId: string) => api.delete(`/forms/deleteForms/${formId}`),
};

// Page Templates API
export const pageTemplatesAPI = {
  getAll: (collectionId: string) => api.get(`/page-templates/getAllPageTemplates/${collectionId}`),
  getById: (id: string, itemId?: string) => {
    const url = itemId 
      ? `/page-templates/getPageTemplateById/${id}?itemId=${itemId}`
      : `/page-templates/getPageTemplateById/${id}`;
    return api.get(url);
  },
  create: (templateData: { collectionId: string | number; htmlContent: string }) =>
    api.post('/page-templates/createPageTemplate', templateData),
  update: (id: string, templateData: { name?: string; description?: string; htmlContent?: string }) =>
    api.put(`/page-templates/updatePageTemplate/${id}`, templateData),
  delete: (id: string) => api.delete(`/page-templates/deletePageTemplate/${id}`),
  render: (templateId: string, itemId: string) =>
    api.get(`/page-templates/renderTemplate/${templateId}/${itemId}`),
  // Render a single collection item using the latest template for the collection
  renderItem: (collectionId: string | number, itemId: string | number) =>
    api.get(`/page-templates/renderItem/${collectionId}/${itemId}`),
};

// Domain API
export const domainAPI = {
  // Get current user's domain
  getDomain: () => api.get('/domain/getDomain'),
  
  // Upsert domain (create or update)
  upsertDomain: (domainData: { domainName: string }) =>
    api.post('/domain/upsertDomain', domainData),
  
  // Create DNS record
  createDNSRecord: (recordData: {
    domainId: number;
    type: string;
    name: string;
    value: string;
    ttl?: number;
  }) => api.post('/domain/createDNSRecord', recordData),
};

// Health check
export const healthCheck = () => api.get('/health');

export default api;


