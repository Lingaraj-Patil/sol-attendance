import { useState } from 'react';
import { malsStudentAPI } from '../services/api';
import { BookOpen, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const CourseSelectionForm = ({ studentId, onSuccess }) => {
  const [formData, setFormData] = useState({
    major1: '',
    major2: '',
    minor1: '',
    minor2: '',
    lab1: '',
    lab2: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
    setMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const requiredFields = ['major1', 'major2', 'minor1', 'minor2', 'lab1', 'lab2'];
    const missingFields = requiredFields.filter(field => !formData[field].trim());
    
    if (missingFields.length > 0) {
      setMessage({
        type: 'error',
        text: 'Please fill in all course selections'
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await malsStudentAPI.selectCourses(studentId, formData);
      setMessage({
        type: 'success',
        text: 'Courses selected successfully!'
      });
      setFormData({
        major1: '',
        major2: '',
        minor1: '',
        minor2: '',
        lab1: '',
        lab2: ''
      });
      if (onSuccess) {
        onSuccess();
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
      <div className="flex items-center mb-4">
        <BookOpen className="h-6 w-6 text-primary-600 mr-2" />
        <h2 className="text-2xl font-semibold text-gray-900">Select Courses</h2>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg flex items-center space-x-2 ${
          message.type === 'success'
            ? 'bg-green-50 text-green-800'
            : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="major1" className="block text-sm font-medium text-gray-700 mb-1">
              Major 1 *
            </label>
            <input
              id="major1"
              type="text"
              value={formData.major1}
              onChange={handleChange('major1')}
              className="input-field"
              placeholder="e.g., CS101"
              required
            />
          </div>

          <div>
            <label htmlFor="major2" className="block text-sm font-medium text-gray-700 mb-1">
              Major 2 *
            </label>
            <input
              id="major2"
              type="text"
              value={formData.major2}
              onChange={handleChange('major2')}
              className="input-field"
              placeholder="e.g., CS102"
              required
            />
          </div>

          <div>
            <label htmlFor="minor1" className="block text-sm font-medium text-gray-700 mb-1">
              Minor 1 *
            </label>
            <input
              id="minor1"
              type="text"
              value={formData.minor1}
              onChange={handleChange('minor1')}
              className="input-field"
              placeholder="e.g., MATH101"
              required
            />
          </div>

          <div>
            <label htmlFor="minor2" className="block text-sm font-medium text-gray-700 mb-1">
              Minor 2 *
            </label>
            <input
              id="minor2"
              type="text"
              value={formData.minor2}
              onChange={handleChange('minor2')}
              className="input-field"
              placeholder="e.g., MATH102"
              required
            />
          </div>

          <div>
            <label htmlFor="lab1" className="block text-sm font-medium text-gray-700 mb-1">
              Lab 1 *
            </label>
            <input
              id="lab1"
              type="text"
              value={formData.lab1}
              onChange={handleChange('lab1')}
              className="input-field"
              placeholder="e.g., LAB101"
              required
            />
          </div>

          <div>
            <label htmlFor="lab2" className="block text-sm font-medium text-gray-700 mb-1">
              Lab 2 *
            </label>
            <input
              id="lab2"
              type="text"
              value={formData.lab2}
              onChange={handleChange('lab2')}
              className="input-field"
              placeholder="e.g., LAB102"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex items-center space-x-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <BookOpen className="h-4 w-4" />
              <span>Submit Course Selection</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default CourseSelectionForm;

