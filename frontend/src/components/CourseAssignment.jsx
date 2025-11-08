import { useState, useEffect } from 'react';
import { courseAPI, tokenAPI } from '../services/api';
import { UserPlus, Users, BookOpen, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const CourseAssignment = ({ onSuccess }) => {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [coursesRes, studentsRes] = await Promise.all([
        courseAPI.getAll(),
        tokenAPI.getStudents().catch(() => ({ data: { data: { students: [] } } }))
      ]);
      setCourses(coursesRes.data.data.courses);
      // Try to get all students from MALS API if available, fallback to token students
      try {
        const { malsStudentAPI } = await import('../services/api');
        const allStudentsRes = await malsStudentAPI.getAll();
        if (allStudentsRes.data.data.students && allStudentsRes.data.data.students.length > 0) {
          setStudents(allStudentsRes.data.data.students);
        } else {
          setStudents(studentsRes.data.data.students || []);
        }
      } catch (malsError) {
        // Fallback to token students (students with wallets)
        setStudents(studentsRes.data.data.students || []);
      }
    } catch (error) {
      console.error('Load data error:', error);
    }
  };

  const handleAssign = async () => {
    if (!selectedCourse || selectedStudents.length === 0) {
      setMessage({
        type: 'error',
        text: 'Please select a course and at least one student'
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Assign each student to the course
      const assignments = await Promise.all(
        selectedStudents.map(studentId =>
          courseAPI.enroll({
            courseId: selectedCourse,
            studentId
          })
        )
      );

      setMessage({
        type: 'success',
        text: `Successfully assigned ${selectedStudents.length} student(s) to the course`
      });

      setSelectedCourse('');
      setSelectedStudents([]);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to assign students'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center mb-6">
        <UserPlus className="h-6 w-6 text-primary-600 mr-2" />
        <h2 className="text-2xl font-semibold text-gray-900">Assign Students to Courses</h2>
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
          <span>{message.text}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Course Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Course
          </label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="input-field"
          >
            <option value="">Choose a course...</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.code} - {course.name}
              </option>
            ))}
          </select>
        </div>

        {/* Student Selection */}
        {selectedCourse && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Students ({selectedStudents.length} selected)
            </label>
            <div className="border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
              {students.length > 0 ? (
                <div className="space-y-2">
                  {students.map((student) => {
                    const isSelected = selectedStudents.includes(student._id);
                    const selectedCourseData = courses.find(c => c._id === selectedCourse);
                    const isEnrolled = selectedCourseData?.students?.some(
                      s => (s._id && s._id.toString() === student._id) || 
                           (typeof s === 'string' && s === student._id) ||
                           (s && s.toString() === student._id)
                    );

                    return (
                      <label
                        key={student._id}
                        className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-primary-50 border-2 border-primary-500'
                            : isEnrolled
                            ? 'bg-gray-100 border-2 border-gray-300 cursor-not-allowed'
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => !isEnrolled && toggleStudent(student._id)}
                          disabled={isEnrolled}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{student.name}</p>
                          <p className="text-sm text-gray-600">{student.email}</p>
                        </div>
                        {isEnrolled && (
                          <span className="text-xs text-gray-500">Already enrolled</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No students available</p>
              )}
            </div>
          </div>
        )}

        {/* Assign Button */}
        <button
          onClick={handleAssign}
          disabled={loading || !selectedCourse || selectedStudents.length === 0}
          className="btn-primary w-full flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Assigning...</span>
            </>
          ) : (
            <>
              <UserPlus className="h-5 w-5" />
              <span>Assign Students</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CourseAssignment;

