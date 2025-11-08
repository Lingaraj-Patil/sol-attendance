import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { malsAdminAPI, malsTeacherAPI } from '../services/api';
import { Building2, Plus, X, AlertCircle, CheckCircle, GraduationCap, BookOpen } from 'lucide-react';

const RegisterInstitute = () => {
  const [formData, setFormData] = useState({
    collegeName: '',
    collegeUniqueId: '',
    programsOffered: [],
    courses: [
      { courseName: '', courseCode: '', description: '', credits: '', instructor: '' },
      { courseName: '', courseCode: '', description: '', credits: '', instructor: '' },
      { courseName: '', courseCode: '', description: '', credits: '', instructor: '' }
    ]
  });

  const [programInput, setProgramInput] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  useEffect(() => {
    loadTeachers();
    // Check if admin is logged in
    const adminToken = localStorage.getItem('malsAdminToken') || localStorage.getItem('token');
    const admin = localStorage.getItem('malsAdmin');
    if (!adminToken || !admin) {
      navigate('/register');
    }
  }, [navigate]);

  const loadTeachers = async () => {
    try {
      setLoadingTeachers(true);
      // Get admin info to filter teachers by college (if college exists)
      const admin = JSON.parse(localStorage.getItem('malsAdmin') || '{}');
      const adminId = admin.id || admin._id;
      
      // If admin has college, filter teachers by college courses
      // Otherwise, show all teachers (during initial registration)
      const response = await malsTeacherAPI.getAll(adminId);
      // Main backend returns: { success, data: { teachers: [...] } }
      if (response.data?.data?.teachers) {
        setTeachers(response.data.data.teachers);
      } else if (response.data?.teachers) {
        setTeachers(response.data.teachers);
      }
    } catch (error) {
      console.error('Error loading teachers:', error);
      // Don't show error if it's just no teachers available
      if (error.response?.status !== 404) {
        setError('Failed to load teachers. Please refresh the page.');
      }
    } finally {
      setLoadingTeachers(false);
    }
  };

  const handleChange = (e, index = null) => {
    if (index !== null) {
      // Update course field
      const updatedCourses = [...formData.courses];
      updatedCourses[index] = {
        ...updatedCourses[index],
        [e.target.name]: e.target.value
      };
      setFormData({ ...formData, courses: updatedCourses });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
    setError('');
  };

  const addProgram = () => {
    if (programInput.trim() && !formData.programsOffered.includes(programInput.trim())) {
      setFormData({
        ...formData,
        programsOffered: [...formData.programsOffered, programInput.trim()]
      });
      setProgramInput('');
    }
  };

  const removeProgram = (program) => {
    setFormData({
      ...formData,
      programsOffered: formData.programsOffered.filter(p => p !== program)
    });
  };

  const addCourse = () => {
    setFormData({
      ...formData,
      courses: [...formData.courses, { courseName: '', courseCode: '', description: '', credits: '', instructor: '' }]
    });
  };

  const removeCourse = (index) => {
    if (formData.courses.length > 3) {
      const updatedCourses = formData.courses.filter((_, i) => i !== index);
      setFormData({ ...formData, courses: updatedCourses });
    } else {
      setError('Minimum 3 courses are required');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage(null);

    try {
      // Validate form
      if (!formData.collegeName || !formData.collegeUniqueId) {
        setError('College name and unique ID are required');
        setLoading(false);
        return;
      }

      if (formData.programsOffered.length === 0) {
        setError('At least one program must be offered');
        setLoading(false);
        return;
      }

      if (formData.courses.length < 3) {
        setError('Minimum 3 courses are required');
        setLoading(false);
        return;
      }

      // Validate all courses
      for (let i = 0; i < formData.courses.length; i++) {
        const course = formData.courses[i];
        if (!course.courseName || !course.courseCode || !course.description || !course.credits) {
          setError(`Course ${i + 1} is missing required fields (Course Name, Course Code, Description, Credits)`);
          setLoading(false);
          return;
        }
        if (isNaN(course.credits) || parseFloat(course.credits) <= 0) {
          setError(`Course ${i + 1} credits must be a positive number`);
          setLoading(false);
          return;
        }
        // Instructor is optional, but if provided, validate it exists
        if (course.instructor) {
          const instructorExists = teachers.find(t => t.id === course.instructor);
          if (!instructorExists) {
            setError(`Course ${i + 1} has an invalid instructor selected`);
            setLoading(false);
            return;
          }
        }
      }

      // Get admin info
      const admin = JSON.parse(localStorage.getItem('malsAdmin') || '{}');
      const adminId = admin.id || admin._id;
      if (!adminId) {
        setError('Admin information not found. Please register again.');
        setLoading(false);
        return;
      }

      // First, create all courses
      const createdCourses = [];
      for (const course of formData.courses) {
        try {
          const courseData = {
            courseName: course.courseName,
            courseCode: course.courseCode,
            description: course.description,
            credits: parseFloat(course.credits),
            ...(course.instructor && { instructor: course.instructor }) // Only include if provided
          };
          
          const courseResponse = await malsAdminAPI.createCourse(courseData);
          // Main backend returns: { success, message, data: { course: { _id, ... } } }
          const courseId = courseResponse.data.data?.course?._id || courseResponse.data.course?._id;
          if (courseId) {
            createdCourses.push(courseId);
          } else {
            throw new Error('Course creation failed - no course ID returned');
          }
        } catch (error) {
          console.error('Error creating course:', error);
          setError(`Failed to create course: ${course.courseName}. ${error.response?.data?.message || error.message}`);
          setLoading(false);
          return;
        }
      }

      // Then register the college with the created courses
      const collegeData = {
        collegeName: formData.collegeName,
        collegeUniqueId: formData.collegeUniqueId,
        coursesOffered: createdCourses,
        programsOffered: formData.programsOffered,
        classroomOccupancy: 0,
        labOccupancy: 0
      };

      // Register the college using MALS API
      const collegeResponse = await malsAdminAPI.registerCollege(adminId, collegeData);

      if (collegeResponse.data) {
        // Update AuthContext with admin data if available
        const admin = JSON.parse(localStorage.getItem('malsAdmin') || '{}');
        if (admin && Object.keys(admin).length > 0) {
          const userData = {
            id: admin.id || admin._id,
            name: admin.username || admin.name,
            email: admin.email || `${admin.username}@admin.mals`,
            role: 'admin',
            ...admin
          };
          localStorage.setItem('user', JSON.stringify(userData));
          updateUser(userData);
        }
        
        setMessage({ type: 'success', text: 'Institute registered successfully! Redirecting to dashboard...' });
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        setError('Failed to register institute');
      }
    } catch (error) {
      console.error('Error registering institute:', error);
      setError(error.response?.data?.message || error.message || 'Failed to register institute');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Building2 className="h-12 w-12 text-primary-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Register Your Institute
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Complete your admin registration by setting up your institute
          </p>
        </div>

        <form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-lg" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {message && (
            <div className={`border rounded-lg p-4 flex items-center space-x-2 ${
              message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          {/* College Name */}
          <div>
            <label htmlFor="collegeName" className="block text-sm font-medium text-gray-700 mb-2">
              College Name *
            </label>
            <input
              id="collegeName"
              name="collegeName"
              type="text"
              required
              value={formData.collegeName}
              onChange={handleChange}
              className="input-field w-full"
              placeholder="Enter college name"
            />
          </div>

          {/* College Unique ID */}
          <div>
            <label htmlFor="collegeUniqueId" className="block text-sm font-medium text-gray-700 mb-2">
              College Unique ID *
            </label>
            <input
              id="collegeUniqueId"
              name="collegeUniqueId"
              type="text"
              required
              value={formData.collegeUniqueId}
              onChange={handleChange}
              className="input-field w-full"
              placeholder="Enter unique college ID"
            />
            <p className="mt-1 text-xs text-gray-500">
              This ID must be unique across all institutes
            </p>
          </div>

          {/* Programs Offered */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Programs Offered *
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={programInput}
                onChange={(e) => setProgramInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addProgram())}
                className="input-field flex-1"
                placeholder="Enter program name (e.g., Computer Science)"
              />
              <button
                type="button"
                onClick={addProgram}
                className="btn-secondary flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>Add</span>
              </button>
            </div>
            {formData.programsOffered.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.programsOffered.map((program, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                  >
                    {program}
                    <button
                      type="button"
                      onClick={() => removeProgram(program)}
                      className="ml-2 text-primary-600 hover:text-primary-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {formData.programsOffered.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">Add at least one program</p>
            )}
          </div>

          {/* Courses Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-primary-600" />
                  Courses Offered *
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 3 courses required. You can add more from the dashboard later.
                </p>
              </div>
              <button
                type="button"
                onClick={addCourse}
                className="btn-secondary flex items-center space-x-1 text-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Add Course</span>
              </button>
            </div>

            <div className="space-y-4">
              {formData.courses.map((course, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-900">Course {index + 1}</h4>
                    {formData.courses.length > 3 && (
                      <button
                        type="button"
                        onClick={() => removeCourse(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Course Name *
                      </label>
                      <input
                        type="text"
                        name="courseName"
                        value={course.courseName}
                        onChange={(e) => handleChange(e, index)}
                        className="input-field w-full"
                        placeholder="e.g., Data Structures"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Course Code *
                      </label>
                      <input
                        type="text"
                        name="courseCode"
                        value={course.courseCode}
                        onChange={(e) => handleChange(e, index)}
                        className="input-field w-full"
                        placeholder="e.g., CS301"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Credits *
                      </label>
                      <input
                        type="number"
                        name="credits"
                        value={course.credits}
                        onChange={(e) => handleChange(e, index)}
                        className="input-field w-full"
                        placeholder="e.g., 3"
                        min="1"
                        step="0.5"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Instructor (Optional)
                      </label>
                      <select
                        name="instructor"
                        value={course.instructor}
                        onChange={(e) => handleChange(e, index)}
                        className="input-field w-full"
                        disabled={loadingTeachers}
                      >
                        <option value="">
                          {loadingTeachers ? 'Loading instructors...' : 'Select instructor (optional)'}
                        </option>
                        {teachers.length > 0 ? (
                          teachers.map((teacher) => (
                            <option key={teacher.id} value={teacher.id}>
                              {teacher.name} - {teacher.department || 'No Department'} {teacher.experience ? `(${teacher.experience} yrs exp)` : ''}
                            </option>
                          ))
                        ) : !loadingTeachers && (
                          <option value="">No instructors available (optional)</option>
                        )}
                      </select>
                      {!loadingTeachers && teachers.length === 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          No instructors available. You can assign an instructor later from the dashboard.
                        </p>
                      )}
                      {!loadingTeachers && teachers.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Optionally select an instructor. Can be assigned later.
                        </p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Description *
                      </label>
                      <textarea
                        name="description"
                        value={course.description}
                        onChange={(e) => handleChange(e, index)}
                        className="input-field w-full"
                        rows="2"
                        placeholder="Course description (max 500 characters)"
                        maxLength={500}
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? 'Registering Institute...' : 'Register Institute'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="btn-secondary"
            >
              Back
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterInstitute;

