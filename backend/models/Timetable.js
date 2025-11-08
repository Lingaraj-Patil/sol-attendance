import mongoose from 'mongoose';

const timetableSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  semester: {
    type: String,
    trim: true
  },
  academicYear: {
    type: String,
    trim: true
  },
  generatedData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  inputData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  assignments: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  facultyTimetables: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  studentTimetables: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  violations: {
    type: Array,
    default: []
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Timetable', timetableSchema);

