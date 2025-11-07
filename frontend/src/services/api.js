import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {    
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me')
};

// Token API
export const tokenAPI = {
  create: (data) => api.post('/tokens', data),
  getAll: () => api.get('/tokens'),
  getOne: (id) => api.get(`/tokens/${id}`),
  getBalance: (walletAddress, tokenId) => 
    api.get('/tokens/balance', { params: { walletAddress, tokenId } }),
  transfer: (data) => api.post('/tokens/transfer', data),
  getStudents: () => api.get('/tokens/students'),
  getTransactions: (params) => api.get('/tokens/transactions', { params })
};

// Course API
export const courseAPI = {
  create: (data) => api.post('/courses', data),
  getAll: (params) => api.get('/courses', { params }),
  getOne: (id) => api.get(`/courses/${id}`),
  update: (id, data) => api.put(`/courses/${id}`, data),
  enroll: (data) => api.post('/courses/enroll', data)
};

// Attendance API
export const attendanceAPI = {
  mark: (data) => api.post('/attendance/mark', data),
  getAll: (params) => api.get('/attendance', { params }),
  getStats: (studentId) => api.get(`/attendance/stats/${studentId}`)
};

// Marketplace API
export const marketplaceAPI = {
  create: (data) => api.post('/marketplace', data),
  getAll: (params) => api.get('/marketplace', { params }),
  getOne: (id) => api.get(`/marketplace/${id}`),
  update: (id, data) => api.put(`/marketplace/${id}`, data),
  delete: (id) => api.delete(`/marketplace/${id}`),
  purchase: (data) => api.post('/marketplace/purchase', data),
  getHistory: (params) => api.get('/marketplace/history', { params })
};

export default api;