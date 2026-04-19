import express from 'express';
import { optionalAuthMiddleware } from '../middlewares/authMiddleware.js';
import {
  preCheckoutController,
  previewCheckoutController,
  validateCouponController,
} from '../controllers/checkoutController.js';

const router = express.Router();

router.post('/preview', optionalAuthMiddleware, previewCheckoutController);
router.post('/validate-coupon', optionalAuthMiddleware, validateCouponController);
router.post('/pre-checkout', optionalAuthMiddleware, preCheckoutController);

export default router;
