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

const routes = (app) => {
    app.route("/").get((req, res) => res.status(200).send("API Funcionando!"));

    app.use(express.json());

    // Rotas que NÃO dependem do status da loja
    app.use("/api/auth", authRoutes);
    app.use("/api/conta", profileRoutes);
    app.use("/api/upload", uploadRoutes);
    app.use("/api/admin", adminRoutes);
    app.use("/api/users", userRoutes);
    app.use("/api/notify-me", restockRoutes);

    // Rotas públicas — bloqueadas quando loja está em manutenção
    app.use("/api/products", checkStoreActive, productsRoutes);
    app.use("/api/categories", checkStoreActive, categoriesRoutes);
    app.use("/api/orders", checkStoreActive, orderRoutes);
    app.use("/api/checkout", checkStoreActive, checkoutRoutes);
};

export default routes;
