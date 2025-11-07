import express from 'express';
import {
  createToken,
  getTokens,
  getToken,
  getWalletBalance,
  transferTokens,
  getTokenStudents,
  getTransactions
} from '../controllers/tokenController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Admin only routes
router.post('/', authorize('admin'), createToken);
router.post('/transfer', authorize('admin'), transferTokens);
router.get('/students', authorize('admin'), getTokenStudents);

// All authenticated users
router.get('/', getTokens);
router.get('/balance', getWalletBalance);
router.get('/transactions', getTransactions);
router.get('/:id', getToken);

export default router;