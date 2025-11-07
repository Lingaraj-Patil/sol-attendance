import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['attendance', 'manual_transfer'],
    required: true
  },
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Token',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  transactionSignature: {
    type: String,
    required: true,
    unique: true
  },
  explorerUrl: {
    type: String,
    required: true
  },
  attendance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attendance',
    sparse: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
transactionSchema.index({ student: 1, createdAt: -1 });
transactionSchema.index({ transactionSignature: 1 });
transactionSchema.index({ type: 1, createdAt: -1 });

export default mongoose.model('Transaction', transactionSchema);

