import Attendance from '../models/Attendance.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import Token from '../models/Token.js';
import Transaction from '../models/Transaction.js';
import solanaService from '../services/solanaService.js';

// Mark attendance (Teacher only)
export const markAttendance = async (req, res) => {
  try {
    const { studentId, courseId, status, remarks } = req.body;
    const teacherId = req.user._id;

    // Validate input
    if (!studentId || !courseId || !status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide student, course, and status'
      });
    }

    // Validate status
    if (!['present', 'absent'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "present" or "absent"'
      });
    }

    // Get course and verify teacher
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (course.teacher.toString() !== teacherId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to mark attendance for this course'
      });
    }

    // Get student
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if student is enrolled
    if (!course.students.includes(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Student is not enrolled in this course'
      });
    }

    // Check for duplicate attendance on same day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingAttendance = await Attendance.findOne({
      student: studentId,
      course: courseId,
      date: { $gte: today }
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this student today'
      });
    }

    let tokensAwarded = 0;
    let transactionSignature = null;
    let explorerUrl = null;
    let transferResult = null;
    let token = null;

    // Transfer tokens if present
    if (status === 'present') {
      // Get active token
      token = await Token.findOne({ isActive: true });
      
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'No active token found. Please create a token first.'
        });
      }

      if (!student.walletAddress) {
        return res.status(400).json({
          success: false,
          message: 'Student does not have a wallet address'
        });
      }

      // Calculate tokens based on course priority
      tokensAwarded = course.calculateTokens();

      try {
        // Transfer tokens
        transferResult = await solanaService.transferAttendanceTokens(
          student.walletAddress,
          token.mintAddress,
          tokensAwarded
        );

        transactionSignature = transferResult.signature;
        explorerUrl = transferResult.explorerUrl;

        // Update student token balance
        student.tokenBalance += tokensAwarded;
        await student.save();

        // Update token total supply
        token.totalSupply = Number((token.totalSupply || 0) + tokensAwarded);
        await token.save();
      } catch (tokenError) {
        console.error('Token transfer error:', tokenError);
        return res.status(500).json({
          success: false,
          message: 'Failed to transfer tokens',
          error: tokenError.message
        });
      }
    }

    // Create attendance record
    const attendance = await Attendance.create({
      student: studentId,
      course: courseId,
      teacher: teacherId,
      status,
      tokensAwarded,
      transactionSignature,
      explorerUrl,
      remarks
    });

    // Save transaction record if tokens were transferred
    if (status === 'present' && transferResult && tokensAwarded > 0 && token) {
      try {
        await Transaction.create({
          type: 'attendance',
          from: transferResult.from,
          to: transferResult.to,
          student: studentId,
          token: token._id,
          amount: tokensAwarded,
          transactionSignature: transferResult.signature,
          explorerUrl: transferResult.explorerUrl,
          attendance: attendance._id,
          description: `Attendance reward for ${course.name}`
        });
      } catch (txError) {
        // Handle duplicate transaction signature (if transaction already exists)
        if (txError.code === 11000 || txError.name === 'MongoServerError') {
          console.log('Transaction already exists, skipping duplicate save');
        } else {
          console.error('Error saving transaction:', txError);
        }
        // Don't fail the request if transaction save fails
      }
    }

    await attendance.populate([
      { path: 'student', select: 'name email walletAddress' },
      { path: 'course', select: 'name code priority' },
      { path: 'teacher', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      message: `Attendance marked as ${status}`,
      data: { attendance }
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking attendance',
      error: error.message
    });
  }
};

// Get attendance records
export const getAttendance = async (req, res) => {
  try {
    const { studentId, courseId, teacherId, startDate, endDate } = req.query;

    let query = {};

    if (studentId) query.student = studentId;
    if (courseId) query.course = courseId;
    if (teacherId) query.teacher = teacherId;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const attendance = await Attendance.find(query)
      .populate('student', 'name email walletAddress')
      .populate('course', 'name code priority')
      .populate('teacher', 'name email')
      .sort('-date');

    res.json({
      success: true,
      data: { attendance }
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance',
      error: error.message
    });
  }
};

// Get student statistics
export const getStudentStats = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get attendance stats
    const totalClasses = await Attendance.countDocuments({ student: studentId });
    const presentClasses = await Attendance.countDocuments({
      student: studentId,
      status: 'present'
    });

    const attendancePercentage = totalClasses > 0
      ? ((presentClasses / totalClasses) * 100).toFixed(2)
      : 0;

    // Get course-wise attendance
    const courseStats = await Attendance.aggregate([
      { $match: { student: student._id } },
      {
        $group: {
          _id: '$course',
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          },
          tokensEarned: { $sum: '$tokensAwarded' }
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'courseInfo'
        }
      },
      { $unwind: '$courseInfo' },
      {
        $project: {
          courseName: '$courseInfo.name',
          courseCode: '$courseInfo.code',
          total: 1,
          present: 1,
          tokensEarned: 1,
          percentage: {
            $multiply: [{ $divide: ['$present', '$total'] }, 100]
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        student: {
          name: student.name,
          email: student.email,
          walletAddress: student.walletAddress,
          tokenBalance: student.tokenBalance
        },
        overall: {
          totalClasses,
          presentClasses,
          absentClasses: totalClasses - presentClasses,
          attendancePercentage: parseFloat(attendancePercentage)
        },
        courseWise: courseStats
      }
    });
  } catch (error) {
    console.error('Get student stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student statistics',
      error: error.message
    });
  }
};