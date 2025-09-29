import { Router } from "express";
import { validateBody } from "../middleware/vaildateBody.js";
import {
    createProductController,
    listProductsController,
    getProductController,
    updateProductController,
    deleteProductController
} from "../controllers/productsController.js";

const router = Router();

router.post("/", validateBody, createProductController);
router.get("", listProductsController);
router.get("/:id", getProductController);
router.put("/:id", updateProductController);
router.delete("/:id", deleteProductController);

export default router;
