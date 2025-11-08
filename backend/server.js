import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/database.js';



// Import routes
import authRoutes from './routes/authRoutes.js';
import tokenRoutes from './routes/tokenRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import attendanceRoutes from './routes/attendaceRoutes.js';
import marketplaceRoutes from './routes/marketplaceRoutes.js';
import malsRoutes from './routes/malsRoutes.js';
import timetableRoutes from './routes/timetableRoutes.js';

// Load environment variables

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Health check route
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/mals', malsRoutes);
app.use('/api/timetables', timetableRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Connect to database and start server
const PORT = process.env.PORT || 5001;


const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 Solana Attendance System Server Running             ║
║                                                           ║
║   📍 Port: ${PORT}                                       ║
║   🌍 Environment: ${process.env.NODE_ENV || 'development'}                         ║
║   🔗 Network: ${process.env.SOLANA_NETWORK || 'devnet'}                              ║
║                                                           ║
║   API Endpoints:                                          ║
║   ├─ POST /api/auth/register                             ║
║   ├─ POST /api/auth/login                                ║
║   ├─ GET  /api/auth/me                                   ║
║   ├─ POST /api/tokens (Admin)                            ║
║   ├─ GET  /api/tokens                                    ║
║   ├─ POST /api/courses (Admin)                           ║
║   ├─ GET  /api/courses                                   ║
║   ├─ POST /api/courses/enroll (Admin)                    ║
║   ├─ POST /api/attendance/mark (Teacher)                 ║
║   ├─ GET  /api/attendance                                ║
║   └─ GET  /api/attendance/stats/:studentId               ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});

export default app;