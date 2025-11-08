import { useState } from 'react';
import { malsStudentAPI } from '../services/api';
import { MessageSquare, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const StudentFeedbackForm = ({ studentId, onSuccess }) => {
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!feedback.trim()) {
      setMessage({
        type: 'error',
        text: 'Please enter your feedback'
      });
      return;
    }

    if (feedback.length > 100) {
      setMessage({
        type: 'error',
        text: 'Feedback cannot exceed 100 characters'
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await malsStudentAPI.submitFeedback(studentId, { feedback });
      setMessage({
        type: 'success',
        text: 'Feedback submitted successfully!'
      });
      setFeedback('');
      if (onSuccess) {
        onSuccess();
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
      <div className="flex items-center mb-4">
        <MessageSquare className="h-6 w-6 text-primary-600 mr-2" />
        <h2 className="text-2xl font-semibold text-gray-900">Submit Feedback</h2>
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
        <div>
          <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
            Your Feedback (max 100 characters)
          </label>
          <textarea
            id="feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="input-field"
            rows="4"
            maxLength={100}
            placeholder="Enter your feedback here..."
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            {feedback.length}/100 characters
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !feedback.trim()}
          className="btn-primary flex items-center space-x-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <MessageSquare className="h-4 w-4" />
              <span>Submit Feedback</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default StudentFeedbackForm;

