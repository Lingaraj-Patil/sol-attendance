import express from 'express';
import {
  autoGenerateTimetable,
  generateTimetable,
  validateTimetableInput,
  getTimetables,
  getActiveTimetable,
  getTimetable,
  getUserTimetable,
  updateTimetable,
  deleteTimetable
} from '../controllers/timetableController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Auto-generate timetable from user data (Admin only)
router.post('/auto-generate', authenticate, authorize('admin'), autoGenerateTimetable);

// Generate timetable manually (Admin only)
router.post('/', authenticate, authorize('admin'), generateTimetable);

// Validate timetable input (Admin only)
router.post('/validate', authenticate, authorize('admin'), validateTimetableInput);

// Get all timetables (Admin only)
router.get('/', authenticate, authorize('admin'), getTimetables);

// Get active timetable (All authenticated users)
router.get('/active', authenticate, getActiveTimetable);

// Get user-specific timetable (Student/Teacher) - MUST come before /:id
router.get('/user/:userId', authenticate, getUserTimetable);

// Get timetable by ID (Admin only) - MUST come last
router.get('/:id', authenticate, authorize('admin'), getTimetable);

// Update timetable (Admin only)
router.put('/:id', authenticate, authorize('admin'), updateTimetable);

// Delete timetable (Admin only)
router.delete('/:id', authenticate, authorize('admin'), deleteTimetable);

export default router;

