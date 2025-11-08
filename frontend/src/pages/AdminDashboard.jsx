import { useState, useEffect } from 'react';
import { tokenAPI, courseAPI, marketplaceAPI, timetableAPI } from '../services/api';
import { Coins, BookOpen, Plus, CheckCircle, AlertCircle, History, ExternalLink, ShoppingCart, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import TokenTransferForm from '../components/TokenTransferForm';
import TimetableGenerator from '../components/TimetableGenerator';
import CourseAssignment from '../components/CourseAssignment';
import { malsTeacherAPI } from '../services/api';

const AdminDashboard = () => {
  const [tokens, setTokens] = useState([]);
  const [courses, setCourses] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTokenForm, setShowTokenForm] = useState(false);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showTimetableForm, setShowTimetableForm] = useState(false);
  const [message, setMessage] = useState(null);
  const [showTeacherAssignModal, setShowTeacherAssignModal] = useState(false);
  const [selectedCourseForAssignment, setSelectedCourseForAssignment] = useState(null);

  const [tokenForm, setTokenForm] = useState({
    name: '',
    symbol: '',
    decimals: 0
  });

  const [courseForm, setCourseForm] = useState({
    name: '',
    code: '',
    description: '',
    priority: 1,
    tokensPerAttendance: 10,
    teacherId: ''
  });

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category: 'other',
    price: 0,
    tokenPrice: 0,
    imageUrl: '',
    courseId: '',
    stock: -1
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tokensRes, coursesRes, transactionsRes, productsRes, timetablesRes, teachersRes] = await Promise.all([
        tokenAPI.getAll(),
        courseAPI.getAll(),
        tokenAPI.getTransactions({ limit: 50 }),
        marketplaceAPI.getAll(),
        timetableAPI.getAll().catch(() => ({ data: { data: { timetables: [] } } })),
        malsTeacherAPI.getAll().catch(() => ({ data: { data: { teachers: [] } } }))
      ]);
      
      setTokens(tokensRes.data.data.tokens);
      setCourses(coursesRes.data.data.courses);
      setTransactions(transactionsRes.data.data.transactions || []);
      setProducts(productsRes.data.data.products || []);
      setTimetables(timetablesRes.data.data.timetables || []);
      setTeachers(teachersRes.data?.data?.teachers || teachersRes.data?.teachers || []);
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateToken = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await tokenAPI.create(tokenForm);
      setMessage({ type: 'success', text: 'Token created successfully!' });
      setShowTokenForm(false);
      setTokenForm({ name: '', symbol: '', decimals: 0 });
      await loadData();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to create token' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await courseAPI.create(courseForm);
      setMessage({ type: 'success', text: 'Course created successfully!' });
      setShowCourseForm(false);
      setCourseForm({
        name: '',
        code: '',
        description: '',
        priority: 1,
        tokensPerAttendance: 10,
        teacherId: ''
      });
      await loadData();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to create course' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await marketplaceAPI.create(productForm);
      setMessage({ type: 'success', text: 'Product created successfully!' });
      setShowProductForm(false);
      setProductForm({
        name: '',
        description: '',
        category: 'other',
        price: 0,
        tokenPrice: 0,
        imageUrl: '',
        courseId: '',
        stock: -1
      });
      await loadData();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to create product' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTeacher = (courseId) => {
    const course = courses.find(c => c._id === courseId);
    setSelectedCourseForAssignment(course);
    setShowTeacherAssignModal(true);
  };

  const handleConfirmTeacherAssignment = async (teacherId) => {
    if (!selectedCourseForAssignment || !teacherId) {
      setMessage({ type: 'error', text: 'Please select a teacher' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await courseAPI.assignTeacher(selectedCourseForAssignment._id, teacherId);
      setMessage({ 
        type: 'success', 
        text: 'Teacher assigned to course successfully!' 
      });
      setShowTeacherAssignModal(false);
      setSelectedCourseForAssignment(null);
      await loadData();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to assign teacher' 
      });
    } finally {
      setLoading(false);
    }
  };


  if (loading && !tokens.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">Manage tokens and courses</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
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

      {/* Tokens Section */}
      <div className="card mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Coins className="h-6 w-6 mr-2 text-primary-600" />
            Reward Tokens
          </h2>
          <button
            onClick={() => setShowTokenForm(!showTokenForm)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Create Token</span>
          </button>
        </div>

        {showTokenForm && (
          <form onSubmit={handleCreateToken} className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Reward Token Name (e.g., Attendance Reward, Major1 Reward)"
                value={tokenForm.name}
                onChange={(e) => setTokenForm({ ...tokenForm, name: e.target.value })}
                className="input-field"
                required
              />
              <input
                type="text"
                placeholder="Symbol (e.g., ATTND, MAJ1, MAJ2)"
                value={tokenForm.symbol}
                onChange={(e) => setTokenForm({ ...tokenForm, symbol: e.target.value.toUpperCase() })}
                className="input-field"
                required
              />
              <input
                type="number"
                placeholder="Decimals"
                value={tokenForm.decimals}
                onChange={(e) => setTokenForm({ ...tokenForm, decimals: parseInt(e.target.value) })}
                className="input-field"
                min="0"
                max="9"
              />
            </div>
            <div className="mt-4 flex space-x-2">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Token'}
              </button>
              <button
                type="button"
                onClick={() => setShowTokenForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>💡 Tip:</strong> Create different reward tokens for different purposes (e.g., "Attendance Reward", "Major1 Reward", "Major2 Reward", "Major3 Reward")
          </p>
        </div>

        {tokens.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tokens.map((token) => (
              <div key={token._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{token.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    token.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {token.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">Symbol: <span className="font-semibold">{token.symbol}</span></p>
                <p className="text-sm text-gray-600">Total Supply: <span className="font-semibold">{token.totalSupply || 0}</span></p>
                <p className="text-xs text-gray-500 mt-2 font-mono truncate" title={token.mintAddress}>
                  {token.mintAddress}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No reward tokens created yet</p>
        )}
      </div>

      <div className="mb-8">
        <TokenTransferForm tokens={tokens} onTransferSuccess={loadData} />
      </div>

      {/* Transaction History */}
      <div className="card mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <History className="h-6 w-6 mr-2 text-primary-600" />
          Transaction History
        </h2>
        
        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Student</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Token</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Transaction</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {format(new Date(tx.createdAt), 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        tx.type === 'attendance'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {tx.type === 'attendance' ? 'Attendance' : 'Manual'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {tx.student?.name || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {tx.token?.symbol || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1 text-primary-600 font-semibold">
                        <Coins className="h-4 w-4" />
                        <span>{tx.amount}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {tx.explorerUrl ? (
                        <a
                          href={tx.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700"
                          title="View on Solana Explorer"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span className="text-xs font-mono truncate max-w-[100px]">
                            {tx.transactionSignature?.slice(0, 8)}...
                          </span>
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <History className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No transactions yet</p>
          </div>
        )}
      </div>

      {/* Products Section */}
      <div className="card mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <ShoppingCart className="h-6 w-6 mr-2 text-primary-600" />
            Marketplace Products
          </h2>
          <button
            onClick={() => setShowProductForm(!showProductForm)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add Product</span>
          </button>
        </div>

        {showProductForm && (
          <form onSubmit={handleCreateProduct} className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Product Name"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className="input-field"
                required
              />
              <select
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                className="input-field"
                required
              >
                <option value="course">Course</option>
                <option value="book">Book</option>
                <option value="software">Software</option>
                <option value="equipment">Equipment</option>
                <option value="subscription">Subscription</option>
                <option value="other">Other</option>
              </select>
              <input
                type="number"
                placeholder="Price ($)"
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) })}
                className="input-field"
                min="0"
                step="0.01"
                required
              />
              <input
                type="number"
                placeholder="Token Price"
                value={productForm.tokenPrice}
                onChange={(e) => setProductForm({ ...productForm, tokenPrice: parseInt(e.target.value) })}
                className="input-field"
                min="0"
                required
              />
              <input
                type="text"
                placeholder="Image URL (optional)"
                value={productForm.imageUrl}
                onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                className="input-field"
              />
              <input
                type="text"
                placeholder="Course ID (optional)"
                value={productForm.courseId}
                onChange={(e) => setProductForm({ ...productForm, courseId: e.target.value })}
                className="input-field"
              />
              <input
                type="number"
                placeholder="Stock (-1 for unlimited)"
                value={productForm.stock}
                onChange={(e) => setProductForm({ ...productForm, stock: parseInt(e.target.value) })}
                className="input-field"
                min="-1"
              />
              <textarea
                placeholder="Description"
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                className="input-field md:col-span-2"
                rows="3"
                required
              />
            </div>
            <div className="mt-4 flex space-x-2">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Product'}
              </button>
              <button
                type="button"
                onClick={() => setShowProductForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((product) => (
              <div key={product._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                  <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-medium capitalize">
                    {product.category}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Price: ${product.price}</span>
                  <div className="flex items-center space-x-1 text-primary-600">
                    <Coins className="h-4 w-4" />
                    <span className="font-semibold">{product.tokenPrice}</span>
                  </div>
                </div>
                {product.stock !== -1 && (
                  <p className="text-xs text-gray-500 mt-2">Stock: {product.stock}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No products created yet</p>
        )}
      </div>

      {/* Teachers Section */}
      <div className="card mb-8">
        <div className="flex items-center mb-6">
          <BookOpen className="h-6 w-6 text-primary-600 mr-2" />
          <h2 className="text-2xl font-semibold text-gray-900">Teachers</h2>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading teachers...</p>
          </div>
        ) : teachers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teachers.map((teacher) => (
              <div
                key={teacher._id || teacher.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {teacher.name || teacher.username || 'N/A'}
                    </h3>
                    <p className="text-sm text-gray-600">{teacher.email || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="space-y-2 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Experience:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {teacher.experience !== undefined ? `${teacher.experience} years` : 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Department:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {teacher.department || 'N/A'}
                    </span>
                  </div>
                  
                  {teacher.workingHour !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Working Hours:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {teacher.workingHour} hours
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No teachers found</p>
          </div>
        )}
      </div>

      {/* Timetables Section */}
      <div className="card mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calendar className="h-6 w-6 mr-2 text-primary-600" />
            Timetables
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                window.open(
                  'https://suparnnayak-time-table-streamlit-app-7lfo4g.streamlit.app/',
                  '_blank',
                  'noopener,noreferrer'
                );
              }}
              className="btn-primary flex items-center space-x-2"
            >
              <Calendar className="h-5 w-5" />
              <span>Auto-Generate from User Data</span>
            </button>
            <button
              onClick={() => setShowTimetableForm(!showTimetableForm)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Manual Generate</span>
            </button>
            <a
              href="https://suparnnayak-time-table-streamlit-app-7lfo4g.streamlit.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex items-center space-x-2"
            >
              <ExternalLink className="h-5 w-5" />
              <span>Open Streamlit Tool</span>
            </a>
          </div>
        </div>

        {showTimetableForm && (
          <div className="mb-6">
            <TimetableGenerator onSuccess={loadData} />
          </div>
        )}

        {timetables.length > 0 ? (
          <div className="space-y-4">
            {timetables.map((timetable) => (
              <div key={timetable._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{timetable.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    timetable.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {timetable.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {timetable.semester && (
                  <p className="text-sm text-gray-600">Semester: {timetable.semester}</p>
                )}
                {timetable.academicYear && (
                  <p className="text-sm text-gray-600">Academic Year: {timetable.academicYear}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Created: {format(new Date(timetable.createdAt), 'PPP')}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No timetables generated yet</p>
        )}
      </div>

      {/* Courses Section */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <BookOpen className="h-6 w-6 mr-2 text-primary-600" />
            Courses
          </h2>
          <button
            onClick={() => setShowCourseForm(!showCourseForm)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Create Course</span>
          </button>
        </div>

        {showCourseForm && (
          <form onSubmit={handleCreateCourse} className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Course Name"
                value={courseForm.name}
                onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                className="input-field"
                required
              />
              <input
                type="text"
                placeholder="Course Code"
                value={courseForm.code}
                onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value.toUpperCase() })}
                className="input-field"
                required
              />
              <select
                value={courseForm.teacherId}
                onChange={(e) => setCourseForm({ ...courseForm, teacherId: e.target.value })}
                className="input-field"
                required
              >
                <option value="">Select Teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher._id || teacher.id} value={teacher._id || teacher.id}>
                    {teacher.name || teacher.username} {teacher.email ? `(${teacher.email})` : ''}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Priority (1-5)"
                value={courseForm.priority}
                onChange={(e) => setCourseForm({ ...courseForm, priority: parseInt(e.target.value) })}
                className="input-field"
                min="1"
                max="5"
              />
              <input
                type="number"
                placeholder="Reward Tokens Per Attendance"
                value={courseForm.tokensPerAttendance}
                onChange={(e) => setCourseForm({ ...courseForm, tokensPerAttendance: parseInt(e.target.value) })}
                className="input-field"
                min="1"
              />
              <textarea
                placeholder="Description"
                value={courseForm.description}
                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                className="input-field md:col-span-2"
                rows="2"
              />
            </div>
            <div className="mt-4 flex space-x-2">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Course'}
              </button>
              <button
                type="button"
                onClick={() => setShowCourseForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course) => (
              <div key={course._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{course.name}</h3>
                    <p className="text-sm text-gray-600">Code: {course.code}</p>
                    <p className="text-sm text-gray-600">Priority: {course.priority}</p>
                    <p className="text-sm text-gray-600">
                      Teacher: {course.teacher?.name || course.instructor?.name || 'Not Assigned'}
                    </p>
                    {course.teacher?.email && (
                      <p className="text-xs text-gray-500">{course.teacher.email}</p>
                    )}
                    <p className="text-sm text-gray-600 mt-2">
                      Students: {course.students?.length || 0}
                    </p>
                    {course.students && course.students.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Enrolled Students:</p>
                        <div className="flex flex-wrap gap-1">
                          {course.students.slice(0, 3).map((student) => (
                            <span
                              key={student._id || student}
                              className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded"
                            >
                              {student.name || student.email || 'Student'}
                            </span>
                          ))}
                          {course.students.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{course.students.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex flex-col space-y-2">
                    <button
                      onClick={() => handleAssignTeacher(course._id)}
                      className="px-3 py-1 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      {course.teacher || course.instructor ? 'Reassign' : 'Assign'} Teacher
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No courses created yet</p>
        )}
      </div>

      {/* Student Course Assignment Section */}
      <div className="mt-8">
        <CourseAssignment onSuccess={loadData} />
      </div>

      {/* Teacher Assignment Modal */}
      {showTeacherAssignModal && selectedCourseForAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Assign Teacher to {selectedCourseForAssignment.name}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Select a teacher to mark attendance for students in this course.
            </p>
            
            {teachers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No teachers available. Please register teachers first.</p>
                <button
                  onClick={() => setShowTeacherAssignModal(false)}
                  className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                {teachers.map((teacher) => {
                  const teacherId = teacher._id || teacher.id;
                  const isCurrentlyAssigned = 
                    selectedCourseForAssignment?.teacher?._id === teacherId ||
                    selectedCourseForAssignment?.teacher === teacherId ||
                    selectedCourseForAssignment?.instructor?._id === teacherId ||
                    selectedCourseForAssignment?.instructor === teacherId;
                  
                  return (
                    <button
                      key={teacherId}
                      onClick={() => handleConfirmTeacherAssignment(teacherId)}
                      disabled={loading}
                      className={`w-full text-left p-3 border-2 rounded-lg transition-colors disabled:opacity-50 ${
                        isCurrentlyAssigned
                          ? 'bg-primary-50 border-primary-500'
                          : 'border-gray-200 hover:bg-gray-50 hover:border-primary-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {teacher.name || teacher.username}
                            {isCurrentlyAssigned && (
                              <span className="ml-2 text-xs bg-primary-600 text-white px-2 py-0.5 rounded">
                                Currently Assigned
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-600">{teacher.email}</p>
                          {teacher.department && (
                            <p className="text-xs text-gray-500">Department: {teacher.department}</p>
                          )}
                          {teacher.experience !== undefined && (
                            <p className="text-xs text-gray-500">Experience: {teacher.experience} years</p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowTeacherAssignModal(false);
                  setSelectedCourseForAssignment(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;