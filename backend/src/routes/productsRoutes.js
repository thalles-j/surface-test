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

router.post("/produtos/", validateBody, createProductController);
router.get("/produtos", listProductsController);
router.get("/produtos/:id", getProductController);
router.put("/produtos/:id", updateProductController);
router.delete("/produtos/:id", deleteProductController);

export default router;
