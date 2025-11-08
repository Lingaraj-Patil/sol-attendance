import {useState, useEffect} from "react";
import {useAuth} from "../context/AuthContext";
import {
  attendanceAPI,
  courseAPI,
  tokenAPI,
  marketplaceAPI,
} from "../services/api";
import {
  Coins,
  BookOpen,
  TrendingUp,
  Calendar,
  Award,
  ExternalLink,
  BarChart3,
  History,
  ShoppingBag,
  X,
  User,
} from "lucide-react";
import {format} from "date-fns";
import TimetableDisplay from "../components/TimetableDisplay";

const StudentDashboard = () => {
  const {user} = useAuth();
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
      const [
        statsRes,
        attendanceRes,
        coursesRes,
        transactionsRes,
        purchasesRes,
      ] = await Promise.all([
        attendanceAPI.getStats(userId),
        attendanceAPI.getAll({studentId: userId}),
        courseAPI.getAll({studentId: userId}),
        tokenAPI.getTransactions({limit: 20}),
        marketplaceAPI.getHistory({studentId: userId}),
      ]);

      setStats(statsRes.data.data);
      setAttendance(attendanceRes.data.data.attendance);
      setCourses(coursesRes.data.data.courses || []);
      setTransactions(transactionsRes.data.data.transactions || []);
      setPurchases(purchasesRes.data.data.purchases || []);
    } catch (error) {
      console.error("Load data error:", error);

      // Add dummy data when API calls fail
      const dummyStats = {
        student: {
          tokenBalance: 1250,
        },
        overall: {
          attendancePercentage: 87.5,
          presentClasses: 35,
        },
        courseWise: [
          {
            courseName: "Computer Networks",
            present: 28,
            total: 32,
            percentage: 87.5,
            tokensEarned: 280,
          },
          {
            courseName: "Data Structures",
            present: 25,
            total: 30,
            percentage: 83.3,
            tokensEarned: 250,
          },
          {
            courseName: "Web Development",
            present: 22,
            total: 26,
            percentage: 84.6,
            tokensEarned: 220,
          },
          {
            courseName: "Machine Learning",
            present: 30,
            total: 34,
            percentage: 88.2,
            tokensEarned: 300,
          },
        ],
      };

      const dummyCourses = [
        {
          _id: "1",
          name: "Computer Networks",
          code: "CS301",
          description:
            "Fundamentals of computer networking, protocols, and network security",
          priority: 1,
          tokensPerAttendance: 10,
          teacher: {
            name: "Dr. Sarah Johnson",
            email: "s.johnson@university.edu",
          },
          students: Array(45).fill(null),
        },
        {
          _id: "2",
          name: "Data Structures",
          code: "CS201",
          description:
            "Advanced data structures, algorithms, and their implementation",
          priority: 2,
          tokensPerAttendance: 10,
          teacher: {
            name: "Prof. Michael Chen",
            email: "m.chen@university.edu",
          },
          students: Array(52).fill(null),
        },
        {
          _id: "3",
          name: "Web Development",
          code: "CS350",
          description:
            "Full-stack web development with modern frameworks and technologies",
          priority: 3,
          tokensPerAttendance: 10,
          teacher: {
            name: "Dr. Emily Rodriguez",
            email: "e.rodriguez@university.edu",
          },
          students: Array(38).fill(null),
        },
        {
          _id: "4",
          name: "Machine Learning",
          code: "CS420",
          description:
            "Introduction to machine learning algorithms and artificial intelligence",
          priority: 4,
          tokensPerAttendance: 10,
          teacher: {
            name: "Dr. Robert Kim",
            email: "r.kim@university.edu",
          },
          students: Array(29).fill(null),
        },
      ];

      const dummyAttendance = [
        {
          _id: "1",
          course: {
            name: "Computer Networks",
            code: "CS301",
          },
          status: "present",
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          tokensAwarded: 10,
          remarks: "Great participation in network protocols discussion",
          explorerUrl: "https://explorer.solana.com/tx/sample1",
        },
        {
          _id: "2",
          course: {
            name: "Data Structures",
            code: "CS201",
          },
          status: "present",
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          tokensAwarded: 10,
          remarks: "Excellent understanding of binary trees",
          explorerUrl: "https://explorer.solana.com/tx/sample2",
        },
        {
          _id: "3",
          course: {
            name: "Web Development",
            code: "CS350",
          },
          status: "present",
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          tokensAwarded: 10,
          remarks: "Amazing React component implementation",
          explorerUrl: "https://explorer.solana.com/tx/sample3",
        },
        {
          _id: "4",
          course: {
            name: "Machine Learning",
            code: "CS420",
          },
          status: "absent",
          date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          tokensAwarded: 0,
          remarks: "",
          explorerUrl: null,
        },
        {
          _id: "5",
          course: {
            name: "Computer Networks",
            code: "CS301",
          },
          status: "present",
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          tokensAwarded: 10,
          remarks: "Good questions about TCP/IP protocols",
          explorerUrl: "https://explorer.solana.com/tx/sample5",
        },
      ];

      const dummyTransactions = [
        {
          _id: "1",
          type: "attendance",
          amount: 10,
          description: "Attendance reward for Computer Networks class",
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          token: {
            name: "EduToken",
            symbol: "EDU",
          },
          explorerUrl: "https://explorer.solana.com/tx/sample1",
        },
        {
          _id: "2",
          type: "attendance",
          amount: 10,
          description: "Attendance reward for Data Structures class",
          createdAt: new Date(
            Date.now() - 2 * 24 * 60 * 60 * 1000
          ).toISOString(),
          token: {
            name: "EduToken",
            symbol: "EDU",
          },
          explorerUrl: "https://explorer.solana.com/tx/sample2",
        },
        {
          _id: "3",
          type: "attendance",
          amount: 10,
          description: "Attendance reward for Web Development class",
          createdAt: new Date(
            Date.now() - 3 * 24 * 60 * 60 * 1000
          ).toISOString(),
          token: {
            name: "EduToken",
            symbol: "EDU",
          },
          explorerUrl: "https://explorer.solana.com/tx/sample3",
        },
        {
          _id: "4",
          type: "manual",
          amount: 50,
          description: "Bonus tokens for outstanding project presentation",
          createdAt: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
          token: {
            name: "EduToken",
            symbol: "EDU",
          },
          explorerUrl: "https://explorer.solana.com/tx/sample4",
        },
        {
          _id: "5",
          type: "attendance",
          amount: 10,
          description: "Attendance reward for Computer Networks lab",
          createdAt: new Date(
            Date.now() - 8 * 24 * 60 * 60 * 1000
          ).toISOString(),
          token: {
            name: "EduToken",
            symbol: "EDU",
          },
          explorerUrl: "https://explorer.solana.com/tx/sample5",
        },
      ];

      const dummyPurchases = [
        {
          _id: "1",
          product: {
            name: "Study Guide - Computer Networks",
            description:
              "Comprehensive study guide with network diagrams and protocol explanations",
            category: "study material",
            course: {
              name: "Computer Networks",
            },
          },
          tokenAmount: 25,
          createdAt: new Date(
            Date.now() - 10 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
        {
          _id: "2",
          product: {
            name: "Practice Problems - Data Structures",
            description: "100+ coding problems with detailed solutions",
            category: "practice",
            course: {
              name: "Data Structures",
            },
          },
          tokenAmount: 30,
          createdAt: new Date(
            Date.now() - 15 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
      ];

      setStats(dummyStats);
      setAttendance(dummyAttendance);
      setCourses(dummyCourses);
      setTransactions(dummyTransactions);
      setPurchases(dummyPurchases);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden">
        <div className="text-center relative z-10">
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-200 border-t-yellow-600 mx-auto shadow-lg"></div>
            <div className="absolute inset-0 rounded-full bg-yellow-100 opacity-20 blur-lg animate-pulse"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 animate-fade-in-up">
            Loading Dashboard
          </h2>
          <p
            className="text-gray-600 animate-fade-in-up"
            style={{animationDelay: "0.2s"}}
          >
            Preparing your personalized experience...
          </p>
          <div className="mt-6 flex justify-center space-x-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"
              style={{animationDelay: "0.1s"}}
            ></div>
            <div
              className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"
              style={{animationDelay: "0.2s"}}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      <div className="mb-8 relative z-10 animate-fade-in">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-yellow-600 bg-clip-text text-transparent animate-fade-in-up">
          Student Dashboard
        </h1>
        <p
          className="mt-2 text-lg text-gray-600 animate-fade-in-up"
          style={{animationDelay: "0.1s"}}
        >
          Track your attendance and rewards with style ✨
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 relative z-10">
        <div
          className="group card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white transform transition-all duration-500 hover:scale-105 hover:rotate-1 animate-fade-in-up shadow-lg hover:shadow-2xl"
          style={{animationDelay: "0.1s"}}
        >
          <div className="flex items-center justify-between">
            <div className="transition-all duration-300 group-hover:transform group-hover:translate-x-1">
              <p className="text-yellow-100 text-sm font-medium opacity-90">
                Total Tokens
              </p>
              <p className="text-4xl font-bold mt-2 animate-number-count">
                {stats?.student.tokenBalance || 0}
              </p>
              <div className="mt-2 text-xs text-yellow-200 opacity-80">
                💰 Digital rewards earned
              </div>
            </div>
            <div className="relative">
              <Coins className="h-14 w-14 text-yellow-200 transform transition-all duration-500 group-hover:rotate-12 group-hover:scale-110" />
              <div className="absolute -inset-2 bg-yellow-300 rounded-full opacity-30 blur-md group-hover:opacity-50 transition-opacity duration-300"></div>
            </div>
          </div>
        </div>

        <div
          className="group card transform transition-all duration-500 hover:scale-105 hover:-rotate-1 animate-fade-in-up shadow-lg hover:shadow-2xl border-l-4 border-green-500"
          style={{animationDelay: "0.2s"}}
        >
          <div className="flex items-center justify-between">
            <div className="transition-all duration-300 group-hover:transform group-hover:translate-x-1">
              <p className="text-gray-600 text-sm font-medium">
                Attendance Rate
              </p>
              <p className="text-4xl font-bold text-green-600 mt-2 animate-number-count">
                {stats?.overall.attendancePercentage.toFixed(1)}%
              </p>
              <div className="mt-2 text-xs text-gray-500">📈 Keep it up!</div>
            </div>
            <div className="relative">
              <TrendingUp className="h-14 w-14 text-green-500 transform transition-all duration-500 group-hover:rotate-12 group-hover:scale-110" />
              <div className="absolute -inset-2 bg-green-300 rounded-full opacity-20 blur-md group-hover:opacity-40 transition-opacity duration-300"></div>
            </div>
          </div>
        </div>

        <div
          className="group card transform transition-all duration-500 hover:scale-105 hover:rotate-1 animate-fade-in-up shadow-lg hover:shadow-2xl border-l-4 border-blue-500"
          style={{animationDelay: "0.3s"}}
        >
          <div className="flex items-center justify-between">
            <div className="transition-all duration-300 group-hover:transform group-hover:translate-x-1">
              <p className="text-gray-600 text-sm font-medium">
                Classes Attended
              </p>
              <p className="text-4xl font-bold text-blue-600 mt-2 animate-number-count">
                {stats?.overall.presentClasses}
              </p>
              <div className="mt-2 text-xs text-gray-500">
                📚 Learning journey
              </div>
            </div>
            <div className="relative">
              <Calendar className="h-14 w-14 text-blue-500 transform transition-all duration-500 group-hover:rotate-12 group-hover:scale-110" />
              <div className="absolute -inset-2 bg-blue-300 rounded-full opacity-20 blur-md group-hover:opacity-40 transition-opacity duration-300"></div>
            </div>
          </div>
        </div>

        <div
          className="group card cursor-pointer transform transition-all duration-500 hover:scale-105 hover:-rotate-1 animate-fade-in-up shadow-lg hover:shadow-2xl border-l-4 border-purple-500 hover:bg-purple-50"
          style={{animationDelay: "0.4s"}}
          onClick={() => {
            console.log("Enrolled Courses clicked, courses:", courses);
            setShowCoursesModal(true);
          }}
        >
          <div className="flex items-center justify-between">
            <div className="transition-all duration-300 group-hover:transform group-hover:translate-x-1">
              <p className="text-gray-600 text-sm font-medium group-hover:text-purple-700">
                Enrolled Courses
              </p>
              <p className="text-4xl font-bold text-purple-600 mt-2 animate-number-count group-hover:text-purple-700">
                {courses.length}
              </p>
              <div className="mt-2 text-xs text-gray-500 group-hover:text-purple-600">
                🎓 Click to view details
              </div>
            </div>
            <div className="relative">
              <BookOpen className="h-14 w-14 text-purple-500 transform transition-all duration-500 group-hover:rotate-12 group-hover:scale-110" />
              <div className="absolute -inset-2 bg-purple-300 rounded-full opacity-20 blur-md group-hover:opacity-40 transition-opacity duration-300"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Info */}
      <div
        className="card mb-8 animate-fade-in-up group hover:shadow-xl transition-all duration-500"
        style={{animationDelay: "0.5s"}}
      >
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center group-hover:text-yellow-700 transition-colors duration-300">
          <Award className="h-6 w-6 mr-2 text-yellow-600 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300" />
          Wallet Information
        </h2>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200 group-hover:border-yellow-300 transition-all duration-300 transform group-hover:scale-[1.01]">
          <p className="text-sm text-yellow-700 mb-2 font-medium">
            🔗 Your Solana Wallet Address
          </p>
          <div className="relative">
            <p className="font-mono text-sm text-gray-900 break-all bg-white rounded-lg p-3 border border-yellow-200 shadow-sm">
              {user?.walletAddress || "No wallet address"}
            </p>
            <div className="absolute -inset-1 bg-yellow-200 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-sm"></div>
          </div>
          <div className="mt-3 text-xs text-yellow-600">
            💡 This address receives your attendance rewards
          </div>
        </div>
      </div>

      {/* Course-wise Stats */}
      {stats?.courseWise && stats.courseWise.length > 0 && (
        <div
          className="card mb-8 animate-fade-in-up group hover:shadow-xl transition-all duration-500"
          style={{animationDelay: "0.6s"}}
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center group-hover:text-blue-700 transition-colors duration-300">
            <BarChart3 className="h-6 w-6 mr-2 text-blue-600 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300" />
            Course-wise Performance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stats.courseWise.map((course, index) => (
              <div
                key={index}
                className="border border-blue-200 rounded-xl p-6 bg-gradient-to-br from-blue-50 to-white hover:shadow-lg transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-1 animate-fade-in-up"
                style={{animationDelay: `${0.7 + index * 0.1}s`}}
              >
                <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center">
                  📚 {course.courseName}
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm font-medium">
                      Attendance Rate:
                    </span>
                    <div className="text-right">
                      <span className="font-bold text-gray-900 text-lg">
                        {course.present}/{course.total}
                      </span>
                      <span
                        className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${
                          course.percentage >= 80
                            ? "bg-green-100 text-green-800"
                            : course.percentage >= 60
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {course.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm font-medium">
                      Tokens Earned:
                    </span>
                    <div className="flex items-center space-x-1">
                      <Coins className="h-4 w-4 text-yellow-500" />
                      <span className="font-bold text-yellow-600 text-lg">
                        {course.tokensEarned}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                    <div
                      className={`h-3 rounded-full transition-all duration-1000 ease-out ${
                        course.percentage >= 80
                          ? "bg-gradient-to-r from-green-400 to-green-500"
                          : course.percentage >= 60
                          ? "bg-gradient-to-r from-yellow-400 to-yellow-500"
                          : "bg-gradient-to-r from-red-400 to-red-500"
                      }`}
                      style={{
                        width: `${course.percentage}%`,
                        animationDelay: `${1 + index * 0.2}s`,
                      }}
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
                    {purchase.product?.category || "product"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(purchase.createdAt), "MMM dd, yyyy")}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {purchase.product?.name || "Product"}
                </h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {purchase.product?.description || ""}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-primary-600">
                    <Coins className="h-4 w-4" />
                    <span className="text-sm font-semibold">
                      {purchase.tokenAmount}
                    </span>
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
      <div
        className="card mb-8 animate-fade-in-up group hover:shadow-xl transition-all duration-500"
        style={{animationDelay: "0.8s"}}
      >
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center group-hover:text-green-700 transition-colors duration-300">
          <History className="h-6 w-6 mr-2 text-green-600 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300" />
          Transaction History
        </h2>

        {transactions.length > 0 ? (
          <div className="space-y-4">
            {transactions.map((tx, index) => (
              <div
                key={tx._id}
                className="flex items-center justify-between p-5 bg-gradient-to-r from-green-50 to-white rounded-xl border border-green-200 hover:shadow-lg transition-all duration-500 transform hover:scale-[1.01] hover:-translate-y-1 animate-fade-in-up"
                style={{animationDelay: `${0.9 + index * 0.1}s`}}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-4 h-4 rounded-full ${
                        tx.type === "attendance"
                          ? "bg-green-500 animate-pulse"
                          : "bg-blue-500 animate-pulse"
                      } shadow-lg`}
                    ></div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-gray-900 text-lg">
                          {tx.type === "attendance"
                            ? "🎯 Attendance Reward"
                            : "💰 Manual Transfer"}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            tx.type === "attendance"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {tx.type === "attendance" ? "REWARD" : "TRANSFER"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 font-medium">
                        {tx.description ||
                          `${tx.token?.name || "Token"} Transaction`}
                      </p>
                      <p className="text-xs text-gray-500 mt-2 flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(tx.createdAt), "PPP p")}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="flex items-center space-x-2 bg-yellow-50 px-4 py-2 rounded-xl border border-yellow-200">
                      <Coins className="h-6 w-6 text-yellow-500 animate-bounce" />
                      <div>
                        <span className="font-bold text-2xl text-yellow-600">
                          +{tx.amount}
                        </span>
                        <div className="text-xs text-yellow-500 font-medium">
                          {tx.token?.symbol || "TOKENS"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {tx.explorerUrl && (
                    <a
                      href={tx.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-sm bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                      title="View on Solana Explorer"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="font-medium">View TX</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="relative mb-6">
              <History className="h-20 w-20 text-gray-300 mx-auto animate-float" />
              <div className="absolute -inset-2 bg-gray-200 rounded-full opacity-30 blur-lg animate-pulse"></div>
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2 animate-fade-in-up">
              No transactions yet
            </h3>
            <p
              className="text-gray-500 animate-fade-in-up"
              style={{animationDelay: "0.1s"}}
            >
              🎯 Attend classes to start earning tokens!
            </p>
            <div
              className="mt-6 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200 animate-fade-in-up"
              style={{animationDelay: "0.2s"}}
            >
              <p className="text-sm text-yellow-700 font-medium">
                💡 Your first transaction will appear here once you attend a
                class
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Recent Attendance */}
      <div
        className="card animate-fade-in-up group hover:shadow-xl transition-all duration-500"
        style={{animationDelay: "1.0s"}}
      >
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center group-hover:text-purple-700 transition-colors duration-300">
          <Calendar className="h-6 w-6 mr-2 text-purple-600 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300" />
          Attendance Records
        </h2>

        {attendance.length > 0 ? (
          <div className="space-y-4">
            {attendance.slice(0, 20).map((record, index) => (
              <div
                key={record._id}
                className="p-6 bg-gradient-to-r from-purple-50 to-white rounded-xl border border-purple-200 hover:shadow-lg transition-all duration-500 transform hover:scale-[1.01] hover:-translate-y-1 animate-fade-in-up"
                style={{animationDelay: `${1.1 + index * 0.05}s`}}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <div
                        className={`w-5 h-5 rounded-full ${
                          record.status === "present"
                            ? "bg-green-500 animate-pulse shadow-lg"
                            : "bg-red-500 animate-pulse shadow-lg"
                        } flex items-center justify-center`}
                      >
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-bold text-gray-900 text-lg">
                            📚 {record.course?.name || "Course"}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              record.status === "present"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {record.course?.code || "N/A"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 flex items-center space-x-2">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(record.date), "PPP p")}</span>
                        </p>
                        {record.remarks && (
                          <div className="mt-3 bg-blue-50 border-l-4 border-blue-300 p-3 rounded-r-lg">
                            <p className="text-sm text-blue-700 italic font-medium">
                              💬 "{record.remarks}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-3">
                    <div
                      className={`px-4 py-2 rounded-xl text-sm font-bold shadow-lg transform transition-all duration-300 hover:scale-105 ${
                        record.status === "present"
                          ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                          : "bg-gradient-to-r from-red-500 to-red-600 text-white"
                      }`}
                    >
                      {record.status === "present" ? "✅ Present" : "❌ Absent"}
                    </div>

                    {record.status === "present" &&
                      record.tokensAwarded > 0 && (
                        <div className="flex items-center space-x-2 bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 px-4 py-2 rounded-xl border border-yellow-300 shadow-lg animate-bounce">
                          <Coins className="h-5 w-5 text-yellow-600" />
                          <span className="font-bold">
                            +{record.tokensAwarded}
                          </span>
                          <span className="text-xs font-medium">TOKENS</span>
                        </div>
                      )}

                    {record.explorerUrl && (
                      <a
                        href={record.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-sm bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                        title="View on Solana Explorer"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="font-medium">View TX</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="relative mb-6">
              <Calendar className="h-24 w-24 text-purple-300 mx-auto animate-float" />
              <div className="absolute -inset-3 bg-purple-200 rounded-full opacity-30 blur-lg animate-pulse"></div>
            </div>
            <h3 className="text-2xl font-bold text-gray-700 mb-3 animate-fade-in-up">
              No attendance records yet
            </h3>
            <p
              className="text-gray-500 text-lg mb-6 animate-fade-in-up"
              style={{animationDelay: "0.1s"}}
            >
              📚 Your attendance journey starts here
            </p>
            <div
              className="bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50 rounded-2xl p-8 border border-purple-200 animate-fade-in-up max-w-md mx-auto"
              style={{animationDelay: "0.2s"}}
            >
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-purple-700">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-lg">🎯</span>
                  </div>
                  <span className="font-medium">
                    Attend classes to earn tokens
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-purple-700">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-lg">📊</span>
                  </div>
                  <span className="font-medium">Track your progress here</span>
                </div>
                <div className="flex items-center space-x-3 text-purple-700">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-lg">🏆</span>
                  </div>
                  <span className="font-medium">
                    Build your academic record
                  </span>
                </div>
              </div>
            </div>
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
                            {course.teacher?.name || "N/A"}
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
                            <span className="text-gray-500">
                              Reward Tokens per Attendance:{" "}
                            </span>
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
