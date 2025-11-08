import { useState, useEffect } from 'react';
import { malsStudentAPI, courseAPI } from '../services/api';
import { BookOpen, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const CourseSelection = ({ studentId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState({
    major1: '',
    major2: '',
    minor1: '',
    minor2: '',
    lab1: '',
    lab2: ''
  });
  const [message, setMessage] = useState(null);
  const [existingSelection, setExistingSelection] = useState(null);

  useEffect(() => {
    loadCourses();
    loadExistingSelection();
  }, [studentId]);

  const loadCourses = async () => {
    try {
      const response = await courseAPI.getAll();
      setCourses(response.data.data.courses || []);
    } catch (error) {
      console.error('Load courses error:', error);
    }
  };

  const loadExistingSelection = async () => {
    try {
      const response = await malsStudentAPI.getSelectedCourses(studentId);
      if (response.data.selectedCourses && response.data.selectedCourses.length > 0) {
        const latest = response.data.selectedCourses[response.data.selectedCourses.length - 1];
        setExistingSelection(latest);
        setSelectedCourses({
          major1: latest.major1 || '',
          major2: latest.major2 || '',
          minor1: latest.minor1 || '',
          minor2: latest.minor2 || '',
          lab1: latest.lab1 || '',
          lab2: latest.lab2 || ''
        });
      }
    } catch (error) {
      console.error('Load existing selection error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await malsStudentAPI.selectCourses(studentId, selectedCourses);
      if (response.data.message) {
        setMessage({ type: 'success', text: response.data.message });
        setExistingSelection(response.data.selectedCourse);
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to select courses'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center mb-6">
        <BookOpen className="h-6 w-6 text-primary-600 mr-2" />
        <h2 className="text-2xl font-semibold text-gray-900">Course Selection</h2>
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

      {existingSelection && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-900 mb-2">Current Selection:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            <div><span className="font-medium">Major 1:</span> {existingSelection.major1}</div>
            <div><span className="font-medium">Major 2:</span> {existingSelection.major2}</div>
            <div><span className="font-medium">Minor 1:</span> {existingSelection.minor1}</div>
            <div><span className="font-medium">Minor 2:</span> {existingSelection.minor2}</div>
            <div><span className="font-medium">Lab 1:</span> {existingSelection.lab1}</div>
            <div><span className="font-medium">Lab 2:</span> {existingSelection.lab2}</div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Major 1 *
            </label>
            <select
              value={selectedCourses.major1}
              onChange={(e) => setSelectedCourses({ ...selectedCourses, major1: e.target.value })}
              className="input-field"
              required
            >
              <option value="">Select Major 1</option>
              {courses.map(course => (
                <option key={course._id} value={course.code || course.courseCode}>
                  {course.code || course.courseCode} - {course.name || course.courseName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Major 2 *
            </label>
            <select
              value={selectedCourses.major2}
              onChange={(e) => setSelectedCourses({ ...selectedCourses, major2: e.target.value })}
              className="input-field"
              required
            >
              <option value="">Select Major 2</option>
              {courses.map(course => (
                <option key={course._id} value={course.code || course.courseCode}>
                  {course.code || course.courseCode} - {course.name || course.courseName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minor 1 *
            </label>
            <select
              value={selectedCourses.minor1}
              onChange={(e) => setSelectedCourses({ ...selectedCourses, minor1: e.target.value })}
              className="input-field"
              required
            >
              <option value="">Select Minor 1</option>
              {courses.map(course => (
                <option key={course._id} value={course.code || course.courseCode}>
                  {course.code || course.courseCode} - {course.name || course.courseName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minor 2 *
            </label>
            <select
              value={selectedCourses.minor2}
              onChange={(e) => setSelectedCourses({ ...selectedCourses, minor2: e.target.value })}
              className="input-field"
              required
            >
              <option value="">Select Minor 2</option>
              {courses.map(course => (
                <option key={course._id} value={course.code || course.courseCode}>
                  {course.code || course.courseCode} - {course.name || course.courseName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lab 1 *
            </label>
            <select
              value={selectedCourses.lab1}
              onChange={(e) => setSelectedCourses({ ...selectedCourses, lab1: e.target.value })}
              className="input-field"
              required
            >
              <option value="">Select Lab 1</option>
              {courses.map(course => (
                <option key={course._id} value={course.code || course.courseCode}>
                  {course.code || course.courseCode} - {course.name || course.courseName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lab 2 *
            </label>
            <select
              value={selectedCourses.lab2}
              onChange={(e) => setSelectedCourses({ ...selectedCourses, lab2: e.target.value })}
              className="input-field"
              required
            >
              <option value="">Select Lab 2</option>
              {courses.map(course => (
                <option key={course._id} value={course.code || course.courseCode}>
                  {course.code || course.courseCode} - {course.name || course.courseName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Submitting...
            </span>
          ) : (
            'Submit Course Selection'
          )}
        </button>
      </form>
    </div>
  );
};

export default CourseSelection;

