import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendanceAPI, courseAPI, tokenAPI, marketplaceAPI } from '../services/api';
import { 
  Coins, BookOpen, TrendingUp, Calendar, 
  Award, ExternalLink, BarChart3, History, ShoppingBag, X, User
} from 'lucide-react';
import { format } from 'date-fns';
import TimetableDisplay from '../components/TimetableDisplay';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [courses, setCourses] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCoursesModal, setShowCoursesModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      const userId = user.id || user._id;
      const [statsRes, attendanceRes, coursesRes, transactionsRes, purchasesRes] = await Promise.all([
        attendanceAPI.getStats(userId),
        attendanceAPI.getAll({ studentId: userId }),
        courseAPI.getAll({ studentId: userId }),
        tokenAPI.getTransactions({ limit: 20 }),
        marketplaceAPI.getHistory({ studentId: userId })
      ]);

      setStats(statsRes.data.data);
      setAttendance(attendanceRes.data.data.attendance);
      setCourses(coursesRes.data.data.courses || []);
      setTransactions(transactionsRes.data.data.transactions || []);
      setPurchases(purchasesRes.data.data.purchases || []);
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !user) {
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

        <div 
          className="card cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => {
            console.log('Enrolled Courses clicked, courses:', courses);
            setShowCoursesModal(true);
          }}
        >
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
            {user?.walletAddress || 'No wallet address'}
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
          Attendance Records
        </h2>
        
        {attendance.length > 0 ? (
          <div className="space-y-4">
            {attendance.slice(0, 20).map((record) => (
              <div
                key={record._id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`w-3 h-3 rounded-full ${
                        record.status === 'present' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {record.course?.name || 'Course'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {record.course?.code || ''} • {format(new Date(record.date), 'PPP p')}
                        </p>
                        {record.remarks && (
                          <p className="text-sm text-gray-500 mt-2 italic">
                            "{record.remarks}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      record.status === 'present'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {record.status === 'present' ? '✓ Present' : '✗ Absent'}
                    </span>
                    
                    {record.status === 'present' && record.tokensAwarded > 0 && (
                      <div className="flex items-center space-x-1 text-primary-600 bg-primary-50 px-3 py-1 rounded-lg">
                        <Coins className="h-4 w-4" />
                        <span className="font-semibold text-sm">+{record.tokensAwarded} tokens</span>
                      </div>
                    )}
                    
                    {record.explorerUrl && (
                      <a
                        href={record.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700 px-3 py-1 rounded-lg hover:bg-primary-50 transition-colors"
                        title="View on Solana Explorer"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>View TX</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No attendance records yet</p>
            <p className="text-sm text-gray-500 mt-2">Your attendance will appear here once marked by your teacher</p>
          </div>
        )}
      </div>

      {/* Enrolled Courses Modal */}
      {showCoursesModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
          onClick={() => setShowCoursesModal(false)}
        >
          <div 
            className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <BookOpen className="h-6 w-6 mr-2 text-purple-500" />
                Enrolled Courses
              </h2>
              <button
                onClick={() => setShowCoursesModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              {courses.length > 0 ? (
                <div className="space-y-4">
                  {courses.map((course) => (
                    <div
                      key={course._id}
                      className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {course.name}
                          </h3>
                          <p className="text-sm text-gray-500 font-mono mb-2">
                            {course.code}
                          </p>
                          {course.description && (
                            <p className="text-sm text-gray-600 mb-3">
                              {course.description}
                            </p>
                          )}
                        </div>
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          Priority {course.priority}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 pt-3 border-t border-gray-100">
                        <User className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Instructor</p>
                          <p className="text-sm font-medium text-gray-900">
                            {course.teacher?.name || 'N/A'}
                          </p>
                          {course.teacher?.email && (
                            <p className="text-xs text-gray-500">
                              {course.teacher.email}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4">
                          <div>
                            <span className="text-gray-500">Reward Tokens per Attendance: </span>
                            <span className="font-semibold text-primary-600">
                              {course.tokensPerAttendance}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          {course.students?.length || 0} students enrolled
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No enrolled courses yet</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Contact your administrator to enroll in courses
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Timetable Section */}
      <div className="mt-8">
        <TimetableDisplay userId={user.id || user._id} userRole="student" />
      </div>
    </div>
  );
};

export default StudentDashboard;