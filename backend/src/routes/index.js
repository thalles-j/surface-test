import express from "express";
import productsRoutes from "./productsRoutes.js";
import userRoutes from "./userRoutes.js";

const routes = (app) => {
    app.route("/").get((req, res) => res.status(200).send("API Funcionando!"));

    app.use(express.json());
    app.use("/api/users", userRoutes);      
    app.use("/api/products", productsRoutes); 
};

export default routes;
