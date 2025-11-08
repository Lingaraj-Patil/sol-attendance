import { useState } from 'react';
import { malsStudentAPI } from '../services/api';
import { MessageSquare, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const StudentFeedback = ({ studentId, currentFeedback, onSuccess }) => {
  const [feedback, setFeedback] = useState(currentFeedback || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) {
      setMessage({ type: 'error', text: 'Feedback cannot be empty' });
      return;
    }

    if (feedback.length > 100) {
      setMessage({ type: 'error', text: 'Feedback cannot exceed 100 characters' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await malsStudentAPI.submitFeedback(studentId, { feedback });
      if (response.data.message) {
        setMessage({ type: 'success', text: response.data.message });
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to submit feedback'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center mb-6">
        <MessageSquare className="h-6 w-6 text-primary-600 mr-2" />
        <h2 className="text-2xl font-semibold text-gray-900">Submit Feedback</h2>
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Feedback (max 100 characters)
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="input-field"
            rows="4"
            placeholder="Share your feedback or suggestions..."
            maxLength={100}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {feedback.length}/100 characters
          </p>
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
            'Submit Feedback'
          )}
        </button>
      </form>
    </div>
  );
};

export default StudentFeedback;

