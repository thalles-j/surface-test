import {
  createProduct,
  listProducts,
  getProductById,
  updateProduct,
  deleteProduct
} from "../services/productsService.js";

// Create
export const createProductController = async (req, res) => {
  try {
    const product = await createProduct(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// List all
export const listProductsController = async (req, res) => {
  try {
    const products = await listProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get by ID
export const getProductController = async (req, res) => {
  try {
    const product = await getProductById(Number(req.params.id));
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update
export const updateProductController = async (req, res) => {
  try {
    const product = await updateProduct(Number(req.params.id), req.body);
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete
export const deleteProductController = async (req, res) => {
  try {
    await deleteProduct(Number(req.params.id));
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
