import Timetable from '../models/Timetable.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import axios from 'axios';

const TIMETABLE_API_URL = 'https://timetable-generator-3-iadp.onrender.com';

// Auto-generate timetable from user data
export const autoGenerateTimetable = async (req, res) => {
  try {
    const adminId = req.user._id;
    const { name, semester, academicYear, timeLimit } = req.body;

    // Get all students and teachers with their availability and interests
    const students = await User.find({ 
      role: 'student', 
      isActive: true,
      availability: { $exists: true, $ne: [] }
    }).select('name email availability interests preferredTimeSlots maxCourses coursePreferences');

    const teachers = await User.find({ 
      role: 'teacher', 
      isActive: true,
      availability: { $exists: true, $ne: [] }
    }).select('name email availability interests department experience');

    const courses = await Course.find({ isActive: true }).select('name code credits description');

    if (students.length === 0 || teachers.length === 0 || courses.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient data. Need at least one student, one teacher, and one course with availability data.'
      });
    }

    // Collect all unique time slots from user availability
    const allTimeSlots = new Set();
    students.forEach(s => s.availability.forEach(slot => allTimeSlots.add(slot)));
    teachers.forEach(t => t.availability.forEach(slot => allTimeSlots.add(slot)));

    if (allTimeSlots.size === 0) {
      return res.status(400).json({
        success: false,
        message: 'No availability data found. Users need to set their availability during registration.'
      });
    }

    // Prepare input data for timetable generator (matching API schema)
    const inputData = {
      time_slots: Array.from(allTimeSlots).sort(),
      time_limit: timeLimit || 10,
      courses: courses.map(course => {
        // Get all student groups that should take this course
        const relevantGroups = students
          .filter(s => {
            const prefs = s.coursePreferences || [];
            return prefs.some(cp => (cp.courseCode || cp.course_code) === (course.code || course.courseCode)) ||
                   (!prefs.length && course.isActive);
          })
          .map(s => `G${s._id.toString().slice(-6)}`);
        
        return {
          course_code: course.code || course.courseCode,
          name: course.name || course.courseName,
          credit_hours: course.credits || 3,
          course_track: 'Major', // Default to Major, can be updated later
          components: {
            theory: course.credits || 3, // Default all to theory hours
            ...(course.credits > 3 && { lab: 1 }) // Add lab if credits > 3
          },
          student_groups: relevantGroups.length > 0 ? relevantGroups : [`G${students[0]?._id.toString().slice(-6)}`],
          lab_required: course.credits > 3 || false
        };
      }),
      faculty: teachers.map((teacher) => ({
        faculty_id: teacher._id.toString(),
        name: teacher.name,
        expertise: teacher.interests.length > 0 ? teacher.interests : [teacher.department || 'General'],
        available_slots: teacher.availability.length > 0 ? teacher.availability : Array.from(allTimeSlots),
        max_hours_per_week: teacher.workingHour || 20 // Default to 20 if not set
      })),
      rooms: [
        {
          room_id: 'R101',
          type: 'theory',
          capacity: 60,
          available_slots: Array.from(allTimeSlots)
        },
        {
          room_id: 'LAB1',
          type: 'lab',
          capacity: 32,
          available_slots: Array.from(allTimeSlots)
        }
      ],
      student_groups: students.map((student) => ({
        group_id: `G${student._id.toString().slice(-6)}`,
        students: [student._id.toString()],
        course_choices: {
          major: student.coursePreferences.length > 0 
            ? student.coursePreferences.map(cp => cp.courseCode || cp.course_code).filter(Boolean)
            : courses.slice(0, student.maxCourses || 5).map(c => c.code || c.courseCode).filter(Boolean),
          minor: [],
          skill: []
        }
      }))
    };

    // Call external timetable generator API
    let generatedData;
    try {
      const response = await axios.post(`${TIMETABLE_API_URL}/api/generate`, inputData, {
        timeout: 120000
      });
      generatedData = response.data;
    } catch (apiError) {
      console.error('External API error:', apiError);
      return res.status(500).json({
        success: false,
        message: apiError.response?.data?.message || 'Failed to generate timetable from external API',
        error: apiError.message
      });
    }

    // Save timetable to database
    const timetable = new Timetable({
      name: name || `Auto-Generated Timetable ${new Date().toISOString()}`,
      semester,
      academicYear,
      inputData,
      generatedData,
      assignments: generatedData.assignments || {},
      facultyTimetables: generatedData.faculty_timetables || {},
      studentTimetables: generatedData.student_timetables || {},
      violations: generatedData.violations || [],
      metadata: generatedData.metadata || {},
      createdBy: adminId,
      isActive: true // Auto-activate
    });

    // Deactivate other timetables
    await Timetable.updateMany(
      { _id: { $ne: timetable._id } },
      { $set: { isActive: false } }
    );

    await timetable.save();

    res.json({
      success: true,
      message: 'Timetable auto-generated successfully from user data',
      data: { timetable }
    });
  } catch (error) {
    console.error('Auto-generate timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to auto-generate timetable',
      error: error.message
    });
  }
};

// Generate timetable using external API
export const generateTimetable = async (req, res) => {
  try {
    const { inputData, name, semester, academicYear } = req.body;
    const adminId = req.user._id;

    // Validate input
    if (!inputData) {
      return res.status(400).json({
        success: false,
        message: 'Input data is required'
      });
    }

    // Call external timetable generator API
    let generatedData;
    try {
      const response = await axios.post(`${TIMETABLE_API_URL}/api/generate`, inputData, {
        timeout: 120000 // 120 seconds timeout for large timetables
      });
      generatedData = response.data;
    } catch (apiError) {
      console.error('External API error:', apiError);
      return res.status(500).json({
        success: false,
        message: apiError.response?.data?.message || 'Failed to generate timetable from external API',
        error: apiError.message
      });
    }

    // Save timetable to database
    const timetable = new Timetable({
      name: name || `Timetable ${new Date().toISOString()}`,
      semester,
      academicYear,
      inputData,
      generatedData,
      assignments: generatedData.assignments || {},
      facultyTimetables: generatedData.faculty_timetables || {},
      studentTimetables: generatedData.student_timetables || {},
      violations: generatedData.violations || [],
      metadata: generatedData.metadata || {},
      createdBy: adminId
    });

    await timetable.save();

    res.json({
      success: true,
      message: 'Timetable generated successfully',
      data: { timetable }
    });
  } catch (error) {
    console.error('Generate timetable error:', error);
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || 'Failed to generate timetable',
      error: error.message
    });
  }
};

// Validate timetable input
export const validateTimetableInput = async (req, res) => {
  try {
    const { inputData } = req.body;

    if (!inputData) {
      return res.status(400).json({
        success: false,
        message: 'Input data is required'
      });
    }

    const response = await axios.post(`${TIMETABLE_API_URL}/api/validate`, inputData);

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Validate timetable error:', error);
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || 'Validation failed',
      error: error.message
    });
  }
};

// Get all timetables
export const getTimetables = async (req, res) => {
  try {
    const { isActive } = req.query;
    let query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const timetables = await Timetable.find(query)
      .populate('createdBy', 'name email')
      .sort('-createdAt');

    res.json({
      success: true,
      data: { timetables }
    });
  } catch (error) {
    console.error('Get timetables error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching timetables',
      error: error.message
    });
  }
};

// Get active timetable
export const getActiveTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findOne({ isActive: true })
      .populate('createdBy', 'name email');

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'No active timetable found'
      });
    }

    res.json({
      success: true,
      data: { timetable }
    });
  } catch (error) {
    console.error('Get active timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active timetable',
      error: error.message
    });
  }
};

// Get timetable by ID
export const getTimetable = async (req, res) => {
  try {
    const { id } = req.params;

    const timetable = await Timetable.findById(id)
      .populate('createdBy', 'name email');

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found'
      });
    }

    res.json({
      success: true,
      data: { timetable }
    });
  } catch (error) {
    console.error('Get timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching timetable',
      error: error.message
    });
  }
};

// Get timetable for user (student or teacher)
export const getUserTimetable = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = req.user;

    // Verify user can access this timetable
    // Allow access if userId matches user's ID or user is admin
    const userIdStr = userId.toString();
    const userIdStr2 = user._id?.toString() || user.id?.toString();
    
    if (userIdStr !== userIdStr2 && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get active timetable (or most recent if none is active)
    let timetable = await Timetable.findOne({ isActive: true });
    
    // If no active timetable, get the most recent one
    if (!timetable) {
      timetable = await Timetable.findOne().sort({ createdAt: -1 });
    }

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'No timetable found. Please contact your administrator to generate a timetable.'
      });
    }

    // Get user-specific timetable
    let userTimetable = null;
    
    if (targetUser.role === 'student') {
      // Find student in student_timetables (check multiple formats)
      const studentId = targetUser._id.toString();
      const studentEmail = targetUser.email;
      const studentName = targetUser.name;
      
      // Try multiple lookup strategies
      userTimetable = timetable.studentTimetables?.[studentId] 
        || timetable.generatedData?.student_timetables?.[studentId]
        || timetable.generatedData?.student_timetables?.[studentEmail]
        || timetable.generatedData?.student_timetables?.[studentName]
        || Object.entries(timetable.generatedData?.student_timetables || {}).find(
            ([key, value]) => value?.student_id === studentId || 
                             value?.student_id === studentEmail ||
                             value?.student_id === studentName
          )?.[1]
        || null;
    } else if (targetUser.role === 'teacher') {
      // Find teacher in faculty_timetables (check multiple formats)
      const facultyId = targetUser._id.toString();
      const facultyEmail = targetUser.email;
      const facultyName = targetUser.name;
      
      // Try multiple lookup strategies
      userTimetable = timetable.facultyTimetables?.[facultyId]
        || timetable.generatedData?.faculty_timetables?.[facultyId]
        || timetable.generatedData?.faculty_timetables?.[facultyEmail]
        || timetable.generatedData?.faculty_timetables?.[facultyName]
        || Object.values(timetable.generatedData?.faculty_timetables || {}).find(
            (faculty) => faculty?.faculty_id === facultyId ||
                        faculty?.faculty_id === facultyEmail ||
                        faculty?.faculty_id === facultyName ||
                        faculty?.faculty_id === targetUser.email ||
                        faculty?.faculty_id === targetUser.name
          )
        || null;
    }

    res.json({
      success: true,
      data: {
        timetable: {
          ...timetable.toObject(),
          userTimetable
        }
      }
    });
  } catch (error) {
    console.error('Get user timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user timetable',
      error: error.message
    });
  }
};

// Update timetable
export const updateTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isActive, semester, academicYear } = req.body;

    const timetable = await Timetable.findById(id);

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found'
      });
    }

    // If setting this timetable as active, deactivate others
    if (isActive === true) {
      await Timetable.updateMany(
        { _id: { $ne: id } },
        { $set: { isActive: false } }
      );
    }

    if (name) timetable.name = name;
    if (isActive !== undefined) timetable.isActive = isActive;
    if (semester) timetable.semester = semester;
    if (academicYear) timetable.academicYear = academicYear;

    await timetable.save();

    res.json({
      success: true,
      message: 'Timetable updated successfully',
      data: { timetable }
    });
  } catch (error) {
    console.error('Update timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating timetable',
      error: error.message
    });
  }
};

// Delete timetable
export const deleteTimetable = async (req, res) => {
  try {
    const { id } = req.params;

    const timetable = await Timetable.findById(id);

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found'
      });
    }

    await timetable.deleteOne();

    res.json({
      success: true,
      message: 'Timetable deleted successfully'
    });
  } catch (error) {
    console.error('Delete timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting timetable',
      error: error.message
    });
  }
};
