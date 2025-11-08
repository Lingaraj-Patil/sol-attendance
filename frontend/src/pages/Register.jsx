import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI, malsAdminAPI, malsStudentAPI, malsTeacherAPI } from '../services/api';
import { Coins, User, Mail, Lock, Wallet, AlertCircle, GraduationCap, Briefcase, Building2 } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    // Unified fields
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'student',
    walletAddress: '',
    collegeUniqueId: '', // Required for students and teachers
    // Student-specific fields
    age: '',
    gender: '',
    Program: '',
    feedback: '',
    maxCourses: '',
    // Teacher-specific fields
    experience: '',
    department: '',
    workingHour: '',
    // Admin-specific fields
    labCapacity: '',
    classCapacity: '',
    // Timetable fields (for both student and teacher)
    availability: [],
    interests: [],
    preferredTimeSlots: [],
    coursePreferences: []
  });
  
  const [selectedAvailability, setSelectedAvailability] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState('');
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields based on role
      if (formData.role === 'admin') {
        // For admin, username can be in username or email field
        const adminUsername = formData.username || formData.email;
        if (!formData.name || !adminUsername || !formData.password) {
          setError('Please fill in all required fields (Name, Username, Password)');
          setLoading(false);
          return;
        }
      } else {
        if (!formData.name || !formData.email || !formData.password || !formData.role) {
          setError('Please fill in all required fields');
          setLoading(false);
          return;
        }
      }

      // Validate wallet for students (admin doesn't need wallet in MALS)
      if (formData.role === 'student' && !formData.walletAddress) {
        setError('Wallet address is required for students');
        setLoading(false);
        return;
      }
      // Teacher only needs name, username, password - institute connection is next step
      // Admin only needs name, username, password - institute registration is next step

      // Handle admin registration separately using MALS API
      if (formData.role === 'admin') {
        try {
          // For admin, username can be in username or email field
          const adminUsername = formData.username || formData.email;
          const adminData = {
            username: adminUsername,
            password: formData.password
          };
          
          const response = await malsAdminAPI.register(adminData);
          
          // Store admin token and info
          // Main backend returns: { success, message, token, data: { admin: { id, username, ... } } }
          const token = response.data.token || response.data.data?.token;
          const admin = response.data.data?.admin || response.data.admin;
          
          if (token) {
            localStorage.setItem('malsAdminToken', token);
            localStorage.setItem('token', token); // Also store in main token for consistency
            localStorage.setItem('malsAdmin', JSON.stringify(admin));
            // Redirect to institute registration
            navigate('/register-institute');
          } else {
            setError('Registration successful but no token received');
            setLoading(false);
          }
        } catch (error) {
          console.error('Admin registration error:', error);
          const errorMessage = error.response?.data?.message || 
                             error.response?.data?.error || 
                             error.message || 
                             'Admin registration failed';
          setError(errorMessage);
          setLoading(false);
        }
        return;
      }

      // Handle student registration - Step 1: Only collect name, email (as username), password
      if (formData.role === 'student') {
        if (!formData.name || !formData.email || !formData.password) {
          setError('Please fill in all required fields (Name, Email, Password)');
          setLoading(false);
          return;
        }
        
        // Store student basic info in localStorage and redirect to connect institute
        // Use email as username for students (backend expects username)
        const studentInfo = {
          name: formData.name,
          username: formData.email, // Use email as username for students
          password: formData.password,
          walletAddress: formData.walletAddress // Store wallet address for later
        };
        
        localStorage.setItem('studentInfo', JSON.stringify(studentInfo));
        navigate('/connect-institute');
        return;
      }

      // Handle teacher registration - Step 1: Only collect name, email (as username), password
      if (formData.role === 'teacher') {
        if (!formData.name || !formData.email || !formData.password) {
          setError('Please fill in all required fields (Name, Email, Password)');
          setLoading(false);
          return;
        }
        
        // Store teacher basic info in localStorage and redirect to connect institute
        // Use email as username for teachers (backend expects username)
        const teacherInfo = {
          name: formData.name,
          username: formData.email, // Use email as username for teachers
          password: formData.password
        };
        
        localStorage.setItem('teacherInfo', JSON.stringify(teacherInfo));
        navigate('/connect-institute');
        return;
      }

      // Prepare unified registration data for other roles (if any)
      const registrationData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        walletAddress: formData.walletAddress,
        // Timetable fields
        availability: selectedAvailability,
        interests: selectedInterests.split(',').map(i => i.trim()).filter(i => i),
        preferredTimeSlots: selectedTimeSlots,
        coursePreferences: formData.coursePreferences
      };

      const result = await register(registrationData);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const needsWallet = formData.role === 'student' || formData.role === 'admin';
  const isStudent = formData.role === 'student';
  const isTeacher = formData.role === 'teacher';
  const isAdmin = formData.role === 'admin';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="relative">
              <Coins className="h-12 w-12 text-primary-600" />
              <GraduationCap className="h-8 w-8 text-primary-500 absolute -bottom-1 -right-1" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Create Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Unified system with token rewards & course management
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Common fields for all roles */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {!isAdmin && (
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
                    required={!isAdmin}
                    value={formData.email}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
            )}

            {isAdmin && (
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username || formData.email || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, username: value, email: value });
                    }}
                    className="input-field pl-10"
                    placeholder="admin_username"
                  />
                </div>
              </div>
            )}

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
                  minLength="6"
                />
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Wallet Address (for students and admin) */}
            {needsWallet && (
              <div>
                <label htmlFor="walletAddress" className="block text-sm font-medium text-gray-700">
                  Solana Wallet Address
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Wallet className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="walletAddress"
                    name="walletAddress"
                    type="text"
                    required={needsWallet}
                    value={formData.walletAddress}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="Enter your Solana wallet address"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Required for receiving reward tokens
                </p>
              </div>
            )}

            {/* Student-specific fields - Only wallet address needed here */}
            {/* Rest of the fields (age, gender, Program, collegeUniqueId, etc.) will be collected on connect-institute page */}
            {isStudent && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> After entering your name, email, password, and wallet address, you will be redirected to connect with your institute where you'll provide your college ID and other details.
                </p>
              </div>
            )}

            {/* Teacher-specific fields - Only name, username, password needed here */}
            {/* Rest of the fields (experience, department, workingHour, collegeUniqueId) will be collected on connect-institute page */}
            {isTeacher && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> After entering your name, username, and password, you will be redirected to connect with your institute where you'll provide your college ID and other details.
                </p>
              </div>
            )}

            {/* Admin-specific fields - Only name, username, password needed */}
            {/* Institute registration will be done in next step */}

          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
