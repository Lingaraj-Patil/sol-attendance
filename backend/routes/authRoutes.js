import express from 'express';
import { register, login, getCurrentUser } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', authenticate, getCurrentUser);

// Diagnostic route to check user role (for debugging)
router.get('/check-role', authenticate, (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        roleType: typeof req.user.role,
        isActive: req.user.isActive
      }
    }
  });
});

export default router;