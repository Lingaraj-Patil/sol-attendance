import {useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {useAuth} from "../context/AuthContext";
import {
  authAPI,
  malsAdminAPI,
  malsStudentAPI,
  malsTeacherAPI,
} from "../services/api";
import {
  Coins,
  User,
  Mail,
  Lock,
  Wallet,
  AlertCircle,
  GraduationCap,
  Briefcase,
  Building2,
} from "lucide-react";

const Register = () => {
  const [formData, setFormData] = useState({
    // Unified fields
    name: "",
    email: "",
    username: "",
    password: "",
    role: "student",
    walletAddress: "",
    collegeUniqueId: "", // Required for students and teachers
    // Student-specific fields
    age: "",
    gender: "",
    Program: "",
    feedback: "",
    maxCourses: "",
    // Teacher-specific fields
    experience: "",
    department: "",
    workingHour: "",
    // Admin-specific fields
    labCapacity: "",
    classCapacity: "",
    // Timetable fields (for both student and teacher)
    availability: [],
    interests: [],
    preferredTimeSlots: [],
    coursePreferences: [],
  });

  const [selectedAvailability, setSelectedAvailability] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState("");
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {register} = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validate required fields based on role
      if (formData.role === "admin") {
        // For admin, username can be in username or email field
        const adminUsername = formData.username || formData.email;
        if (!formData.name || !adminUsername || !formData.password) {
          setError(
            "Please fill in all required fields (Name, Username, Password)"
          );
          setLoading(false);
          return;
        }
      } else {
        if (
          !formData.name ||
          !formData.email ||
          !formData.password ||
          !formData.role
        ) {
          setError("Please fill in all required fields");
          setLoading(false);
          return;
        }
      }

      // Validate wallet for students (admin doesn't need wallet in MALS)
      if (formData.role === "student" && !formData.walletAddress) {
        setError("Wallet address is required for students");
        setLoading(false);
        return;
      }
      // Teacher only needs name, username, password - institute connection is next step
      // Admin only needs name, username, password - institute registration is next step

      // Handle admin registration separately using MALS API
      if (formData.role === "admin") {
        try {
          // For admin, username can be in username or email field
          const adminUsername = formData.username || formData.email;
          const adminData = {
            username: adminUsername,
            password: formData.password,
          };

          const response = await malsAdminAPI.register(adminData);

          // Store admin token and info
          // Main backend returns: { success, message, token, data: { admin: { id, username, ... } } }
          const token = response.data.token || response.data.data?.token;
          const admin = response.data.data?.admin || response.data.admin;

          if (token) {
            localStorage.setItem("malsAdminToken", token);
            localStorage.setItem("token", token); // Also store in main token for consistency
            localStorage.setItem("malsAdmin", JSON.stringify(admin));
            // Redirect to institute registration
            navigate("/register-institute");
          } else {
            setError("Registration successful but no token received");
            setLoading(false);
          }
        } catch (error) {
          console.error("Admin registration error:", error);
          const errorMessage =
            error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            "Admin registration failed";
          setError(errorMessage);
          setLoading(false);
        }
        return;
      }

      // Handle student registration - Step 1: Only collect name, email (as username), password
      if (formData.role === "student") {
        if (!formData.name || !formData.email || !formData.password) {
          setError(
            "Please fill in all required fields (Name, Email, Password)"
          );
          setLoading(false);
          return;
        }

        // Store student basic info in localStorage and redirect to connect institute
        // Use email as username for students (backend expects username)
        const studentInfo = {
          name: formData.name,
          username: formData.email, // Use email as username for students
          password: formData.password,
          walletAddress: formData.walletAddress, // Store wallet address for later
        };

        localStorage.setItem("studentInfo", JSON.stringify(studentInfo));
        navigate("/connect-institute");
        return;
      }

      // Handle teacher registration - Step 1: Only collect name, email (as username), password
      if (formData.role === "teacher") {
        if (!formData.name || !formData.email || !formData.password) {
          setError(
            "Please fill in all required fields (Name, Email, Password)"
          );
          setLoading(false);
          return;
        }

        // Store teacher basic info in localStorage and redirect to connect institute
        // Use email as username for teachers (backend expects username)
        const teacherInfo = {
          name: formData.name,
          username: formData.email, // Use email as username for teachers
          password: formData.password,
        };

        localStorage.setItem("teacherInfo", JSON.stringify(teacherInfo));
        navigate("/connect-institute");
        return;
      }

      // Prepare unified registration data for other roles (if any)
      const registrationData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        walletAddress: formData.walletAddress,
        // Timetable fields
        availability: selectedAvailability,
        interests: selectedInterests
          .split(",")
          .map((i) => i.trim())
          .filter((i) => i),
        preferredTimeSlots: selectedTimeSlots,
        coursePreferences: formData.coursePreferences,
      };

      const result = await register(registrationData);

      if (result.success) {
        navigate("/dashboard");
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const needsWallet = formData.role === "student" || formData.role === "admin";
  const isStudent = formData.role === "student";
  const isTeacher = formData.role === "teacher";
  const isAdmin = formData.role === "admin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-yellow-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-yellow-200 rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-40 right-20 w-80 h-80 bg-yellow-300 rounded-full opacity-15 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-96 h-96 bg-blue-200 rounded-full opacity-10 blur-3xl"></div>
        {/* Decorative dots pattern */}
        <div className="absolute top-0 left-0 w-full h-full opacity-30">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.5,
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600"></div>

      {/* Two Column Layout */}
      <div className="min-h-screen flex relative z-10">
        {/* Left Column - Branding */}
        <div className="w-1/2 flex items-center justify-center p-8 lg:p-16">
          <div className="max-w-md text-center space-y-8">
            {/* Logo Section */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute -inset-6 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full opacity-20 blur-2xl animate-pulse"></div>
                <div className="relative bg-white rounded-full p-8 shadow-2xl">
                  <div className="relative">
                    <Coins className="h-24 w-24 text-yellow-600" />
                    <GraduationCap className="h-12 w-12 text-yellow-500 absolute -bottom-2 -right-2 bg-white rounded-full p-1" />
                  </div>
                </div>
              </div>
            </div>

            {/* Branding Content */}
            <div className="space-y-6">
              <h1 className="text-6xl font-serif font-extrabold text-gray-900 leading-tight">
                Join CurriculaFlex
              </h1>
              <p className="text-xl text-gray-600 font-medium leading-relaxed">
                Start your educational journey with personalized learning
                experiences
              </p>

              {/* Feature badges */}
              <div className="flex justify-center gap-6 text-sm text-gray-600 pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Free to Join</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Instant Setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Token Rewards</span>
                </div>
              </div>

              {/* Role-specific messaging */}
              <div className="pt-8 space-y-4">
                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Choose Your Path
                  </h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      🎓 <span className="font-medium">Student:</span> Learn at
                      your own pace
                    </p>
                    <p>
                      👨‍🏫 <span className="font-medium">Teacher:</span> Shape the
                      future
                    </p>
                    <p>
                      🏛️ <span className="font-medium">Admin:</span> Manage your
                      institute
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px bg-gradient-to-b from-transparent via-yellow-300 to-transparent opacity-50 shadow-lg"></div>

        {/* Right Column - Form */}
        <div className="w-1/2 flex items-center justify-center p-8 lg:p-16 overflow-y-auto">
          <div className="w-full max-w-md">
            <form
              className="space-y-6 bg-white/90 backdrop-blur-md p-10 rounded-2xl shadow-2xl border-2 border-yellow-200"
              onSubmit={handleSubmit}
            >
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2 text-red-800">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="space-y-5">
                {/* Common fields for all roles */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Full Name
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400 group-focus-within:text-yellow-600 transition-colors" />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 text-base border-2 border-gray-300 rounded-xl outline-none transition-all focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                {!isAdmin && (
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Email Address
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-yellow-600 transition-colors" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required={!isAdmin}
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3 text-base border-2 border-gray-300 rounded-xl outline-none transition-all focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                )}

                {isAdmin && (
                  <div>
                    <label
                      htmlFor="username"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Username
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400 group-focus-within:text-yellow-600 transition-colors" />
                      </div>
                      <input
                        id="username"
                        name="username"
                        type="text"
                        required
                        value={formData.username || formData.email || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData({
                            ...formData,
                            username: value,
                            email: value,
                          });
                        }}
                        className="w-full pl-12 pr-4 py-3 text-base border-2 border-gray-300 rounded-xl outline-none transition-all focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
                        placeholder="admin_username"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-yellow-600 transition-colors" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 text-base border-2 border-gray-300 rounded-xl outline-none transition-all focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
                      placeholder="••••••••"
                      minLength="6"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="role"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Select Your Role
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl outline-none transition-all focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 bg-white"
                    required
                  >
                    <option value="student">🎓 Student</option>
                    <option value="teacher">👨‍🏫 Teacher</option>
                    <option value="admin">🏛️ Admin</option>
                  </select>
                </div>

                {/* Wallet Address (for students and admin) */}
                {needsWallet && (
                  <div>
                    <label
                      htmlFor="walletAddress"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Solana Wallet Address
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Wallet className="h-5 w-5 text-gray-400 group-focus-within:text-yellow-600 transition-colors" />
                      </div>
                      <input
                        id="walletAddress"
                        name="walletAddress"
                        type="text"
                        required={needsWallet}
                        value={formData.walletAddress}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3 text-base border-2 border-gray-300 rounded-xl outline-none transition-all focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
                        placeholder="Enter your Solana wallet address"
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-600 flex items-center gap-1">
                      <span className="w-1 h-1 bg-yellow-500 rounded-full"></span>
                      Required for receiving reward tokens
                    </p>
                  </div>
                )}

                {/* Student-specific fields - Only wallet address needed here */}
                {/* Rest of the fields (age, gender, Program, collegeUniqueId, etc.) will be collected on connect-institute page */}
                {isStudent && (
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">ℹ</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-blue-900 mb-1">
                          Next Step: Institute Connection
                        </p>
                        <p className="text-sm text-blue-800">
                          After registration, you'll be redirected to connect
                          with your institute where you'll provide your college
                          ID and other details.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Teacher-specific fields - Only name, username, password needed here */}
                {/* Rest of the fields (experience, department, workingHour, collegeUniqueId) will be collected on connect-institute page */}
                {isTeacher && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">ℹ</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-purple-900 mb-1">
                          Next Step: Institute Connection
                        </p>
                        <p className="text-sm text-purple-800">
                          After registration, you'll be redirected to connect
                          with your institute where you'll provide your college
                          ID and other details.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Admin-specific fields - Only name, username, password needed */}
                {/* Institute registration will be done in next step */}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-8 py-4 text-lg bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold rounded-xl hover:from-yellow-600 hover:to-yellow-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </>
                )}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">
                    Already a member?
                  </span>
                </div>
              </div>

              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-yellow-600 hover:text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded-xl transition-all duration-300 border-2 border-yellow-200 hover:border-yellow-300"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>Sign In Instead</span>
                </Link>
              </div>
            </form>

            {/* Additional Info Section */}
            <div className="text-center text-sm text-gray-600 space-y-2 mt-6">
              <p>
                Questions? Contact us at{" "}
                <span className="text-yellow-600 font-medium">
                  support@curriculaflex.com
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
