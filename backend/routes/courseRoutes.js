import express from 'express';
import {
  createCourse,
  getCourses,
  getCourse,
  enrollStudent,
  updateCourse
} from '../controllers/courseController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Admin only routes
router.post('/', authorize('admin'), createCourse);
router.post('/enroll', authorize('admin'), enrollStudent);
router.put('/:id', authorize('admin'), updateCourse);

// All authenticated users
router.get('/', getCourses);
router.get('/:id', getCourse);

export default router;