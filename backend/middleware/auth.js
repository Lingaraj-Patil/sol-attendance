import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      console.error('❌ Token verification failed:', jwtError.message);
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired. Please login again.'
        });
      }
      throw jwtError;
    }
    
    // Check if userId exists in decoded token
    if (!decoded.userId) {
      console.error('❌ Token missing userId:', decoded);
      return res.status(401).json({
        success: false,
        message: 'Invalid token format'
      });
    }
    
    console.log('🔐 Token decoded successfully. userId:', decoded.userId);
    
    // Find user - explicitly select role field (role is always included by default)
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      console.error('❌ Authentication failed: User not found for userId:', decoded.userId);
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Log user details before validation
    console.log('🔍 User found in database:', {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      roleType: typeof user.role,
      roleValue: JSON.stringify(user.role)
    });
    
    if (!user.isActive) {
      console.error('❌ Authentication failed: User account is inactive:', user.email);
      return res.status(401).json({
        success: false,
        message: 'User account is inactive'
      });
    }
    
    if (!user.role) {
      console.error('❌ Authentication failed: User found but missing role:', {
        userId: user._id,
        email: user.email,
        name: user.name,
        userObject: user.toObject ? user.toObject() : user
      });
      return res.status(401).json({
        success: false,
        message: 'User role not set'
      });
    }
    
    // Normalize role to string and lowercase for comparison
    const userRole = String(user.role).toLowerCase().trim();
    
    // Log user details for debugging
    console.log(`🔐 Authenticating user: ${user.email}, Role: "${userRole}", ID: ${user._id}`);

    // Attach user to request (ensure role is normalized)
    req.user = user;
    req.user.role = userRole; // Ensure normalized role
    console.log(`✅ Authentication successful. User: ${user.email}, Role: "${userRole}", ID: ${user._id}`);
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: error.message
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    // Flatten roles array if nested (e.g., authorize(['admin']) vs authorize('admin'))
    const allowedRoles = roles.flat();
    
    if (!req.user) {
      console.error('❌ Authorization failed: User not authenticated');
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    if (!req.user.role) {
      console.error('❌ Authorization failed: User object missing role:', {
        userId: req.user._id,
        email: req.user.email,
        userObject: req.user
      });
      return res.status(403).json({
        success: false,
        message: 'User role not found'
      });
    }
    
    // Normalize role comparison (case-insensitive)
    const userRole = req.user.role.toLowerCase();
    const normalizedAllowedRoles = allowedRoles.map(r => r.toLowerCase());
    
    if (!normalizedAllowedRoles.includes(userRole)) {
      console.error(`❌ Access denied. User role: ${req.user.role}, Required roles: ${allowedRoles.join(', ')}, User ID: ${req.user._id}, Email: ${req.user.email}`);
      return res.status(403).json({
        success: false,
        message: `Access denied. Insufficient permissions. Required role: ${allowedRoles.join(' or ')}, Your role: ${req.user.role}`
      });
    }
    
    console.log(`✅ Authorization granted. User role: ${req.user.role}, Required roles: ${allowedRoles.join(', ')}`);
    next();
  };
};