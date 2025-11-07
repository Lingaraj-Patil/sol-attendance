import express from 'express';
import {
  createProduct,
  getProducts,
  getProduct,
  purchaseProduct,
  getPurchaseHistory,
  updateProduct,
  deleteProduct
} from '../controllers/marketplaceController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Admin only routes
router.post('/', authorize('admin'), createProduct);
router.put('/:id', authorize('admin'), updateProduct);
router.delete('/:id', authorize('admin'), deleteProduct);

// All authenticated users
router.get('/', getProducts);
router.get('/history', getPurchaseHistory);
router.post('/purchase', purchaseProduct);
router.get('/:id', getProduct);

export default router;

