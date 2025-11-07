import Course from '../models/Course.js';
import User from '../models/User.js';

// Create course (Admin only)
export const createCourse = async (req, res) => {
  try {
    const { name, code, description, priority, tokensPerAttendance, teacherId } = req.body;

    // Validate required fields
    if (!name || !code || !teacherId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide course name, code, and teacher'
      });
    }

    // Check if teacher exists
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(400).json({
        success: false,
        message: 'Invalid teacher ID'
      });
    }

    // Check if course code already exists
    const existingCourse = await Course.findOne({ code });
    if (existingCourse) {
      return res.status(400).json({
        success: false,
        message: 'Course code already exists'
      });
    }

    // Create course
    const course = await Course.create({
      name,
      code,
      description,
      priority: priority || 1,
      tokensPerAttendance: tokensPerAttendance || 10,
      teacher: teacherId
    });

    await course.populate('teacher', 'name email');

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: { course }
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating course',
      error: error.message
    });
  }
};

// Get all courses
export const getCourses = async (req, res) => {
  try {
    const { teacherId, studentId } = req.query;
    
    let query = { isActive: true };
    
    if (teacherId) {
      query.teacher = teacherId;
    }
    
    if (studentId) {
      query.students = studentId;
    }

    const courses = await Course.find(query)
      .populate('teacher', 'name email')
      .populate('students', 'name email walletAddress')
      .sort('-createdAt');

    res.json({
      success: true,
      data: { courses }
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching courses',
      error: error.message
    });
  }
};

// Get course by ID
export const getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teacher', 'name email')
      .populate('students', 'name email walletAddress tokenBalance');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      data: { course }
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course',
      error: error.message
    });
  }
};

// Enroll student in course
export const enrollStudent = async (req, res) => {
  try {
    const { courseId, studentId } = req.body;

    // Validate input
    if (!courseId || !studentId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide course and student IDs'
      });
    }

    // Check if student exists
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID'
      });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if already enrolled
    if (course.students.includes(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Student already enrolled in this course'
      });
    }

    // Enroll student
    course.students.push(studentId);
    await course.save();

    // Add course to student's enrolled courses
    student.enrolledCourses.push(courseId);
    await student.save();

    await course.populate('students', 'name email walletAddress');

    res.json({
      success: true,
      message: 'Student enrolled successfully',
      data: { course }
    });
  } catch (error) {
    console.error('Enroll student error:', error);
    res.status(500).json({
      success: false,
      message: 'Error enrolling student',
      error: error.message
    });
  }
};

// Update course
export const updateCourse = async (req, res) => {
  try {
    const { name, description, priority, tokensPerAttendance } = req.body;

    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Update fields
    if (name) course.name = name;
    if (description) course.description = description;
    if (priority) course.priority = priority;
    if (tokensPerAttendance) course.tokensPerAttendance = tokensPerAttendance;

    await course.save();
    await course.populate('teacher', 'name email');

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: { course }
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating course',
      error: error.message
    });
  }
};