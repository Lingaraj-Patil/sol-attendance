import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// Register new user (unified system)
export const register = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      role, 
      walletAddress,
      // Student fields
      age,
      gender,
      Program,
      feedback,
      maxCourses,
      coursePreferences,
      // Teacher fields
      experience,
      department,
      workingHour,
      // Admin fields
      labCapacity,
      classCapacity,
      // Timetable fields
      availability,
      interests,
      preferredTimeSlots
    } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Validate wallet for students and admin
    if ((role === 'student' || role === 'admin') && !walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address is required for students and admin'
      });
    }

    // Create user with unified schema
    const userData = {
      name,
      email,
      password,
      role,
      walletAddress
    };

    // Add student-specific fields
    if (role === 'student') {
      if (age !== undefined) userData.age = age;
      if (gender) userData.gender = gender;
      if (Program) userData.Program = Program;
      if (feedback) userData.feedback = feedback;
      if (maxCourses !== undefined) userData.maxCourses = maxCourses;
      if (coursePreferences) userData.coursePreferences = coursePreferences;
    }

    // Add teacher-specific fields
    if (role === 'teacher') {
      if (experience !== undefined) userData.experience = experience;
      if (department) userData.department = department;
      if (workingHour !== undefined) userData.workingHour = workingHour;
    }

    // Add admin-specific fields
    if (role === 'admin') {
      if (labCapacity !== undefined) userData.labCapacity = labCapacity;
      if (classCapacity !== undefined) userData.classCapacity = classCapacity;
    }

    // Add timetable-related fields (for students and teachers)
    if (role === 'student' || role === 'teacher') {
      if (availability) userData.availability = availability;
      if (interests) userData.interests = interests;
      if (preferredTimeSlots) userData.preferredTimeSlots = preferredTimeSlots;
    }

    const user = await User.create(userData);

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          walletAddress: user.walletAddress
        },
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    console.log('🔐 Unified login attempt:', { email: req.body.email, timestamp: new Date().toISOString() });
    
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      console.warn('⚠️  Unified login failed: Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET is not configured!');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    // Normalize input - handle both email and username formats
    const normalizedInput = email.toLowerCase().trim();
    const originalInput = email.trim();
    const isEmail = normalizedInput.includes('@');
    
    // Build comprehensive search query to handle all user types and formats
    // Start with the most likely matches first
    const searchConditions = [];
    
    // 1. Exact email match (most common case) - email field is automatically lowercased by MongoDB
    searchConditions.push({ email: normalizedInput });
    
    // 2. Name matches (case-insensitive using regex for better matching)
    searchConditions.push({ name: { $regex: new RegExp(`^${originalInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
    searchConditions.push({ name: normalizedInput });
    
    // 3. Handle various email formats for different roles
    if (isEmail) {
      // If it's an email, try different role-specific formats
      if (normalizedInput.includes('@admin.mals')) {
        const usernamePart = normalizedInput.replace('@admin.mals', '');
        searchConditions.push(
          { name: { $regex: new RegExp(`^${usernamePart}$`, 'i') } },
          { email: usernamePart + '@admin.mals' }
        );
      } else if (normalizedInput.includes('@teacher.mals')) {
        const usernamePart = normalizedInput.replace('@teacher.mals', '');
        searchConditions.push(
          { name: { $regex: new RegExp(`^${usernamePart}$`, 'i') } },
          { email: usernamePart + '@teacher.mals' }
        );
      } else if (normalizedInput.includes('@student.mals')) {
        const usernamePart = normalizedInput.replace('@student.mals', '');
        searchConditions.push(
          { name: { $regex: new RegExp(`^${usernamePart}$`, 'i') } },
          { email: usernamePart + '@student.mals' }
        );
      } else {
        // Regular email (like user@gmail.com) - try extracting username part for all roles
        const emailUsername = normalizedInput.split('@')[0];
        searchConditions.push(
          { name: { $regex: new RegExp(`^${emailUsername}$`, 'i') } },
          { email: emailUsername + '@admin.mals' },
          { email: emailUsername + '@teacher.mals' },
          { email: emailUsername + '@student.mals' }
        );
      }
    } else {
      // If it's not an email (just username), try with role-specific suffixes
      searchConditions.push(
        { email: normalizedInput + '@admin.mals' },
        { email: normalizedInput + '@teacher.mals' },
        { email: normalizedInput + '@student.mals' }
      );
    }

    // Remove duplicates from searchConditions
    const uniqueConditions = [];
    const seen = new Set();
    for (const condition of searchConditions) {
      const key = JSON.stringify(condition);
      if (!seen.has(key)) {
        seen.add(key);
        uniqueConditions.push(condition);
      }
    }

    console.log('🔍 Searching for user with conditions:', JSON.stringify(uniqueConditions, null, 2));

    // Try to find user with role priority:
    // 1. First try admin (if input suggests admin)
    // 2. Then try teacher (if input suggests teacher)
    // 3. Then try student (if input suggests student)
    // 4. Finally try all roles
    
    let user = null;
    
    // Determine likely role from input (reuse normalizedInput from above)
    // Priority: Check for explicit role indicators first
    const isAdminEmail = normalizedInput.includes('@admin.mals');
    const isTeacherEmail = normalizedInput.includes('@teacher.mals');
    const isStudentEmail = normalizedInput.includes('@student.mals');
    
    // Try role-specific search first (prioritize by input format)
    // Always try admin first if it's an admin email, or if it's a regular email/username (admin is most common)
    if (isAdminEmail || (!isTeacherEmail && !isStudentEmail)) {
      console.log('🔍 Trying admin role first (priority)...');
      user = await User.findOne({ 
        $or: uniqueConditions,
        role: 'admin'
      }).select('+password');
      
      if (user) {
        console.log('✅ Found admin user:', user.email);
      }
    }
    
    if (!user && isTeacherEmail) {
      console.log('🔍 Trying teacher role...');
      user = await User.findOne({ 
        $or: uniqueConditions,
        role: 'teacher'
      }).select('+password');
      
      if (user) {
        console.log('✅ Found teacher user:', user.email);
      }
    }
    
    if (!user && isStudentEmail) {
      console.log('🔍 Trying student role...');
      user = await User.findOne({ 
        $or: uniqueConditions,
        role: 'student'
      }).select('+password');
      
      if (user) {
        console.log('✅ Found student user:', user.email);
      }
    }
    
    // If no role-specific match, try all roles (fallback) - but log warning
    if (!user) {
      console.log('⚠️  No role-specific match found, trying all roles (fallback)...');
      user = await User.findOne({ 
        $or: uniqueConditions
      }).select('+password');
      
      if (user) {
        console.log('⚠️  Found user without role filter:', { email: user.email, role: user.role });
      }
    }
    
    if (!user) {
      console.log('⚠️  User not found for input:', email);
      console.log('⚠️  Tried', uniqueConditions.length, 'search conditions');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('✅ User found:', { id: user._id, email: user.email, name: user.name, role: user.role });

    // Check if password exists
    if (!user.password) {
      console.error('❌ User has no password set:', email);
      return res.status(500).json({
        success: false,
        message: 'Account configuration error'
      });
    }

    // Check password
    console.log('🔐 Comparing password for user:', user.email);
    console.log('🔐 Password hash in DB (first 20 chars):', user.password ? user.password.substring(0, 20) + '...' : 'NULL');
    
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      console.log('⚠️  Unified login failed: Invalid password for user:', user.email);
      console.log('⚠️  This might be due to double-hashed password. User may need to reset password.');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    console.log('✅ Password validated successfully for user:', user.email);

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    console.log('✅ Unified login successful:', { userId: user._id, email: user.email, role: user.role });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          walletAddress: user.walletAddress,
          tokenBalance: user.tokenBalance
        },
        token
      }
    });
  } catch (error) {
    console.error('❌ Unified login error:', {
      error: error.message,
      stack: error.stack,
      email: req.body?.email,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('enrolledCourses', 'name code');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('📋 Get current user - User details:', {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          walletAddress: user.walletAddress,
          tokenBalance: user.tokenBalance,
          enrolledCourses: user.enrolledCourses
        }
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};