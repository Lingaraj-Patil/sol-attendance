import mongoose from 'mongoose';

const selectedCourseSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  major1: {
    type: String,
    required: true
  },
  major2: {
    type: String,
    required: true
  },
  minor1: {
    type: String,
    required: true
  },
  minor2: {
    type: String,
    required: true
  },
  lab1: {
    type: String,
    required: true
  },
  lab2: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('SelectedCourse', selectedCourseSchema);

