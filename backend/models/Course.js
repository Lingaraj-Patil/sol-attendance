import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Course code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  priority: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    default: 1
  },
  tokensPerAttendance: {
    type: Number,
    required: true,
    default: 10
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

// Calculate tokens based on priority
courseSchema.methods.calculateTokens = function() {
  return this.tokensPerAttendance * this.priority;
};

export default mongoose.model('Course', courseSchema);