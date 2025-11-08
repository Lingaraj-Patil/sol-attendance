import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { courseAPI, attendanceAPI, timetableAPI } from '../services/api';
import { BookOpen, Users, CheckCircle, XCircle, ExternalLink, AlertCircle, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import TimetableDisplay from '../components/TimetableDisplay';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (user) {
      loadCourses();
    }
  }, [user]);

  const loadCourses = async () => {
    if (!user) return;
    
    try {
      const userId = user.id || user._id;
      const response = await courseAPI.getAll({ teacherId: userId });
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

  const [remarks, setRemarks] = useState({});
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState({});
  const [timetable, setTimetable] = useState(null);
  const [showTimetableView, setShowTimetableView] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [todaySchedule, setTodaySchedule] = useState([]);

  // Load today's attendance for the selected course
  useEffect(() => {
    if (selectedCourse) {
      loadTodayAttendance();
    }
  }, [selectedCourse]);

  // Load timetable
  useEffect(() => {
    if (user) {
      loadTimetable();
    }
  }, [user]);

  const loadTimetable = async () => {
    if (!user) return;
    
    try {
      const userId = user.id || user._id;
      const response = await timetableAPI.getByUser(userId);
      if (response.data.success) {
        setTimetable(response.data.data.timetable);
      }
    } catch (error) {
      console.error('Load timetable error:', error);
    }
  };

  // Load today's schedule from timetable
  useEffect(() => {
    if (timetable && timetable.userTimetable && selectedDate) {
      const date = new Date(selectedDate);
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
      
      const schedule = Object.entries(timetable.userTimetable)
        .filter(([slot]) => slot.startsWith(dayName))
        .map(([slot, details]) => ({
          slot,
          ...details,
          time: slot.split('_')[1] || ''
        }))
        .sort((a, b) => a.time.localeCompare(b.time));

      setTodaySchedule(schedule);
    }
  }, [timetable, selectedDate]);

  const loadTodayAttendance = async () => {
    if (!selectedCourse) return;
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const response = await attendanceAPI.getAll({
        courseId: selectedCourse._id,
        startDate: today.toISOString(),
        endDate: tomorrow.toISOString()
      });

      const attendanceMap = {};
      response.data.data.attendance.forEach((record) => {
        attendanceMap[record.student._id] = {
          status: record.status,
          date: record.date,
          remarks: record.remarks
        };
      });
      setTodayAttendance(attendanceMap);
    } catch (error) {
      console.error('Load today attendance error:', error);
    }
  };

  const markAttendance = async (studentId, status, studentRemarks = '') => {
    if (!selectedCourse) return;
    
    setMarking(true);
    setMessage(null);

    try {
      const response = await attendanceAPI.mark({
        studentId,
        courseId: selectedCourse._id,
        status,
        remarks: studentRemarks
      });

      const attendance = response.data.data.attendance;
      
      setMessage({
        type: 'success',
        text: status === 'present' 
          ? `✅ Attendance marked! ${attendance.tokensAwarded || 0} reward tokens transferred.`
          : '📝 Marked as absent.',
        explorerUrl: attendance.explorerUrl
      });

      // Clear remarks for this student
      setRemarks({ ...remarks, [studentId]: '' });
      setSelectedStudent(null);

      // Reload course data and today's attendance
      await loadCourses();
      await loadTodayAttendance();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to mark attendance'
      });
    } finally {
      setMarking(false);
    }
  };

  const handleQuickMark = (studentId, status) => {
    markAttendance(studentId, status, remarks[studentId] || '');
  };

  if (loading || !user) {
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
            <p className="mt-2 text-gray-600">Mark attendance for your courses</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Today's Date</p>
              <p className="text-lg font-semibold text-gray-900">
                {format(new Date(), 'PPP')}
              </p>
            </div>
            {timetable && timetable.userTimetable && (
              <button
                onClick={() => setShowTimetableView(!showTimetableView)}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                  showTimetableView
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Clock className="h-5 w-5" />
                <span>{showTimetableView ? 'Hide Timetable View' : 'Show Timetable View'}</span>
              </button>
            )}
          </div>
        </div>
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

      {/* Timetable-based Attendance View */}
      {showTimetableView && timetable && timetable.userTimetable ? (
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
              <Calendar className="h-6 w-6 mr-2 text-primary-600" />
              Attendance from Timetable
            </h2>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-field"
            />
          </div>

          {todaySchedule.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No classes scheduled for this date</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todaySchedule.map((classItem, idx) => {
                // Find course by code
                const course = courses.find(c => 
                  c.code === classItem.course_code || 
                  c.code === classItem.course ||
                  c.name === classItem.course
                );

                return (
                  <div
                    key={idx}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Clock className="h-5 w-5 text-primary-600" />
                        <div>
                          <p className="font-semibold text-gray-900">
                            {classItem.slot} - {classItem.course || classItem.course_code || 'Course'}
                          </p>
                          {classItem.room && (
                            <p className="text-sm text-gray-600 flex items-center mt-1">
                              <MapPin className="h-4 w-4 mr-1" />
                              {classItem.room}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Student list for marking attendance */}
                    {course && course.students && course.students.length > 0 ? (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm font-medium text-gray-700 mb-3">
                          Students ({course.students.length})
                        </p>
                        <div className="space-y-2">
                          {course.students.map((student) => {
                            const studentId = student._id || student;
                            const todayRecord = todayAttendance[studentId];
                            const isMarked = !!todayRecord;
                            const isPresent = todayRecord?.status === 'present';

                            return (
                              <div
                                key={studentId}
                                className={`p-3 rounded-lg border-2 flex items-center justify-between ${
                                  isMarked
                                    ? isPresent
                                      ? 'bg-green-50 border-green-300'
                                      : 'bg-red-50 border-red-300'
                                    : 'bg-white border-gray-200'
                                }`}
                              >
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">
                                    {student.name || student.email}
                                  </p>
                                  {isMarked && (
                                    <p className="text-xs text-gray-600 mt-1">
                                      {isPresent ? '✓ Marked Present' : '✗ Marked Absent'}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => {
                                      setSelectedCourse(course);
                                      markAttendance(studentId, 'present', remarks[studentId] || '');
                                    }}
                                    disabled={marking || isMarked}
                                    className={`px-3 py-1 rounded text-sm ${
                                      isMarked && isPresent
                                        ? 'bg-green-300 text-white cursor-not-allowed'
                                        : 'bg-green-500 text-white hover:bg-green-600 disabled:opacity-50'
                                    }`}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedCourse(course);
                                      markAttendance(studentId, 'absent', remarks[studentId] || '');
                                    }}
                                    disabled={marking || isMarked}
                                    className={`px-3 py-1 rounded text-sm ${
                                      isMarked && !isPresent
                                        ? 'bg-red-300 text-white cursor-not-allowed'
                                        : 'bg-red-500 text-white hover:bg-red-600 disabled:opacity-50'
                                    }`}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mt-4">
                        No students enrolled in this course
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
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
                    Reward Tokens: <span className="font-semibold">
                      {selectedCourse.tokensPerAttendance * (selectedCourse.priority || 1)}
                    </span>
                  </span>
                </div>
              </div>

              {selectedCourse.students && selectedCourse.students.length > 0 ? (
                <div className="space-y-3">
                  {selectedCourse.students.map((student) => {
                    const todayRecord = todayAttendance[student._id];
                    const isMarked = !!todayRecord;
                    const isPresent = todayRecord?.status === 'present';
                    
                    return (
                      <div
                        key={student._id}
                        className={`p-4 rounded-lg border-2 ${
                          isMarked
                            ? isPresent
                              ? 'bg-green-50 border-green-300'
                              : 'bg-red-50 border-red-300'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-medium text-gray-900">{student.name}</h3>
                              {isMarked && (
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  isPresent
                                    ? 'bg-green-200 text-green-800'
                                    : 'bg-red-200 text-red-800'
                                }`}>
                                  {isPresent ? '✓ Marked Present' : '✗ Marked Absent'}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{student.email}</p>
                            {student.walletAddress && (
                              <p className="text-xs text-gray-500 mt-1 font-mono truncate max-w-md">
                                {student.walletAddress}
                              </p>
                            )}
                            {todayRecord?.remarks && (
                              <p className="text-xs text-gray-600 mt-1 italic">
                                Remarks: {todayRecord.remarks}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleQuickMark(student._id, 'present')}
                              disabled={marking || isMarked}
                              className={`flex items-center space-x-1 px-4 py-2 rounded-lg transition-colors ${
                                isMarked && isPresent
                                  ? 'bg-green-300 text-white cursor-not-allowed'
                                  : 'bg-green-500 text-white hover:bg-green-600 disabled:opacity-50'
                              }`}
                            >
                              <CheckCircle className="h-5 w-5" />
                              <span>{isMarked && isPresent ? 'Already Present' : 'Present'}</span>
                            </button>
                            <button
                              onClick={() => handleQuickMark(student._id, 'absent')}
                              disabled={marking || isMarked}
                              className={`flex items-center space-x-1 px-4 py-2 rounded-lg transition-colors ${
                                isMarked && !isPresent
                                  ? 'bg-red-300 text-white cursor-not-allowed'
                                  : 'bg-red-500 text-white hover:bg-red-600 disabled:opacity-50'
                              }`}
                            >
                              <XCircle className="h-5 w-5" />
                              <span>{isMarked && !isPresent ? 'Already Absent' : 'Absent'}</span>
                            </button>
                          </div>
                        </div>
                      
                      {/* Remarks Section */}
                      {!isMarked && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <textarea
                            placeholder="Add remarks (optional)..."
                            value={remarks[student._id] || ''}
                            onChange={(e) => setRemarks({ ...remarks, [student._id]: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            rows="2"
                          />
                        </div>
                      )}
                    </div>
                  );
                  })}
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
      )}

      {/* Timetable Section */}
      <div className="mt-8">
        <TimetableDisplay userId={user.id || user._id} userRole="teacher" />
      </div>
    </div>
  );
};

export default TeacherDashboard;