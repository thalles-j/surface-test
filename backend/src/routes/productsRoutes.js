import { Router } from "express";
import { validateBody } from "../middlewares/vaildateBody.js";
import {
    createProductController,
    getProductController,
    getProductBySlugController,
    updateProductController,
    deleteProductController,
    setPrincipalPhotoController,
    bulkUpdateProductsController
} from "../controllers/productsController.js";
import { authMiddleware, adminMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

// ROTAS PUBLICAS
router.get("/", getProductController);
router.get("/slug/:slug", getProductBySlugController);
router.get("/:id", getProductController);

// ROTAS PROTEGIDAS — SOMENTE ADMIN
router.post("/", authMiddleware, adminMiddleware, validateBody, createProductController);
router.put("/:id", authMiddleware, adminMiddleware, updateProductController);
router.patch("/bulk-update", authMiddleware, adminMiddleware, bulkUpdateProductsController);
router.patch("/:id/principal", authMiddleware, adminMiddleware, setPrincipalPhotoController);
router.delete("/:id", authMiddleware, adminMiddleware, deleteProductController);

export default router;