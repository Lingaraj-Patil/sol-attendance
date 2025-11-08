import { useState, useEffect } from 'react';
import { timetableAPI, attendanceAPI, courseAPI } from '../services/api';
import { Calendar, CheckCircle, XCircle, Clock, MapPin, Users, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const TimetableAttendance = ({ teacherId }) => {
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [message, setMessage] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [todaySchedule, setTodaySchedule] = useState([]);

  useEffect(() => {
    if (teacherId) {
      loadTimetable();
    }
  }, [teacherId]);

  useEffect(() => {
    if (timetable && selectedDate) {
      loadTodaySchedule();
    }
  }, [timetable, selectedDate]);

  const loadTimetable = async () => {
    try {
      setLoading(true);
      const response = await timetableAPI.getByUser(teacherId);
      if (response.data.success) {
        setTimetable(response.data.data.timetable);
      }
    } catch (error) {
      console.error('Load timetable error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTodaySchedule = () => {
    if (!timetable || !timetable.userTimetable) return;

    const date = new Date(selectedDate);
    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
    
    // Filter schedule for selected day
    const schedule = Object.entries(timetable.userTimetable)
      .filter(([slot]) => slot.startsWith(dayName))
      .map(([slot, details]) => ({
        slot,
        ...details,
        time: slot.split('_')[1] || ''
      }))
      .sort((a, b) => a.time.localeCompare(b.time));

    setTodaySchedule(schedule);
  };

  const markAttendance = async (studentId, courseCode, status) => {
    if (!timetable) return;

    setMarking(true);
    setMessage(null);

    try {
      // Find course by code
      const coursesRes = await courseAPI.getAll();
      const course = coursesRes.data.data.courses.find(c => c.code === courseCode);

      if (!course) {
        setMessage({
          type: 'error',
          text: 'Course not found'
        });
        return;
      }

      // Check if student is enrolled
      const isEnrolled = course.students?.some(
        s => (s._id && s._id.toString() === studentId) || 
             (typeof s === 'string' && s === studentId)
      );

      if (!isEnrolled) {
        setMessage({
          type: 'error',
          text: 'Student is not enrolled in this course'
        });
        return;
      }

      const response = await attendanceAPI.mark({
        studentId,
        courseId: course._id,
        status
      });

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: status === 'present' 
            ? `✅ Attendance marked! ${response.data.data.attendance.tokensAwarded || 0} reward tokens transferred.`
            : '📝 Marked as absent.',
          explorerUrl: response.data.data.attendance.explorerUrl
        });
      }
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
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!timetable || !timetable.userTimetable) {
    return (
      <div className="card">
        <div className="flex items-center space-x-2 text-gray-500">
          <AlertCircle className="h-5 w-5" />
          <p>No timetable available. Please generate a timetable first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Calendar className="h-6 w-6 text-primary-600" />
          <h2 className="text-2xl font-semibold text-gray-900">Mark Attendance from Timetable</h2>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="input-field"
        />
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <div className="flex-1">
            <p>{message.text}</p>
            {message.explorerUrl && (
              <a
                href={message.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline mt-1"
              >
                View on Solana Explorer
              </a>
            )}
          </div>
        </div>
      )}

      {todaySchedule.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No classes scheduled for this date</p>
        </div>
      ) : (
        <div className="space-y-4">
          {todaySchedule.map((classItem, idx) => (
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

              {/* Student list for this class */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Students in this class:
                </p>
                <div className="space-y-2">
                  {/* Note: In a real implementation, you'd fetch students enrolled in this course */}
                  <p className="text-sm text-gray-500 italic">
                    Select students from the course enrollment list to mark attendance
                  </p>
                  {/* This would be populated with actual students from the course */}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TimetableAttendance;

