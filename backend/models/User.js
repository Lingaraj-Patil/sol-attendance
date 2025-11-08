import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'teacher', 'student'],
    required: true
  },
  walletAddress: {
    type: String,
    required: function() {
      // Only required for students in Solana system
      // Admin in MALS system doesn't need wallet
      return this.role === 'student';
    },
    sparse: true
  },
  tokenBalance: {
    type: Number,
    default: 0
  },
  enrolledCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  // MALS selected courses (different from enrolledCourses)
  malsSelectedCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SelectedCourse'
  }],
  // MALS Student fields
  age: {
    type: Number,
    sparse: true
  },
  gender: {
    type: String,
    sparse: true
  },
  Program: {
    type: String,
    sparse: true
  },
  feedback: {
    type: String,
    maxlength: 100,
    sparse: true
  },
  collegeUniqueId: {
    type: String,
    sparse: true,
    // Links student/teacher to a college
  },
  // MALS Teacher fields
  experience: {
    type: Number,
    sparse: true
  },
  department: {
    type: String,
    sparse: true
  },
  workingHour: {
    type: Number,
    sparse: true
  },
  // MALS Admin fields
  labCapacity: {
    type: Number,
    default: 60,
    sparse: true
  },
  classCapacity: {
    type: Number,
    default: 60,
    sparse: true
  },
  college: {
    collegeName: {
      type: String,
      trim: true,
      sparse: true
    },
    collegeUniqueId: {
      type: String,
      unique: true,
      sparse: true
    },
    coursesOffered: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    }],
    programsOffered: [{
      type: String
    }],
    classroomOccupancy: {
      type: Number,
      default: 0
    },
    labOccupancy: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Timetable generation fields
  availability: {
    // Array of available time slots (e.g., ["Mon_09", "Mon_10", "Tue_14"])
    type: [String],
    default: []
  },
  interests: {
    // For students: preferred courses/subjects
    // For teachers: expertise areas
    type: [String],
    default: []
  },
  preferredTimeSlots: {
    // Preferred time slots (e.g., ["09", "10", "14"] for 9 AM, 10 AM, 2 PM)
    type: [String],
    default: []
  },
  maxCourses: {
    // Maximum number of courses student wants to take
    type: Number,
    sparse: true
  },
  coursePreferences: {
    // Student's course preferences with priority
    type: [{
      courseCode: String,
      priority: { type: Number, min: 1, max: 5, default: 1 }
    }],
    default: []
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);