import { Router } from 'express';
import { notifyMeController } from '../controllers/restockController.js';
import { optionalAuthMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/', optionalAuthMiddleware, notifyMeController);

export default router;

