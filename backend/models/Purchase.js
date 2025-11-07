import mongoose from 'mongoose';

const purchaseSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  tokenAmount: {
    type: Number,
    required: true
  },
  transactionSignature: {
    type: String,
    sparse: true
  },
  explorerUrl: {
    type: String,
    sparse: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed'
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
purchaseSchema.index({ student: 1, createdAt: -1 });
purchaseSchema.index({ product: 1 });
purchaseSchema.index({ student: 1, product: 1 });
purchaseSchema.index({ status: 1 });

export default mongoose.model('Purchase', purchaseSchema);

