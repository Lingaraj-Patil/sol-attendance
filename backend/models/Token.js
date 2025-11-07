import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema({
  mintAddress: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  symbol: {
    type: String,
    required: true
  },
  decimals: {
    type: Number,
    required: true,
    default: 0
  },
  totalSupply: {
    type: Number,
    default: 0
  },
  mintAuthority: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Token', tokenSchema);