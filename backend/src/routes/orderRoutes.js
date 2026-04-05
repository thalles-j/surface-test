import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
  createOrderController,
  getMyOrdersController,
  getOrderByIdController,
} from '../controllers/orderController.js';

const router = express.Router();

// All order routes require authentication
router.use(authMiddleware);

router.post('/', createOrderController);
router.get('/', getMyOrdersController);
router.get('/:id', getOrderByIdController);

export default router;
