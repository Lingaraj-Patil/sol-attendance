import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['present', 'absent'],
    required: true
  },
  tokensAwarded: {
    type: Number,
    default: 0
  },
  transactionSignature: {
    type: String,
    sparse: true
  },
  explorerUrl: {
    type: String
  },
  remarks: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
// attendanceSchema.index({ student: 1, course: 1, date: 1 });
// attendanceSchema.index({ transactionSignature: 1 });

// Prevent duplicate attendance records for same student, course, and date
attendanceSchema.index(
  { student: 1, course: 1, date: 1 },
  { 
    unique: true,
    partialFilterExpression: { status: 'present' }
  }
);

export default mongoose.model('Attendance', attendanceSchema);