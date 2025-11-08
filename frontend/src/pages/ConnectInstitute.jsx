import {useState, useEffect} from "react";
import {useNavigate} from "react-router-dom";
import {useAuth} from "../context/AuthContext";
import {malsTeacherAPI, malsStudentAPI, courseAPI} from "../services/api";
import {
  Building2,
  AlertCircle,
  CheckCircle,
  Briefcase,
  Clock,
  GraduationCap,
  User,
  BookOpen,
} from "lucide-react";

const ConnectInstitute = () => {
  const [userType, setUserType] = useState(null); // 'teacher' or 'student'
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);

  // Teacher form data
  const [teacherFormData, setTeacherFormData] = useState({
    collegeUniqueId: "",
    experience: "",
    department: "",
    workingHour: "",
  });

  // Student form data
  const [studentFormData, setStudentFormData] = useState({
    collegeUniqueId: "",
    age: "",
    gender: "",
    Program: "",
    maxCourses: "",
    selectedCourses: [], // Array to store selected course IDs
  });

  const [availableCourses, setAvailableCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();
  const {updateUser} = useAuth();

  useEffect(() => {
    // Check if teacher or student basic info exists in localStorage
    const storedTeacher = localStorage.getItem("teacherInfo");
    const storedStudent = localStorage.getItem("studentInfo");

    if (storedTeacher) {
      const teacher = JSON.parse(storedTeacher);
      setTeacherInfo(teacher);
      setUserType("teacher");
    } else if (storedStudent) {
      const student = JSON.parse(storedStudent);
      setStudentInfo(student);
      setUserType("student");
    } else {
      // If no info, redirect to register
      navigate("/register");
    }
  }, [navigate]);

  const handleTeacherChange = (e) => {
    setTeacherFormData({...teacherFormData, [e.target.name]: e.target.value});
    setError("");
  };

  const handleStudentChange = (e) => {
    const {name, value} = e.target;
    setStudentFormData({...studentFormData, [name]: value});
    setError("");

    // If collegeUniqueId changes, fetch courses for that college
    if (name === "collegeUniqueId" && value) {
      fetchCollegeCourses(value);
    }

    // If maxCourses changes, update selectedCourses array length
    if (name === "maxCourses") {
      const numCourses = parseInt(value) || 0;
      const currentSelected = studentFormData.selectedCourses || [];
      // Resize array to match maxCourses
      const newSelected = Array(numCourses)
        .fill(null)
        .map((_, i) => currentSelected[i] || "");
      setStudentFormData((prev) => ({...prev, selectedCourses: newSelected}));
    }
  };

  const fetchCollegeCourses = async (collegeUniqueId) => {
    if (!collegeUniqueId || collegeUniqueId.trim() === "") {
      setAvailableCourses([]);
      return;
    }

    setLoadingCourses(true);
    try {
      // Use the public endpoint to get courses by college unique ID
      const coursesResponse = await courseAPI.getByCollege(collegeUniqueId);
      if (coursesResponse.data.success) {
        const courses = coursesResponse.data.data.courses || [];
        setAvailableCourses(courses);
      } else {
        setAvailableCourses([]);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      // Handle errors gracefully - don't redirect during registration
      setAvailableCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleCourseSelection = (index, courseId) => {
    const newSelected = [...studentFormData.selectedCourses];
    newSelected[index] = courseId;
    setStudentFormData({...studentFormData, selectedCourses: newSelected});
  };

  const handleTeacherSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage(null);

    try {
      if (
        !teacherFormData.collegeUniqueId ||
        !teacherFormData.experience ||
        !teacherFormData.department ||
        !teacherFormData.workingHour
      ) {
        setError("Please fill in all required fields.");
        setLoading(false);
        return;
      }

      if (
        isNaN(teacherFormData.experience) ||
        parseFloat(teacherFormData.experience) < 0
      ) {
        setError("Years of Experience must be a non-negative number.");
        setLoading(false);
        return;
      }

      if (
        isNaN(teacherFormData.workingHour) ||
        parseFloat(teacherFormData.workingHour) <= 0
      ) {
        setError("Working Hours per Week must be a positive number.");
        setLoading(false);
        return;
      }

      if (!teacherInfo) {
        setError("Teacher basic information not found. Please register again.");
        setLoading(false);
        return;
      }

      const teacherData = {
        username: teacherInfo.username,
        password: teacherInfo.password,
        name: teacherInfo.name,
        experience: parseFloat(teacherFormData.experience),
        department: teacherFormData.department,
        workingHour: parseFloat(teacherFormData.workingHour),
        collegeUniqueId: teacherFormData.collegeUniqueId,
      };

      const response = await malsTeacherAPI.register(teacherData);
      const token = response.data.token || response.data.data?.token;
      const teacher = response.data.data?.teacher || response.data.teacher;

      if (token) {
        localStorage.removeItem("teacherInfo");
        localStorage.setItem("token", token);

        const userData = {
          id: teacher.id || teacher._id,
          name: teacher.name,
          email: teacher.email || `${teacher.username}@teacher.mals`,
          role: "teacher",
          ...teacher,
        };

        localStorage.setItem("user", JSON.stringify(userData));
        updateUser(userData);

        setMessage({
          type: "success",
          text: "Teacher registration completed successfully! Redirecting to dashboard...",
        });
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } else {
        setError("Registration successful but no token received");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error completing teacher registration:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to complete teacher registration";
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage(null);

    try {
      if (
        !studentFormData.collegeUniqueId ||
        !studentFormData.age ||
        !studentFormData.gender ||
        !studentFormData.Program
      ) {
        setError(
          "Please fill in all required fields (College Unique ID, Age, Gender, Program)."
        );
        setLoading(false);
        return;
      }

      if (isNaN(studentFormData.age) || parseFloat(studentFormData.age) < 1) {
        setError("Age must be a positive number.");
        setLoading(false);
        return;
      }

      if (
        studentFormData.maxCourses &&
        (isNaN(studentFormData.maxCourses) ||
          parseFloat(studentFormData.maxCourses) < 1)
      ) {
        setError("Maximum courses must be a positive number.");
        setLoading(false);
        return;
      }

      if (!studentInfo) {
        setError("Student basic information not found. Please register again.");
        setLoading(false);
        return;
      }

      // Validate that if maxCourses is set, all courses are selected
      if (studentFormData.maxCourses) {
        const numCourses = parseInt(studentFormData.maxCourses);
        const selectedCourses = studentFormData.selectedCourses || [];
        const filledCourses = selectedCourses.filter((c) => c && c !== "");

        if (filledCourses.length !== numCourses) {
          setError(`Please select all ${numCourses} course(s).`);
          setLoading(false);
          return;
        }
      }

      // Build coursePreferences from selected courses
      const coursePreferences = (studentFormData.selectedCourses || [])
        .filter((c) => c && c !== "")
        .map((courseId, index) => {
          const course = availableCourses.find(
            (c) => c._id === courseId || c.id === courseId
          );
          return {
            courseCode: course?.code || course?.courseCode || courseId,
            priority: index + 1,
          };
        });

      const studentData = {
        username: studentInfo.username,
        password: studentInfo.password,
        age: parseInt(studentFormData.age),
        gender: studentFormData.gender,
        Program: studentFormData.Program,
        collegeUniqueId: studentFormData.collegeUniqueId,
        walletAddress: studentInfo.walletAddress,
        ...(studentFormData.maxCourses && {
          maxCourses: parseInt(studentFormData.maxCourses),
        }),
        ...(coursePreferences.length > 0 && {coursePreferences}),
      };

      const response = await malsStudentAPI.register(studentData);
      const token = response.data.token || response.data.data?.token;
      const student = response.data.data?.student || response.data.student;

      if (token) {
        localStorage.removeItem("studentInfo");
        localStorage.setItem("token", token);

        const userData = {
          id: student.id || student._id,
          name: student.name || student.username,
          email: student.email || `${student.username}@student.mals`,
          role: "student",
          ...student,
        };

        localStorage.setItem("user", JSON.stringify(userData));
        updateUser(userData);

        setMessage({
          type: "success",
          text: "Student registration completed successfully! Redirecting to dashboard...",
        });
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } else {
        setError("Registration successful but no token received");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error completing student registration:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to complete student registration";
      setError(errorMessage);
      setLoading(false);
    }
  };

  if (!userType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-yellow-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-yellow-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-yellow-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-40 right-20 w-80 h-80 bg-yellow-300 rounded-full opacity-15 blur-3xl"></div>
      </div>

      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600"></div>

      <div className="max-w-2xl w-full space-y-8 relative z-10">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="relative">
              <Building2 className="h-12 w-12 text-yellow-600" />
              <div className="absolute -inset-1 bg-yellow-400 rounded-full opacity-20 blur-lg"></div>
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-serif font-extrabold text-gray-900">
            Connect with Your Institute
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Complete your {userType} registration by connecting to your college
          </p>
        </div>

        <form
          className="mt-8 space-y-6 bg-white/80 backdrop-blur-sm p-8 rounded-lg shadow-xl border-2 border-yellow-200"
          onSubmit={
            userType === "teacher" ? handleTeacherSubmit : handleStudentSubmit
          }
        >
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {message && (
            <div
              className={`border rounded-lg p-4 flex items-center space-x-2 ${
                message.type === "success"
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          {/* College Unique ID - Common for both */}
          <div>
            <label
              htmlFor="collegeUniqueId"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              College Unique ID *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building2 className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="collegeUniqueId"
                name="collegeUniqueId"
                type="text"
                required
                value={
                  userType === "teacher"
                    ? teacherFormData.collegeUniqueId
                    : studentFormData.collegeUniqueId
                }
                onChange={
                  userType === "teacher"
                    ? handleTeacherChange
                    : handleStudentChange
                }
                className="input-field pl-10 w-full"
                placeholder="Enter your college unique ID"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Get this ID from your college administrator
            </p>
          </div>

          {/* Teacher-specific fields */}
          {userType === "teacher" && (
            <>
              <div>
                <label
                  htmlFor="experience"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Years of Experience *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="experience"
                    name="experience"
                    type="number"
                    required
                    min="0"
                    value={teacherFormData.experience}
                    onChange={handleTeacherChange}
                    className="input-field pl-10 w-full"
                    placeholder="e.g., 5"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="department"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Department *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <GraduationCap className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="department"
                    name="department"
                    type="text"
                    required
                    value={teacherFormData.department}
                    onChange={handleTeacherChange}
                    className="input-field pl-10 w-full"
                    placeholder="e.g., Computer Science"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="workingHour"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Working Hours per Week *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="workingHour"
                    name="workingHour"
                    type="number"
                    required
                    min="1"
                    value={teacherFormData.workingHour}
                    onChange={handleTeacherChange}
                    className="input-field pl-10 w-full"
                    placeholder="e.g., 40"
                  />
                </div>
              </div>
            </>
          )}

          {/* Student-specific fields */}
          {userType === "student" && (
            <>
              <div>
                <label
                  htmlFor="age"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Age *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="age"
                    name="age"
                    type="number"
                    required
                    min="1"
                    value={studentFormData.age}
                    onChange={handleStudentChange}
                    className="input-field pl-10 w-full"
                    placeholder="e.g., 20"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="gender"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Gender *
                </label>
                <select
                  id="gender"
                  name="gender"
                  required
                  value={studentFormData.gender}
                  onChange={handleStudentChange}
                  className="input-field w-full"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="Program"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Program *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BookOpen className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="Program"
                    name="Program"
                    type="text"
                    required
                    value={studentFormData.Program}
                    onChange={handleStudentChange}
                    className="input-field pl-10 w-full"
                    placeholder="e.g., Computer Science"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="maxCourses"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Number of Courses to Select *
                </label>
                <input
                  id="maxCourses"
                  name="maxCourses"
                  type="number"
                  required
                  min="1"
                  max="10"
                  value={studentFormData.maxCourses}
                  onChange={handleStudentChange}
                  className="input-field w-full"
                  placeholder="e.g., 5"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Select how many courses you want to enroll in
                </p>
              </div>

              {/* Dynamic Course Selection */}
              {studentFormData.maxCourses &&
                parseInt(studentFormData.maxCourses) > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Your Courses *
                    </label>
                    {loadingCourses ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
                        <p className="text-sm text-gray-500 mt-2">
                          Loading courses...
                        </p>
                      </div>
                    ) : availableCourses.length === 0 ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800">
                          No courses available. Please enter a valid College
                          Unique ID or contact your administrator.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {Array.from({
                          length: parseInt(studentFormData.maxCourses) || 0,
                        }).map((_, index) => (
                          <div key={index}>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Course {index + 1} *
                            </label>
                            <select
                              value={
                                studentFormData.selectedCourses[index] || ""
                              }
                              onChange={(e) =>
                                handleCourseSelection(index, e.target.value)
                              }
                              className="input-field w-full"
                              required
                            >
                              <option value="">Select a course</option>
                              {availableCourses.map((course) => {
                                const courseId = course._id || course.id;
                                const isAlreadySelected =
                                  studentFormData.selectedCourses.some(
                                    (selected, idx) =>
                                      selected === courseId && idx !== index
                                  );
                                return (
                                  <option
                                    key={courseId}
                                    value={courseId}
                                    disabled={isAlreadySelected}
                                  >
                                    {course.name || course.courseName} (
                                    {course.code || course.courseCode})
                                    {isAlreadySelected
                                      ? " (Already selected)"
                                      : ""}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
            </>
          )}

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center space-x-2 px-8 py-3 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Completing Registration...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  <span>Complete Registration</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(
                  userType === "teacher" ? "teacherInfo" : "studentInfo"
                );
                navigate("/register");
              }}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConnectInstitute;
