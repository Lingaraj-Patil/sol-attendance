import { useEffect, useState } from 'react';
import { tokenAPI } from '../services/api';
import { Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const initialFormState = {
  tokenId: '',
  studentId: '',
  amount: ''
};

const TokenTransferForm = ({ tokens = [], onTransferSuccess }) => {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [fetchingStudents, setFetchingStudents] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const loadStudents = async () => {
      setFetchingStudents(true);
      try {
        const response = await tokenAPI.getStudents();
        setStudents(response.data.data.students || []);
      } catch (error) {
        console.error('Load students error:', error);
        setMessage({
          type: 'error',
          text: error.response?.data?.message || 'Unable to load students'
        });
      } finally {
        setFetchingStudents(false);
      }
    };

    loadStudents();
  }, []);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.tokenId || !form.studentId || !form.amount) {
      setMessage({
        type: 'error',
        text: 'Please select a token, student and amount'
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await tokenAPI.transfer({
        tokenId: form.tokenId,
        studentId: form.studentId,
        amount: Number(form.amount)
      });

      setMessage({
        type: 'success',
        text: 'Tokens sent successfully'
      });
      setForm(initialFormState);

      if (onTransferSuccess) {
        onTransferSuccess();
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to send tokens'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = () => {
    if (!message) return null;

    return (
      <div
        className={`mb-4 p-4 rounded-lg flex items-center space-x-2 ${
          message.type === 'success'
            ? 'bg-green-50 text-green-800'
            : 'bg-red-50 text-red-800'
        }`}
      >
        {message.type === 'success' ? (
          <CheckCircle className="h-5 w-5" />
        ) : (
          <AlertCircle className="h-5 w-5" />
        )}
        <span>{message.text}</span>
      </div>
    );
  };

  return (
    <div className="card">
      <div className="flex items-center mb-4">
        <Send className="h-6 w-6 text-primary-600 mr-2" />
        <h2 className="text-2xl font-semibold text-gray-900">Send Reward Tokens</h2>
      </div>

      {renderMessage()}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Token
            </label>
            <select
              value={form.tokenId}
              onChange={handleChange('tokenId')}
              className="input-field"
              disabled={!tokens.length}
            >
              <option value="">Select token</option>
              {tokens.map((token) => (
                <option key={token._id} value={token._id}>
                  {token.name} ({token.symbol})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Student
            </label>
            <select
              value={form.studentId}
              onChange={handleChange('studentId')}
              className="input-field"
              disabled={fetchingStudents || !students.length}
            >
              <option value="">
                {fetchingStudents ? 'Loading students...' : 'Select student'}
              </option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.name} - {student.walletAddress.slice(0, 4)}...
                  {student.walletAddress.slice(-4)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={handleChange('amount')}
              placeholder="Enter amount"
              className="input-field"
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button type="submit" className="btn-primary flex items-center space-x-2" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Send Tokens</span>
              </>
            )}
          </button>
          <p className="text-sm text-gray-500">
            Tokens will be sent directly to the student wallet via Solana.
          </p>
        </div>
      </form>
    </div>
  );
};

export default TokenTransferForm;

