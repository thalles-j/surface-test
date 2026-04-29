import express from 'express';
import { optionalAuthMiddleware } from '../middlewares/authMiddleware.js';
import {
  preCheckoutController,
  previewCheckoutController,
  validateCouponController,
  calculateShippingController,
  createOrderController,
  createPaymentController,
  mercadoPagoWebhookController,
} from '../controllers/checkoutController.js';

const router = express.Router();

router.post('/preview', optionalAuthMiddleware, previewCheckoutController);
router.post('/validate-coupon', optionalAuthMiddleware, validateCouponController);
router.post('/pre-checkout', optionalAuthMiddleware, preCheckoutController);
router.post('/shipping', optionalAuthMiddleware, calculateShippingController);
router.post('/order', optionalAuthMiddleware, createOrderController);
router.post('/payment', optionalAuthMiddleware, createPaymentController);
router.post('/webhook/mercadopago', mercadoPagoWebhookController);

export default router;
