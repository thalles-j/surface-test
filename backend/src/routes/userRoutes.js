import { Router } from "express";
import {
  listUserController,
  getUserController,
  updateUserController,
  deleteUserController
} from "../controllers/userController.js";

import { authMiddleware, adminMiddleware, isOwnerOrAdmin } from "../middlewares/authMiddleware.js";

const router = Router();

// somente admin
router.get("/", authMiddleware, adminMiddleware, listUserController);

// dono ou admin
router.get("/:id", authMiddleware, isOwnerOrAdmin, getUserController);

// dono ou admin
router.put("/:id", authMiddleware, isOwnerOrAdmin, updateUserController);

// somente admin
router.delete("/:id", authMiddleware, adminMiddleware, deleteUserController);

export default router;