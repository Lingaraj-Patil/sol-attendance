import { useState, useEffect } from 'react';
import { tokenAPI, courseAPI, marketplaceAPI } from '../services/api';
import { Coins, BookOpen, Plus, CheckCircle, AlertCircle, History, ExternalLink, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';
import TokenTransferForm from '../components/TokenTransferForm';

const AdminDashboard = () => {
  const [tokens, setTokens] = useState([]);
  const [courses, setCourses] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTokenForm, setShowTokenForm] = useState(false);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [message, setMessage] = useState(null);

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
      const [tokensRes, coursesRes, transactionsRes, productsRes] = await Promise.all([
        tokenAPI.getAll(),
        courseAPI.getAll(),
        tokenAPI.getTransactions({ limit: 50 }),
        marketplaceAPI.getAll()
      ]);
      
      setTokens(tokensRes.data.data.tokens);
      setCourses(coursesRes.data.data.courses);
      setTransactions(transactionsRes.data.data.transactions || []);
      setProducts(productsRes.data.data.products || []);
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
            Attendance Tokens
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
                placeholder="Token Name"
                value={tokenForm.name}
                onChange={(e) => setTokenForm({ ...tokenForm, name: e.target.value })}
                className="input-field"
                required
              />
              <input
                type="text"
                placeholder="Symbol (e.g., ATTND)"
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

        {tokens.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tokens.map((token) => (
              <div key={token._id} className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900">{token.name}</h3>
                <p className="text-sm text-gray-600">Symbol: {token.symbol}</p>
                <p className="text-sm text-gray-600">Total Supply: {token.totalSupply}</p>
                <p className="text-xs text-gray-500 mt-2 font-mono truncate">
                  {token.mintAddress}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No tokens created yet</p>
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
              <input
                type="text"
                placeholder="Teacher ID"
                value={courseForm.teacherId}
                onChange={(e) => setCourseForm({ ...courseForm, teacherId: e.target.value })}
                className="input-field"
                required
              />
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
                placeholder="Tokens Per Attendance"
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
                <h3 className="text-lg font-semibold text-gray-900">{course.name}</h3>
                <p className="text-sm text-gray-600">Code: {course.code}</p>
                <p className="text-sm text-gray-600">Priority: {course.priority}</p>
                <p className="text-sm text-gray-600">
                  Teacher: {course.teacher?.name || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  Students: {course.students?.length || 0}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No courses created yet</p>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;