import User from '../models/User.js';
import Course from '../models/Course.js';
import SelectedCourse from '../models/SelectedCourse.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET;

// Validate JWT_SECRET on module load
if (!JWT_SECRET) {
  console.error('⚠️  WARNING: JWT_SECRET is not set in environment variables!');
  console.error('⚠️  Login functionality will fail without JWT_SECRET.');
}

// ============= ADMIN CONTROLLERS =============

export const registerAdminMALS = async (req, res) => {
  try {
    const { username, password, labCapacity, classCapacity } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      $or: [
        { email: username.toLowerCase() },
        { name: username }
      ],
      role: 'admin'
    });

    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: 'Admin with this username already exists'
      });
    }

    // If username contains @, it's already an email, use it directly
    // Otherwise, append @admin.mals
    const adminEmail = username.includes('@') 
      ? username.toLowerCase() 
      : username.toLowerCase() + '@admin.mals';

    // Don't hash password here - User model's pre-save hook will handle it
    const admin = await User.create({
      name: username,
      email: adminEmail,
      password: password, // Pass plain password - pre-save hook will hash it
      role: 'admin', // Explicitly set role
      labCapacity: labCapacity || 60,
      classCapacity: classCapacity || 60,
      walletAddress: '' // Optional for MALS admin, can be set later if needed
    });

    // Verify admin was created with correct role
    console.log('✅ Admin created:', {
      id: admin._id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      isActive: admin.isActive
    });

    const token = jwt.sign({ userId: admin._id }, JWT_SECRET, { expiresIn: '24h' });

    return res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      token,
      data: {
        admin: {
          id: admin._id,
          username: admin.name,
          labCapacity: admin.labCapacity,
          classCapacity: admin.classCapacity
        }
      }
    });
  } catch (error) {
    console.error('Error registering admin:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `Admin with this ${field} already exists`
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to register admin',
      error: error.message
    });
  }
};

export const loginAdminMALS = async (req, res) => {
  try {
    console.log('🔐 Admin login attempt:', { username: req.body.username, timestamp: new Date().toISOString() });
    
    const { username, password } = req.body;

    if (!username || !password) {
      console.warn('⚠️  Admin login failed: Missing username or password');
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    if (!JWT_SECRET) {
      console.error('❌ JWT_SECRET is not configured!');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    // Normalize username - handle various formats
    const normalizedInput = username.toLowerCase().trim();
    const isEmail = normalizedInput.includes('@');
    
    // Build comprehensive search query
    const searchConditions = [
      { email: normalizedInput }, // Exact email match (lowercase)
      { name: username }, // Original case name
      { name: normalizedInput }, // Lowercase name
      { name: username.trim() } // Trimmed original
    ];
    
    // If it's an email but not @admin.mals, try extracting username part
    if (isEmail && !normalizedInput.includes('@admin.mals')) {
      const emailUsername = normalizedInput.split('@')[0];
      searchConditions.push(
        { name: emailUsername }, // Username part of email
        { email: emailUsername + '@admin.mals' } // Constructed admin email
      );
    } else if (!isEmail) {
      // If it's not an email, try with @admin.mals suffix
      searchConditions.push(
        { email: normalizedInput + '@admin.mals' }
      );
    } else if (normalizedInput.includes('@admin.mals')) {
      // If it has @admin.mals, also try without it
      const withoutSuffix = normalizedInput.replace('@admin.mals', '');
      searchConditions.push(
        { name: withoutSuffix },
        { email: withoutSuffix + '@admin.mals' }
      );
    }

    // Try multiple search strategies
    const admin = await User.findOne({ 
      $or: searchConditions,
      role: 'admin'
    }).select('+password');

    if (!admin) {
      console.log('Admin not found for username:', username);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials - Admin not found'
      });
    }

    // Check if password exists
    if (!admin.password) {
      console.error('❌ Admin has no password set:', admin.email);
      return res.status(500).json({
        success: false,
        message: 'Account configuration error'
      });
    }

    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      console.log('⚠️  Invalid password for admin:', admin.name);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials - Wrong password'
      });
    }

    const token = jwt.sign({ userId: admin._id }, JWT_SECRET, { expiresIn: '24h' });

    console.log('✅ Admin login successful:', { adminId: admin._id, email: admin.email });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: {
        admin: {
          id: admin._id,
          username: admin.name,
          name: admin.name,
          email: admin.email,
          labCapacity: admin.labCapacity,
          classCapacity: admin.classCapacity
        }
      }
    });
  } catch (error) {
    console.error('❌ Error logging in admin:', {
      error: error.message,
      stack: error.stack,
      username: req.body?.username,
      timestamp: new Date().toISOString()
    });
    return res.status(500).json({
      success: false,
      message: 'Failed to login admin',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export const createCourseMALS = async (req, res) => {
  try {
    const { courseName, courseCode, description, credits, instructor } = req.body;

    if (!courseName || !courseCode || !description || credits === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Course name, code, description, and credits are required'
      });
    }

    if (typeof credits !== 'number' || credits <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Credits must be a positive number'
      });
    }

    // Validate instructor if provided (optional)
    if (instructor) {
      const teacherExists = await User.findById(instructor);
      if (!teacherExists || teacherExists.role !== 'teacher') {
        return res.status(404).json({
          success: false,
          message: 'Instructor not found or is not a teacher'
        });
      }
    }

    const courseData = {
      name: courseName,
      courseName: courseName, // Set both for compatibility
      code: courseCode,
      courseCode: courseCode, // Set both for compatibility
      description,
      credits,
      ...(instructor && { 
        instructor,
        teacher: instructor // Support both fields
      })
    };

    const course = await Course.create(courseData);

    // Populate instructor only if it exists
    if (course.instructor) {
      await course.populate('instructor', 'name email department');
    }

    return res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: { course }
    });
  } catch (error) {
    console.error('Error creating course:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create course',
      error: error.message
    });
  }
};

export const updateAdminCapacity = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { labCapacity, classCapacity } = req.body;

    if (labCapacity !== undefined && (typeof labCapacity !== 'number' || labCapacity <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'labCapacity must be a positive number'
      });
    }

    if (classCapacity !== undefined && (typeof classCapacity !== 'number' || classCapacity <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'classCapacity must be a positive number'
      });
    }

    const updateData = {};
    if (labCapacity !== undefined) updateData.labCapacity = labCapacity;
    if (classCapacity !== undefined) updateData.classCapacity = classCapacity;

    const admin = await User.findByIdAndUpdate(adminId, updateData, { new: true });

    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Admin capacities updated successfully',
      data: {
        admin: {
          id: admin._id,
          username: admin.name,
          labCapacity: admin.labCapacity,
          classCapacity: admin.classCapacity
        }
      }
    });
  } catch (error) {
    console.error('Error updating admin capacities:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update admin capacities',
      error: error.message
    });
  }
};

export const getAdminProfileMALS = async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await User.findById(adminId)
      .select('-password')
      .populate('college.coursesOffered', 'name courseName code courseCode credits description');

    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        admin: {
          id: admin._id,
          username: admin.name,
          labCapacity: admin.labCapacity,
          classCapacity: admin.classCapacity
        }
      }
    });
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admin profile',
      error: error.message
    });
  }
};

export const getStudentFeedbacks = async (req, res) => {
  try {
    const studentsWithFeedback = await User.find({
      role: 'student',
      feedback: { $exists: true, $ne: null, $ne: '' }
    }).select('name email feedback');

    return res.status(200).json({
      success: true,
      data: {
        feedbacks: studentsWithFeedback.map((student) => ({
          studentId: student._id,
          studentName: student.name,
          feedback: student.feedback
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching student feedbacks:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch student feedbacks',
      error: error.message
    });
  }
};

export const registerCollege = async (req, res) => {
  try {
    const { adminId } = req.params;
    const {
      collegeName,
      collegeUniqueId,
      coursesOffered,
      programsOffered,
      classroomOccupancy,
      labOccupancy
    } = req.body;

    if (!collegeName || !collegeUniqueId) {
      return res.status(400).json({
        success: false,
        message: 'College name and unique ID are required'
      });
    }

    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Check if college unique ID already exists (for other admins)
    if (admin.college && admin.college.collegeUniqueId) {
      const existingAdmin = await User.findOne({
        'college.collegeUniqueId': collegeUniqueId,
        _id: { $ne: adminId }
      });
      if (existingAdmin) {
        return res.status(409).json({
          success: false,
          message: 'College with this unique ID already exists'
        });
      }
    }

    // Validate courses if provided
    if (coursesOffered && Array.isArray(coursesOffered)) {
      const validCourses = await Course.find({
        _id: { $in: coursesOffered }
      });
      if (validCourses.length !== coursesOffered.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more course IDs are invalid'
        });
      }
    }

    // Validate occupancy values
    if (classroomOccupancy !== undefined && (typeof classroomOccupancy !== 'number' || classroomOccupancy < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Classroom occupancy must be a non-negative number'
      });
    }

    if (labOccupancy !== undefined && (typeof labOccupancy !== 'number' || labOccupancy < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Lab occupancy must be a non-negative number'
      });
    }

    // Update admin with college information
    const updateData = {
      'college.collegeName': collegeName,
      'college.collegeUniqueId': collegeUniqueId,
      ...(coursesOffered && { 'college.coursesOffered': coursesOffered }),
      ...(programsOffered && { 'college.programsOffered': programsOffered }),
      ...(classroomOccupancy !== undefined && { 'college.classroomOccupancy': classroomOccupancy }),
      ...(labOccupancy !== undefined && { 'college.labOccupancy': labOccupancy })
    };

    const updatedAdmin = await User.findByIdAndUpdate(
      adminId,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .select('-password')
      .populate('college.coursesOffered', 'name courseName code courseCode credits description');

    return res.status(200).json({
      success: true,
      message: 'College registered/updated successfully',
      data: { admin: updatedAdmin }
    });
  } catch (error) {
    console.error('Error registering college:', error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'College with this unique ID already exists'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to register college',
      error: error.message
    });
  }
};

// ============= STUDENT CONTROLLERS =============

export const registerStudentMALS = async (req, res) => {
  try {
    const { 
      username, 
      password, 
      age, 
      gender, 
      Program, 
      collegeUniqueId,
      walletAddress,
      maxCourses,
      coursePreferences
    } = req.body;

    if (!username || !password || !age || !gender || !Program || !collegeUniqueId) {
      return res.status(400).json({
        success: false,
        message: 'All required student fields must be provided (username, password, age, gender, Program, collegeUniqueId)'
      });
    }

    // Validate wallet address for students
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address is required for students'
      });
    }

    // Validate that the college exists
    const collegeAdmin = await User.findOne({
      'college.collegeUniqueId': collegeUniqueId,
      role: 'admin'
    });

    if (!collegeAdmin) {
      return res.status(404).json({
        success: false,
        message: 'College with this unique ID does not exist. Please check the college ID.'
      });
    }

    // If username contains @, it's already an email, use it directly
    // Otherwise, append @student.mals
    const studentEmail = username.includes('@') 
      ? username.toLowerCase() 
      : username.toLowerCase() + '@student.mals';

    const existingStudent = await User.findOne({
      $or: [
        { email: studentEmail },
        { name: username }
      ],
      role: 'student'
    });

    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: 'Student with this username already exists'
      });
    }

    // Don't hash password here - User model's pre-save hook will handle it
    const student = await User.create({
      name: username,
      email: studentEmail,
      password: password, // Pass plain password - pre-save hook will hash it
      role: 'student',
      age,
      gender,
      Program,
      collegeUniqueId,
      walletAddress, // Required for students
      ...(maxCourses && { maxCourses: parseInt(maxCourses) }),
      ...(coursePreferences && Array.isArray(coursePreferences) && coursePreferences.length > 0 && { coursePreferences })
    });

    const token = jwt.sign({ userId: student._id }, JWT_SECRET, { expiresIn: '24h' });

    return res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      token,
      data: {
        student: {
          id: student._id,
          username: student.name,
          age: student.age,
          gender: student.gender,
          program: student.Program,
          feedback: student.feedback || null,
          walletAddress: student.walletAddress
        }
      }
    });
  } catch (error) {
    console.error('Error registering student:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to register student',
      error: error.message
    });
  }
};

export const loginStudentMALS = async (req, res) => {
  try {
    console.log('🔐 Student login attempt:', { username: req.body.username, timestamp: new Date().toISOString() });
    
    const { username, password } = req.body;

    if (!username || !password) {
      console.warn('⚠️  Student login failed: Missing username or password');
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    if (!JWT_SECRET) {
      console.error('❌ JWT_SECRET is not configured!');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    // Normalize username - handle both email and username formats
    const normalizedUsername = username.toLowerCase();
    const isEmail = normalizedUsername.includes('@');
    
    // Build search query - try multiple formats
    const searchQuery = {
      role: 'student',
      $or: [
        { email: normalizedUsername }, // Exact email match
        { name: normalizedUsername }, // Exact name match
        { name: username } // Original case name match
      ]
    };
    
    // If it looks like an email, also try without @student.mals suffix
    if (isEmail && normalizedUsername.includes('@student.mals')) {
      const usernamePart = normalizedUsername.replace('@student.mals', '');
      searchQuery.$or.push(
        { email: usernamePart + '@student.mals' },
        { name: usernamePart }
      );
    } else if (isEmail) {
      // If it's an email but not @student.mals, use as-is
      searchQuery.$or.push({ email: normalizedUsername });
    }

    const student = await User.findOne(searchQuery).select('+password');

    if (!student) {
      console.log('Student not found for username:', username, 'Search query:', searchQuery);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials - Student not found'
      });
    }

    // Check if password exists
    if (!student.password) {
      console.error('❌ Student has no password set:', student.email);
      return res.status(500).json({
        success: false,
        message: 'Account configuration error'
      });
    }

    const isPasswordValid = await student.comparePassword(password);
    if (!isPasswordValid) {
      console.log('⚠️  Invalid password for student:', student.email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials - Wrong password'
      });
    }

    const token = jwt.sign({ userId: student._id }, JWT_SECRET, { expiresIn: '24h' });

    console.log('✅ Student login successful:', { studentId: student._id, email: student.email });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: {
        student: {
          id: student._id,
          username: student.name,
          name: student.name,
          email: student.email,
          age: student.age,
          gender: student.gender,
          program: student.Program,
          feedback: student.feedback || null,
          walletAddress: student.walletAddress
        }
      }
    });
  } catch (error) {
    console.error('❌ Error logging in student:', {
      error: error.message,
      stack: error.stack,
      username: req.body?.username,
      timestamp: new Date().toISOString()
    });
    return res.status(500).json({
      success: false,
      message: 'Failed to login student',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export const getStudentProfileMALS = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await User.findById(studentId)
      .select('-password')
      .populate('malsSelectedCourses');

    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: { student }
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch student profile',
      error: error.message
    });
  }
};

export const updateStudentProfileMALS = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { username, password, age, gender, Program, feedback } = req.body;

    const updatePayload = {};

    if (username) {
      const usernameExists = await User.findOne({
        $or: [
          { email: username.toLowerCase() },
          { name: username }
        ],
        _id: { $ne: studentId }
      });
      if (usernameExists) {
        return res.status(409).json({
          success: false,
          message: 'Username already in use'
        });
      }
      updatePayload.name = username;
      updatePayload.email = username.toLowerCase() + '@student.mals';
    }
    if (password) {
      // Don't hash here - we'll use save() which triggers pre-save hook
      updatePayload.password = password;
    }
    if (age !== undefined) {
      if (typeof age !== 'number' || age <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Age must be a positive number'
        });
      }
      updatePayload.age = age;
    }
    if (gender) {
      updatePayload.gender = gender;
    }
    if (Program) {
      updatePayload.Program = Program;
    }
    if (feedback !== undefined) {
      if (feedback && feedback.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Feedback cannot exceed 100 characters'
        });
      }
      updatePayload.feedback = feedback;
    }

    // Use findById + save() instead of findByIdAndUpdate to trigger pre-save hook for password hashing
    const student = await User.findById(studentId);

    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Update fields
    Object.keys(updatePayload).forEach(key => {
      student[key] = updatePayload[key];
    });

    // Save to trigger pre-save hook (which will hash password if modified)
    await student.save();

    // Get updated student without password
    const updatedStudent = await User.findById(studentId)
      .select('-password')
      .populate('malsSelectedCourses');

    return res.status(200).json({
      success: true,
      message: 'Student profile updated successfully',
      data: { student: updatedStudent }
    });
  } catch (error) {
    console.error('Error updating student profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update student profile',
      error: error.message
    });
  }
};

export const submitStudentFeedback = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { feedback } = req.body;

    if (!feedback) {
      return res.status(400).json({
        success: false,
        message: 'Feedback is required'
      });
    }

    if (feedback.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Feedback cannot exceed 100 characters'
      });
    }

    const student = await User.findByIdAndUpdate(
      studentId,
      { feedback },
      { new: true, runValidators: true }
    ).select('-password');

    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: { student }
    });
  } catch (error) {
    console.error('Error submitting student feedback:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error.message
    });
  }
};

export const selectStudentCourses = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { major1, major2, minor1, minor2, lab1, lab2 } = req.body;

    if (!major1 || !major2 || !minor1 || !minor2 || !lab1 || !lab2) {
      return res.status(400).json({
        success: false,
        message: 'All course selections are required'
      });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const selectedCourse = await SelectedCourse.create({
      studentId,
      major1,
      major2,
      minor1,
      minor2,
      lab1,
      lab2
    });

    // Store reference in user model
    if (!student.malsSelectedCourses) {
      student.malsSelectedCourses = [];
    }
    student.malsSelectedCourses.push(selectedCourse._id);
    await student.save();

    return res.status(201).json({
      success: true,
      message: 'Courses selected successfully',
      data: { selectedCourse }
    });
  } catch (error) {
    console.error('Error selecting student courses:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to select courses',
      error: error.message
    });
  }
};

export const getStudentSelectedCourses = async (req, res) => {
  try {
    const { studentId } = req.params;

    const selectedCourses = await SelectedCourse.find({ studentId });

    return res.status(200).json({
      success: true,
      data: { selectedCourses }
    });
  } catch (error) {
    console.error('Error fetching student selected courses:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch selected courses',
      error: error.message
    });
  }
};

// ============= TEACHER CONTROLLERS =============

export const registerTeacherMALS = async (req, res) => {
  try {
    const { username, password, name, experience, department, workingHour, collegeUniqueId } = req.body;

    if (!username || !password || !name || experience === undefined || !department || workingHour === undefined || !collegeUniqueId) {
      return res.status(400).json({
        success: false,
        message: 'All required teacher fields must be provided (username, password, name, experience, department, workingHour, collegeUniqueId)'
      });
    }

    // Validate that the college exists
    const collegeAdmin = await User.findOne({
      'college.collegeUniqueId': collegeUniqueId,
      role: 'admin'
    });

    if (!collegeAdmin) {
      return res.status(404).json({
        success: false,
        message: 'College with this unique ID does not exist. Please check the college ID.'
      });
    }

    const existingTeacher = await User.findOne({
      $or: [
        { email: username.toLowerCase() },
        { name: username }
      ],
      role: 'teacher'
    });

    if (existingTeacher) {
      return res.status(409).json({
        success: false,
        message: 'Teacher with this username already exists'
      });
    }

    if (typeof experience !== 'number' || experience < 0) {
      return res.status(400).json({
        success: false,
        message: 'Experience must be a non-negative number'
      });
    }

    if (typeof workingHour !== 'number' || workingHour <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Working hour must be a positive number'
      });
    }

    // If username contains @, it's already an email, use it directly
    // Otherwise, append @teacher.mals
    const teacherEmail = username.includes('@') 
      ? username.toLowerCase() 
      : username.toLowerCase() + '@teacher.mals';

    // Don't hash password here - User model's pre-save hook will handle it
    const teacher = await User.create({
      name: name || username,
      email: teacherEmail,
      password: password, // Pass plain password - pre-save hook will hash it
      role: 'teacher',
      experience,
      department,
      workingHour,
      collegeUniqueId
    });

    const token = jwt.sign({ userId: teacher._id }, JWT_SECRET, { expiresIn: '24h' });

    return res.status(201).json({
      success: true,
      message: 'Teacher registered successfully',
      token,
      data: {
        teacher: {
          id: teacher._id,
          username: teacher.name,
          name: teacher.name,
          experience: teacher.experience,
          department: teacher.department,
          workingHour: teacher.workingHour
        }
      }
    });
  } catch (error) {
    console.error('Error registering teacher:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to register teacher',
      error: error.message
    });
  }
};

export const loginTeacherMALS = async (req, res) => {
  try {
    console.log('🔐 Teacher login attempt:', { username: req.body.username, timestamp: new Date().toISOString() });
    
    const { username, password } = req.body;

    if (!username || !password) {
      console.warn('⚠️  Teacher login failed: Missing username or password');
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    if (!JWT_SECRET) {
      console.error('❌ JWT_SECRET is not configured!');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    // Normalize username - handle both email and username formats
    const normalizedUsername = username.toLowerCase().trim();
    const isEmail = normalizedUsername.includes('@');
    
    // Build search query - try multiple formats
    const searchQuery = {
      role: 'teacher',
      $or: [
        { email: normalizedUsername }, // Exact email match
        { name: normalizedUsername }, // Exact name match (lowercase)
        { name: username.trim() } // Original case name match
      ]
    };
    
    // If it looks like an email, also try without @teacher.mals suffix
    if (isEmail && normalizedUsername.includes('@teacher.mals')) {
      const usernamePart = normalizedUsername.replace('@teacher.mals', '');
      searchQuery.$or.push(
        { email: usernamePart + '@teacher.mals' },
        { name: usernamePart }
      );
    } else if (isEmail) {
      // If it's an email but not @teacher.mals, use as-is
      searchQuery.$or.push({ email: normalizedUsername });
    } else {
      // If it's not an email, also try with @teacher.mals suffix
      searchQuery.$or.push({ email: normalizedUsername + '@teacher.mals' });
    }

    const teacher = await User.findOne(searchQuery).select('+password');

    if (!teacher) {
      console.log('Teacher not found for username:', username, 'Search query:', searchQuery);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials - Teacher not found'
      });
    }

    // Check if password exists
    if (!teacher.password) {
      console.error('❌ Teacher has no password set:', teacher.email);
      return res.status(500).json({
        success: false,
        message: 'Account configuration error'
      });
    }

    const isPasswordValid = await teacher.comparePassword(password);
    if (!isPasswordValid) {
      console.log('⚠️  Invalid password for teacher:', teacher.email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials - Wrong password'
      });
    }

    const token = jwt.sign({ userId: teacher._id }, JWT_SECRET, { expiresIn: '24h' });

    console.log('✅ Teacher login successful:', { teacherId: teacher._id, email: teacher.email });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: {
        teacher: {
          id: teacher._id,
          username: teacher.name,
          name: teacher.name,
          email: teacher.email,
          experience: teacher.experience,
          department: teacher.department,
          workingHour: teacher.workingHour,
          collegeUniqueId: teacher.collegeUniqueId
        }
      }
    });
  } catch (error) {
    console.error('❌ Error logging in teacher:', {
      error: error.message,
      stack: error.stack,
      username: req.body?.username,
      timestamp: new Date().toISOString()
    });
    return res.status(500).json({
      success: false,
      message: 'Failed to login teacher',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export const getTeacherProfileMALS = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const teacher = await User.findById(teacherId).select('-password');

    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: { teacher }
    });
  } catch (error) {
    console.error('Error fetching teacher profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch teacher profile',
      error: error.message
    });
  }
};

export const updateTeacherProfileMALS = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { username, password, name, experience, department, workingHour } = req.body;

    const updatePayload = {};

    if (username) {
      const usernameExists = await User.findOne({
        $or: [
          { email: username.toLowerCase() },
          { name: username }
        ],
        _id: { $ne: teacherId }
      });
      if (usernameExists) {
        return res.status(409).json({
          success: false,
          message: 'Username already in use'
        });
      }
      updatePayload.name = username;
      updatePayload.email = username.toLowerCase() + '@teacher.mals';
    }

    if (password) {
      // Don't hash here - we'll use save() which triggers pre-save hook
      updatePayload.password = password;
    }

    if (name) {
      updatePayload.name = name;
    }

    if (experience !== undefined) {
      if (typeof experience !== 'number' || experience < 0) {
        return res.status(400).json({
          success: false,
          message: 'Experience must be a non-negative number'
        });
      }
      updatePayload.experience = experience;
    }

    if (department) {
      updatePayload.department = department;
    }

    if (workingHour !== undefined) {
      if (typeof workingHour !== 'number' || workingHour <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Working hour must be a positive number'
        });
      }
      updatePayload.workingHour = workingHour;
    }

    // Use findById + save() instead of findByIdAndUpdate to trigger pre-save hook for password hashing
    const teacher = await User.findById(teacherId);

    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Update fields
    Object.keys(updatePayload).forEach(key => {
      teacher[key] = updatePayload[key];
    });

    // Save to trigger pre-save hook (which will hash password if modified)
    await teacher.save();

    // Get updated teacher without password
    const updatedTeacher = await User.findById(teacherId)
      .select('-password');

    return res.status(200).json({
      success: true,
      message: 'Teacher profile updated successfully',
      data: { teacher: updatedTeacher }
    });
  } catch (error) {
    console.error('Error updating teacher profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update teacher profile',
      error: error.message
    });
  }
};

export const getTeacherCoursesMALS = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    const courses = await Course.find({
      $or: [
        { instructor: teacherId },
        { teacher: teacherId }
      ]
    }).populate('instructor', 'name email department')
      .populate('teacher', 'name email department');

    return res.status(200).json({
      success: true,
      data: { courses }
    });
  } catch (error) {
    console.error('Error fetching teacher courses:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch teacher courses',
      error: error.message
    });
  }
};

export const getAllTeachersMALS = async (req, res) => {
  try {
    const { collegeId, adminId } = req.query;
    
    let query = { role: 'teacher' };
    
    // If adminId is provided, filter teachers by college courses
    // (teachers who teach courses in that admin's college)
    if (adminId) {
      const admin = await User.findById(adminId).select('college');
      if (admin && admin.college && admin.college.coursesOffered && admin.college.coursesOffered.length > 0) {
        // Get teachers who are instructors of courses in this college
        const courses = await Course.find({
          _id: { $in: admin.college.coursesOffered }
        }).select('instructor teacher');
        
        const teacherIds = new Set();
        courses.forEach(course => {
          if (course.instructor) teacherIds.add(course.instructor.toString());
          if (course.teacher) teacherIds.add(course.teacher.toString());
        });
        
        if (teacherIds.size > 0) {
          query._id = { $in: Array.from(teacherIds) };
        }
      }
    }

    const teachers = await User.find(query).select('-password').sort({ name: 1 });

    return res.status(200).json({
      success: true,
      data: {
        teachers: teachers.map(teacher => ({
          id: teacher._id,
          username: teacher.name,
          name: teacher.name,
          experience: teacher.experience,
          department: teacher.department,
          workingHour: teacher.workingHour
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching all teachers:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch teachers',
      error: error.message
    });
  }
};

// Get all students (for admin use)
export const getAllStudentsMALS = async (req, res) => {
  try {
    const { adminId, collegeUniqueId } = req.query;
    
    let query = { role: 'student', isActive: true };
    
    // If adminId or collegeUniqueId is provided, filter students by college
    if (adminId || collegeUniqueId) {
      let targetCollegeId = collegeUniqueId;
      
      if (adminId && !collegeUniqueId) {
        const admin = await User.findById(adminId).select('college.collegeUniqueId');
        if (admin && admin.college && admin.college.collegeUniqueId) {
          targetCollegeId = admin.college.collegeUniqueId;
        }
      }
      
      if (targetCollegeId) {
        query.collegeUniqueId = targetCollegeId;
      }
    }

    const students = await User.find(query)
      .select('-password')
      .sort({ name: 1 })
      .populate('enrolledCourses', 'name code');

    return res.status(200).json({
      success: true,
      data: {
        students: students.map(student => ({
          _id: student._id,
          id: student._id,
          name: student.name,
          email: student.email,
          walletAddress: student.walletAddress,
          tokenBalance: student.tokenBalance,
          Program: student.Program,
          age: student.age,
          gender: student.gender,
          enrolledCourses: student.enrolledCourses || []
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching all students:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch students',
      error: error.message
    });
  }
};

