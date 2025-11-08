import express from 'express';
import {
  createCourse,
  getCourses,
  getCourse,
  enrollStudent,
  updateCourse,
  getCoursesByCollege,
  assignTeacher
} from '../controllers/courseController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public route - get courses by college unique ID (for registration)
router.get('/college/:collegeUniqueId', getCoursesByCollege);

// All other routes require authentication
router.use(authenticate);

// Admin only routes
router.post('/', authorize('admin'), createCourse);
router.post('/enroll', authorize('admin'), enrollStudent);
router.put('/:id', authorize('admin'), updateCourse);
router.post('/:courseId/assign-teacher', authorize('admin'), assignTeacher);

// All authenticated users
router.get('/', getCourses);
router.get('/:id', getCourse);

export default router;