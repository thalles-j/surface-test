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
