import {useState, useEffect} from "react";
import {Link, useNavigate, useSearchParams} from "react-router-dom";
import {useAuth} from "../context/AuthContext";
import {Coins, Mail, Lock, AlertCircle} from "lucide-react";

const Login = () => {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get("role");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: roleParam || "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {login, updateUser} = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (roleParam) {
      setFormData((prev) => ({...prev, role: roleParam}));
    }
  }, [roleParam]);

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Clear any stale auth data before attempting login
    localStorage.removeItem("malsAdminToken");
    localStorage.removeItem("malsAdmin");
    localStorage.removeItem("teacherInfo");
    localStorage.removeItem("studentInfo");

    try {
      // Use only the unified login endpoint - it handles all user types and formats
      console.log("🔐 Login attempt starting...", {email: formData.email});
      const result = await login(formData.email, formData.password);
      console.log("🔐 Login result:", result);

      if (result.success) {
        // Clear any old auth data first
        localStorage.removeItem("malsAdminToken");
        localStorage.removeItem("malsAdmin");
        localStorage.removeItem("teacherInfo");
        localStorage.removeItem("studentInfo");

        setLoading(false);
        console.log("✅ Login successful, navigating to dashboard");
        navigate("/dashboard");
        return;
      } else {
        // Login returned false
        const errorMsg =
          result.message ||
          "Invalid email/username or password. Please check your credentials.";
        setError(errorMsg);
        console.error("❌ Unified login failed:", result.message);
      }
    } catch (loginError) {
      // Unified login threw an error
      console.error("❌ Login exception:", loginError);
      let errorMessage =
        "Invalid email/username or password. Please check your credentials.";

      // Check for network errors
      if (
        loginError.code === "ERR_NETWORK" ||
        loginError.message?.includes("Network Error")
      ) {
        errorMessage =
          "Cannot connect to server. Please make sure the backend server is running on port 5001.";
      } else if (loginError.response) {
        errorMessage = loginError.response?.data?.message || errorMessage;
      } else if (loginError.message) {
        errorMessage = loginError.message;
      }

      setError(errorMessage);
      console.error("Login error details:", {
        response: loginError?.response?.data,
        message: loginError?.message,
        status: loginError?.response?.status,
        statusText: loginError?.response?.statusText,
        code: loginError?.code,
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-yellow-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-yellow-200 rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-40 right-20 w-80 h-80 bg-yellow-300 rounded-full opacity-15 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-200 rounded-full opacity-10 blur-3xl"></div>
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
                  <Coins className="h-24 w-24 text-yellow-600" />
                </div>
              </div>
            </div>

            {/* Branding Content */}
            <div className="space-y-6">
              <h1 className="text-6xl font-serif font-extrabold text-gray-900 leading-tight">
                CurriculaFlex
              </h1>
              <p className="text-xl text-gray-600 font-medium leading-relaxed">
                Transform your educational journey with our flexible learning
                platform
              </p>

              {roleParam && (
                <div className="inline-flex items-center px-6 py-3 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold border-2 border-yellow-300 shadow-md">
                  <span className="w-2 h-2 bg-yellow-600 rounded-full mr-2 animate-pulse"></span>
                  {roleParam === "admin"
                    ? "Admin Login"
                    : roleParam === "student"
                    ? "Student Login"
                    : "Teacher Login"}
                </div>
              )}

              {/* Feature badges */}
              <div className="flex justify-center gap-6 text-sm text-gray-600 pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Secure Login</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Fast Access</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>24/7 Available</span>
                </div>
              </div>

              {/* Additional branding text */}
              <div className="pt-8 space-y-3">
                <p className="text-gray-500 text-sm">
                  "Not For Oneself But For All"
                </p>
                <p className="text-gray-700 font-medium">Learn Your Pace</p>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px bg-gradient-to-b from-transparent via-yellow-300 to-transparent opacity-50 shadow-lg"></div>

        {/* Right Column - Form */}
        <div className="w-1/2 flex items-center justify-center p-8 lg:p-16">
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

              <div className="space-y-6">
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
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-4 text-base border-2 border-gray-300 rounded-xl outline-none transition-all focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

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
                      className="w-full pl-12 pr-4 py-4 text-base border-2 border-gray-300 rounded-xl outline-none transition-all focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-8 py-4 text-lg bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold rounded-xl hover:from-yellow-600 hover:to-yellow-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
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
                    New to CurriculaFlex?
                  </span>
                </div>
              </div>

              <div className="text-center">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-yellow-600 hover:text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded-xl transition-all duration-300 border-2 border-yellow-200 hover:border-yellow-300"
                >
                  <span>Create New Account</span>
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </Link>
              </div>
            </form>

            {/* Additional Info Section */}
            <div className="text-center text-sm text-gray-600 space-y-2 mt-6">
              <p>
                Need help? Contact support at{" "}
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

export default Login;
