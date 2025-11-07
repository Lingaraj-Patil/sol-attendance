import express from 'express';
import {
  markAttendance,
  getAttendance,
  getStudentStats
} from '../controllers/attendanceController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Teacher only routes
router.post('/mark', authorize('teacher'), markAttendance);

// All authenticated users
router.get('/', getAttendance);
router.get('/stats/:studentId', getStudentStats);

export default router;