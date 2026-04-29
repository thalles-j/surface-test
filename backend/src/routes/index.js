import express from "express";
import productsRoutes from "./productsRoutes.js";
import userRoutes from "./userRoutes.js";
import authRoutes from "./authRoutes.js";
import profileRoutes from "./profileRoutes.js";
import uploadRoutes from "./uploadRoutes.js";
import categoriesRoutes from "./categoriesRoutes.js";
import adminRoutes from "./adminRoutes.js";
import orderRoutes from "./orderRoutes.js";
import checkoutRoutes from "./checkoutRoutes.js";
import restockRoutes from "./restockRoutes.js";
import { checkStoreActive } from "../middlewares/storeStatusMiddleware.js";
import { authLimiter, apiLimiter, adminLimiter } from "../app.js";

const routes = (app) => {
    app.route("/").get((req, res) => res.status(200).send("API Funcionando!"));

    app.use(express.json());

    // Rotas que NÃO dependem do status da loja
    app.use("/api/auth", authLimiter, authRoutes);
    app.use("/api/conta", apiLimiter, profileRoutes);
    app.use("/api/upload", apiLimiter, uploadRoutes);
    app.use("/api/admin", adminLimiter, adminRoutes);
    app.use("/api/users", apiLimiter, userRoutes);
    app.use("/api/notify-me", apiLimiter, restockRoutes);

    // Rotas públicas — bloqueadas quando loja está em manutenção
    app.use("/api/products", checkStoreActive, apiLimiter, productsRoutes);
    app.use("/api/categories", checkStoreActive, apiLimiter, categoriesRoutes);
    app.use("/api/orders", checkStoreActive, apiLimiter, orderRoutes);
    app.use("/api/checkout", checkStoreActive, apiLimiter, checkoutRoutes);
};

export default routes;
