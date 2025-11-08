import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  // Admin
  registerAdminMALS,
  loginAdminMALS,
  createCourseMALS,
  updateAdminCapacity,
  getAdminProfileMALS,
  getStudentFeedbacks,
  registerCollege,
  // Student
  registerStudentMALS,
  loginStudentMALS,
  getStudentProfileMALS,
  updateStudentProfileMALS,
  submitStudentFeedback,
  selectStudentCourses,
  getStudentSelectedCourses,
  // Teacher
  registerTeacherMALS,
  loginTeacherMALS,
  getTeacherProfileMALS,
  updateTeacherProfileMALS,
  getTeacherCoursesMALS,
  getAllTeachersMALS
} from '../controllers/malsController.js';

const router = express.Router();

// ============= ADMIN ROUTES =============
router.post('/admin/register', registerAdminMALS);
router.post('/admin/login', loginAdminMALS);
router.post('/admin/courses', authenticate, authorize('admin'), createCourseMALS);
router.post('/admin/:adminId/college', authenticate, authorize('admin'), registerCollege);
router.patch('/admin/:adminId/capacity', authenticate, authorize('admin'), updateAdminCapacity);
router.get('/admin/:adminId', authenticate, authorize('admin'), getAdminProfileMALS);
router.get('/admin/feedbacks/list', authenticate, authorize('admin'), getStudentFeedbacks);

// ============= STUDENT ROUTES =============
router.post('/students/register', registerStudentMALS);
router.post('/students/login', loginStudentMALS);
// Student routes - allow any authenticated user to access their own profile
router.get('/students/:studentId', authenticate, getStudentProfileMALS);
router.patch('/students/:studentId', authenticate, updateStudentProfileMALS);
router.post('/students/:studentId/feedback', authenticate, submitStudentFeedback);
router.post('/students/:studentId/courses', authenticate, selectStudentCourses);
router.get('/students/:studentId/courses', authenticate, getStudentSelectedCourses);

// ============= TEACHER ROUTES =============
router.post('/teachers/register', registerTeacherMALS);
router.post('/teachers/login', loginTeacherMALS);
router.get('/teachers', getAllTeachersMALS); // Get all teachers (no auth required for admin use)
// Teacher routes - allow any authenticated user to access their own profile
router.get('/teachers/:teacherId', authenticate, getTeacherProfileMALS);
router.patch('/teachers/:teacherId', authenticate, updateTeacherProfileMALS);
router.get('/teachers/:teacherId/courses', authenticate, getTeacherCoursesMALS);

export default router;

