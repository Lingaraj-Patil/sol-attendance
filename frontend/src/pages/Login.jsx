import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Coins, Mail, Lock, AlertCircle } from 'lucide-react';

const Login = () => {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: roleParam || ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, updateUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (roleParam) {
      setFormData(prev => ({ ...prev, role: roleParam }));
    }
  }, [roleParam]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Clear any stale auth data before attempting login
    localStorage.removeItem('malsAdminToken');
    localStorage.removeItem('malsAdmin');
    localStorage.removeItem('teacherInfo');
    localStorage.removeItem('studentInfo');

    try {
      // Use only the unified login endpoint - it handles all user types and formats
      console.log('🔐 Login attempt starting...', { email: formData.email });
      const result = await login(formData.email, formData.password);
      console.log('🔐 Login result:', result);
      
      if (result.success) {
        // Clear any old auth data first
        localStorage.removeItem('malsAdminToken');
        localStorage.removeItem('malsAdmin');
        localStorage.removeItem('teacherInfo');
        localStorage.removeItem('studentInfo');
        
        setLoading(false);
        console.log('✅ Login successful, navigating to dashboard');
        navigate('/dashboard');
        return;
      } else {
        // Login returned false
        const errorMsg = result.message || 'Invalid email/username or password. Please check your credentials.';
        setError(errorMsg);
        console.error('❌ Unified login failed:', result.message);
      }
    } catch (loginError) {
      // Unified login threw an error
      console.error('❌ Login exception:', loginError);
      let errorMessage = 'Invalid email/username or password. Please check your credentials.';
      
      // Check for network errors
      if (loginError.code === 'ERR_NETWORK' || loginError.message?.includes('Network Error')) {
        errorMessage = 'Cannot connect to server. Please make sure the backend server is running on port 5001.';
      } else if (loginError.response) {
        errorMessage = loginError.response?.data?.message || errorMessage;
      } else if (loginError.message) {
        errorMessage = loginError.message;
      }
      
      setError(errorMessage);
      console.error('Login error details:', {
        response: loginError?.response?.data,
        message: loginError?.message,
        status: loginError?.response?.status,
        statusText: loginError?.response?.statusText,
        code: loginError?.code
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Coins className="h-16 w-16 text-primary-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Solana Attendance System
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {roleParam ? `Sign in as ${roleParam.charAt(0).toUpperCase() + roleParam.slice(1)}` : 'Sign in to your account'}
          </p>
          {roleParam && (
            <div className="mt-2 inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
              {roleParam === 'admin' ? 'Admin Login' : roleParam === 'student' ? 'Student Login' : 'Teacher Login'}
            </div>
          )}
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                Register here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;