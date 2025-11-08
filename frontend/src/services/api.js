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
      // Only redirect to login if we're not on registration/connect-institute pages
      // This prevents redirecting during student/teacher registration flow
      const currentPath = window.location.pathname;
      const isRegistrationFlow = currentPath.includes('/register') || 
                                 currentPath.includes('/connect-institute') ||
                                 currentPath.includes('/register-institute');
      
      if (!isRegistrationFlow) {
        // Clear all auth-related localStorage items
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('malsAdminToken');
        localStorage.removeItem('malsAdmin');
        localStorage.removeItem('teacherInfo');
        localStorage.removeItem('studentInfo');
        window.location.href = '/login';
      }
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
  enroll: (data) => api.post('/courses/enroll', data),
  assignTeacher: (courseId, teacherId) => api.post(`/courses/${courseId}/assign-teacher`, { teacherId }),
  getByCollege: (collegeUniqueId) => api.get(`/courses/college/${collegeUniqueId}`) // Public endpoint
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

// MALS API - Admin
// Using main backend (port 5001) with /api/mals prefix
export const malsAdminAPI = {
  register: (data) => api.post('/mals/admin/register', data),
  login: (data) => api.post('/mals/admin/login', data),
  createCourse: (data) => api.post('/mals/admin/courses', data),
  registerCollege: (adminId, data) => api.post(`/mals/admin/${adminId}/college`, data),
  updateCapacity: (adminId, data) => api.patch(`/mals/admin/${adminId}/capacity`, data),
  getProfile: (adminId) => api.get(`/mals/admin/${adminId}`),
  getFeedbacks: () => api.get('/mals/admin/feedbacks/list')
};

// MALS API - Student
export const malsStudentAPI = {
  register: (data) => api.post('/mals/students/register', data),
  login: (data) => api.post('/mals/students/login', data),
  getAll: (params) => api.get('/mals/students', { params }), // Get all students (for admin)
  getProfile: (studentId) => api.get(`/mals/students/${studentId}`),
  updateProfile: (studentId, data) => api.patch(`/mals/students/${studentId}`, data),
  submitFeedback: (studentId, data) => api.post(`/mals/students/${studentId}/feedback`, data),
  selectCourses: (studentId, data) => api.post(`/mals/students/${studentId}/courses`, data),
  getSelectedCourses: (studentId) => api.get(`/mals/students/${studentId}/courses`)
};

// MALS API - Teacher
export const malsTeacherAPI = {
  register: (data) => api.post('/mals/teachers/register', data),
  login: (data) => api.post('/mals/teachers/login', data),
  getProfile: (teacherId) => api.get(`/mals/teachers/${teacherId}`),
  updateProfile: (teacherId, data) => api.patch(`/mals/teachers/${teacherId}`, data),
  getCourses: (teacherId) => api.get(`/mals/teachers/${teacherId}/courses`),
  getAll: (adminId) => api.get('/mals/teachers', { 
    params: adminId ? { adminId } : {} 
  }) // Get all teachers, optionally filtered by admin's college
};

// Timetable API
const TIMETABLE_API_URL = 'https://timetable-generator-4.onrender.com';

export const timetableAPI = {
  // External API calls
  generate: (data) => axios.post(`${TIMETABLE_API_URL}/api/generate`, data),
  validate: (data) => axios.post(`${TIMETABLE_API_URL}/api/validate`, data),
  getInfo: () => axios.get(`${TIMETABLE_API_URL}/api/info`),
  
  // Internal API calls (for storing/retrieving timetables)
  save: (data) => api.post('/timetables', data),
  autoGenerate: (data) => api.post('/timetables/auto-generate', data),
  getAll: (params) => api.get('/timetables', { params }),
  getOne: (id) => api.get(`/timetables/${id}`),
  update: (id, data) => api.put(`/timetables/${id}`, data),
  delete: (id) => api.delete(`/timetables/${id}`),
  getActive: () => api.get('/timetables/active'),
  getByUser: (userId) => api.get(`/timetables/user/${userId}`)
};

export default api;