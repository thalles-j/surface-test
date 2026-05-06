import express from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../middlewares/authMiddleware.js';
import {
  createOrderController,
  getMyOrdersController,
  getOrderByIdController,
} from '../controllers/orderController.js';

const router = express.Router();

router.post('/', optionalAuthMiddleware, createOrderController);
router.use(authMiddleware);
router.get('/', getMyOrdersController);
router.get('/:id', getOrderByIdController);

export default router;
