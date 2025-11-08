import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Try to get user from API first
        try {
          const response = await authAPI.getCurrentUser();
          if (response.data?.data?.user) {
            setUser(response.data.data.user);
            // Update localStorage with fresh user data
            localStorage.setItem('user', JSON.stringify(response.data.data.user));
          }
        } catch (apiError) {
          // If API call fails (e.g., for MALS users or invalid token), try to load from localStorage
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              const userData = JSON.parse(storedUser);
              setUser(userData);
            } catch (parseError) {
              console.error('Error parsing stored user:', parseError);
              // Clear invalid data
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              localStorage.removeItem('malsAdminToken');
              localStorage.removeItem('malsAdmin');
            }
          } else {
            // No stored user, token might be invalid - clear it
            localStorage.removeItem('token');
            localStorage.removeItem('malsAdminToken');
            localStorage.removeItem('malsAdmin');
          }
        }
      } else {
        // No token, clear any stale user data
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          localStorage.removeItem('user');
        }
        localStorage.removeItem('malsAdminToken');
        localStorage.removeItem('malsAdmin');
        localStorage.removeItem('teacherInfo');
        localStorage.removeItem('studentInfo');
      }
    } catch (error) {
      console.error('Load user error:', error);
      // On error, clear potentially corrupted data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { user, token } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const register = async (data) => {
    try {
      const response = await authAPI.register(data);
      const { user, token } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = () => {
    // Clear all authentication-related localStorage items
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('malsAdminToken');
    localStorage.removeItem('malsAdmin');
    localStorage.removeItem('teacherInfo');
    localStorage.removeItem('studentInfo');
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};