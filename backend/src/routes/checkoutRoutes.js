import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
  previewCheckoutController,
  validateCouponController,
} from '../controllers/checkoutController.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/preview', previewCheckoutController);
router.post('/validate-coupon', validateCouponController);

export default router;
