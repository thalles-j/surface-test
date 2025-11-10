import express from "express";
import productsRoutes from "./productsRoutes.js";
import userRoutes from "./userRoutes.js";
import authRoutes from "./authRoutes.js";
import profileRoutes from "./profileRoutes.js";

const routes = (app) => {
    app.route("/").get((req, res) => res.status(200).send("API Funcionando!"));

    app.use(express.json());
    app.use("/api/users", userRoutes);      
    app.use("/api/products", productsRoutes); 
    app.use("/api/auth", authRoutes);
    app.use("/api/conta", profileRoutes);
};

export default routes;
