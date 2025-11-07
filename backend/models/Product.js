import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true
  },
  category: {
    type: String,
    enum: ['course', 'book', 'software', 'equipment', 'subscription', 'other'],
    required: true,
    default: 'other'
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: 0
  },
  tokenPrice: {
    type: Number,
    required: [true, 'Token price is required'],
    min: 0
  },
  imageUrl: {
    type: String,
    trim: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    sparse: true
  },
  stock: {
    type: Number,
    default: -1 // -1 means unlimited
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

// Indexes
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ course: 1 });
productSchema.index({ isActive: 1, createdAt: -1 });

export default mongoose.model('Product', productSchema);

