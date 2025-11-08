import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  // Unified naming - support both 'name' and 'courseName'
  name: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true
  },
  courseName: {
    type: String,
    trim: true,
    sparse: true
  },
  // Unified naming - support both 'code' and 'courseCode'
  code: {
    type: String,
    required: [true, 'Course code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  courseCode: {
    type: String,
    uppercase: true,
    trim: true,
    sparse: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 1,
    sparse: true
  },
  tokensPerAttendance: {
    type: Number,
    default: 10,
    sparse: true
  },
  credits: {
    type: Number,
    sparse: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
    // Optional - can be assigned later
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual to get courseName from name (for backward compatibility)
courseSchema.virtual('displayName').get(function() {
  return this.courseName || this.name;
});

// Virtual to get courseCode from code (for backward compatibility)
courseSchema.virtual('displayCode').get(function() {
  return this.courseCode || this.code;
});

// Pre-save middleware to sync name/courseName and code/courseCode
courseSchema.pre('save', function(next) {
  // Sync courseName to name if courseName is provided
  if (this.courseName && !this.name) {
    this.name = this.courseName;
  } else if (this.name && !this.courseName) {
    this.courseName = this.name;
  }
  
  // Sync courseCode to code if courseCode is provided
  if (this.courseCode && !this.code) {
    this.code = this.courseCode;
  } else if (this.code && !this.courseCode) {
    this.courseCode = this.code;
  }
  
  next();
});

// Calculate tokens based on priority
courseSchema.methods.calculateTokens = function() {
  return this.tokensPerAttendance * this.priority;
};

// Ensure virtuals are included in JSON
courseSchema.set('toJSON', { virtuals: true });
courseSchema.set('toObject', { virtuals: true });

export default mongoose.model('Course', courseSchema);