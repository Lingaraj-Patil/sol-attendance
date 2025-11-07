import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { courseAPI, attendanceAPI } from '../services/api';
import { BookOpen, Users, CheckCircle, XCircle, ExternalLink, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadCourses();
  }, [user]);

  const loadCourses = async () => {
    try {
      const response = await courseAPI.getAll({ teacherId: user.id });
      setCourses(response.data.data.courses);
      
      if (response.data.data.courses.length > 0) {
        setSelectedCourse(response.data.data.courses[0]);
      }
    } catch (error) {
      console.error('Load courses error:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (studentId, status) => {
    if (!selectedCourse) return;
    
    setMarking(true);
    setMessage(null);

    try {
      const response = await attendanceAPI.mark({
        studentId,
        courseId: selectedCourse._id,
        status
      });

      const attendance = response.data.data.attendance;
      
      setMessage({
        type: 'success',
        text: status === 'present' 
          ? `✅ Attendance marked! ${attendance.tokensAwarded} tokens transferred.`
          : '📝 Marked as absent.',
        explorerUrl: attendance.explorerUrl
      });

      // Reload course data
      await loadCourses();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to mark attendance'
      });
    } finally {
      setMarking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Courses Assigned</h2>
          <p className="text-gray-600">You don't have any courses assigned yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
        <p className="mt-2 text-gray-600">Mark attendance for your courses</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-start space-x-2">
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {message.text}
              </p>
              {message.explorerUrl && (
                <a
                  href={message.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center mt-2 text-sm text-primary-600 hover:text-primary-700"
                >
                  View on Solana Explorer
                  <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Course Selection */}
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Courses</h2>
            <div className="space-y-2">
              {courses.map((course) => (
                <button
                  key={course._id}
                  onClick={() => setSelectedCourse(course)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedCourse?._id === course._id
                      ? 'bg-primary-50 border-2 border-primary-500'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <p className="font-medium text-gray-900">{course.name}</p>
                  <p className="text-sm text-gray-600">{course.code}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {course.students?.length || 0} students
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Student List */}
        <div className="lg:col-span-3">
          {selectedCourse && (
            <div className="card">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{selectedCourse.name}</h2>
                <p className="text-gray-600">{selectedCourse.code}</p>
                <div className="mt-2 flex items-center space-x-4 text-sm">
                  <span className="text-gray-600">
                    Priority: <span className="font-semibold">{selectedCourse.priority}</span>
                  </span>
                  <span className="text-gray-600">
                    Tokens: <span className="font-semibold">
                      {selectedCourse.tokensPerAttendance * selectedCourse.priority}
                    </span>
                  </span>
                </div>
              </div>

              {selectedCourse.students && selectedCourse.students.length > 0 ? (
                <div className="space-y-3">
                  {selectedCourse.students.map((student) => (
                    <div
                      key={student._id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{student.name}</h3>
                        <p className="text-sm text-gray-600">{student.email}</p>
                        <p className="text-xs text-gray-500 mt-1 font-mono truncate max-w-md">
                          {student.walletAddress}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => markAttendance(student._id, 'present')}
                          disabled={marking}
                          className="flex items-center space-x-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle className="h-5 w-5" />
                          <span>Present</span>
                        </button>
                        <button
                          onClick={() => markAttendance(student._id, 'absent')}
                          disabled={marking}
                          className="flex items-center space-x-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="h-5 w-5" />
                          <span>Absent</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No students enrolled yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;