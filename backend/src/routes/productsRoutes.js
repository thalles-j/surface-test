import { Router } from "express";
import { validateBody } from "../middlewares/vaildateBody.js";
import {
    createProductController,
    getProductController,
    updateProductController,
    deleteProductController
} from "../controllers/productsController.js";

const router = Router();

router.post("/", validateBody, createProductController);
router.get("", getProductController);
router.get("/:id", getProductController);
router.put("/:id", updateProductController);
router.delete("/:id", deleteProductController);

export default router;

/*import { Router } from "express";
import { validateBody } from "../middlewares/vaildateBody.js";

import {
    createProductController,
    getProductController,
    updateProductController,
    deleteProductController
} from "../controllers/productsController.js";

import { authMiddleware, adminMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

// ROTAS PROTEGIDAS — SOMENTE ADMIN
router.post("/", authMiddleware, adminMiddleware, validateBody, createProductController);
router.put("/:id", authMiddleware, adminMiddleware, updateProductController);
router.delete("/:id", authMiddleware, adminMiddleware, deleteProductController);

// ROTAS PÚBLICAS
router.get("/", getProductController);
router.get("/:id", getProductController);

export default router;
 */