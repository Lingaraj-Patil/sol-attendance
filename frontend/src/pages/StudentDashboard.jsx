import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendanceAPI, courseAPI, tokenAPI, marketplaceAPI } from '../services/api';
import { 
  Coins, BookOpen, TrendingUp, Calendar, 
  Award, ExternalLink, BarChart3, History, ShoppingBag 
} from 'lucide-react';
import { format } from 'date-fns';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [courses, setCourses] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [statsRes, attendanceRes, coursesRes, transactionsRes, purchasesRes] = await Promise.all([
        attendanceAPI.getStats(user.id),
        attendanceAPI.getAll({ studentId: user.id }),
        courseAPI.getAll({ studentId: user.id }),
        tokenAPI.getTransactions({ limit: 20 }),
        marketplaceAPI.getHistory({ studentId: user.id })
      ]);

      setStats(statsRes.data.data);
      setAttendance(attendanceRes.data.data.attendance);
      setCourses(coursesRes.data.data.courses);
      setTransactions(transactionsRes.data.data.transactions || []);
      setPurchases(purchasesRes.data.data.purchases || []);
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
        <p className="mt-2 text-gray-600">Track your attendance and rewards</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm">Total Tokens</p>
              <p className="text-3xl font-bold mt-1">{stats?.student.tokenBalance || 0}</p>
            </div>
            <Coins className="h-12 w-12 text-primary-200" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Attendance Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats?.overall.attendancePercentage.toFixed(1)}%
              </p>
            </div>
            <TrendingUp className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Classes Attended</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats?.overall.presentClasses}
              </p>
            </div>
            <Calendar className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Enrolled Courses</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {courses.length}
              </p>
            </div>
            <BookOpen className="h-12 w-12 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Wallet Info */}
      <div className="card mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Award className="h-6 w-6 mr-2 text-primary-600" />
          Wallet Information
        </h2>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Your Solana Wallet</p>
          <p className="font-mono text-sm text-gray-900 break-all">
            {user.walletAddress}
          </p>
        </div>
      </div>

      {/* Course-wise Stats */}
      {stats?.courseWise && stats.courseWise.length > 0 && (
        <div className="card mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <BarChart3 className="h-6 w-6 mr-2 text-primary-600" />
            Course-wise Performance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.courseWise.map((course, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {course.courseName}
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Attendance:</span>
                    <span className="font-medium text-gray-900">
                      {course.present}/{course.total} ({course.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tokens Earned:</span>
                    <span className="font-medium text-primary-600">
                      {course.tokensEarned}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${course.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Purchase History */}
      {purchases.length > 0 && (
        <div className="card mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <ShoppingBag className="h-6 w-6 mr-2 text-primary-600" />
            My Purchases
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {purchases.map((purchase) => (
              <div
                key={purchase._id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-medium capitalize">
                    {purchase.product?.category || 'product'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(purchase.createdAt), 'MMM dd, yyyy')}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {purchase.product?.name || 'Product'}
                </h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {purchase.product?.description || ''}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-primary-600">
                    <Coins className="h-4 w-4" />
                    <span className="text-sm font-semibold">{purchase.tokenAmount}</span>
                  </div>
                  {purchase.product?.course && (
                    <span className="text-xs text-gray-500">
                      {purchase.product.course.name}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="card mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <History className="h-6 w-6 mr-2 text-primary-600" />
          Transaction History
        </h2>
        
        {transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx._id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      tx.type === 'attendance' ? 'bg-green-500' : 'bg-blue-500'
                    }`}></div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {tx.type === 'attendance' ? 'Attendance Reward' : 'Manual Transfer'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {tx.description || `${tx.token?.name || 'Token'}`}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(tx.createdAt), 'PPP p')}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1 text-primary-600">
                    <Coins className="h-5 w-5" />
                    <span className="font-semibold">+{tx.amount}</span>
                    <span className="text-sm text-gray-500">({tx.token?.symbol})</span>
                  </div>
                  
                  {tx.explorerUrl && (
                    <a
                      href={tx.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700 px-3 py-1 rounded-lg hover:bg-primary-50 transition-colors"
                      title="View on Solana Explorer"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>View</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <History className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No transactions yet</p>
          </div>
        )}
      </div>

      {/* Recent Attendance */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <Calendar className="h-6 w-6 mr-2 text-primary-600" />
          Recent Attendance
        </h2>
        
        {attendance.length > 0 ? (
          <div className="space-y-3">
            {attendance.slice(0, 10).map((record) => (
              <div
                key={record._id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      record.status === 'present' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {record.course?.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {format(new Date(record.date), 'PPP')}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {record.status === 'present' && record.tokensAwarded > 0 && (
                    <div className="flex items-center space-x-1 text-primary-600">
                      <Coins className="h-5 w-5" />
                      <span className="font-semibold">+{record.tokensAwarded}</span>
                    </div>
                  )}
                  
                  {record.explorerUrl && (
                    <a
                      href={record.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm text-primary-600 hover:text-primary-700"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    record.status === 'present'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {record.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No attendance records yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;