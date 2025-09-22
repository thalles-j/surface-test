import express from "express";
import productsRoutes from "./productsRoutes.js";
import userRoutes from "./userRoutes.js";

const routes = (app) => {
    app.route("/").get((req, res) => res.status(200).send("API Funcionando!"));

    app.use(express.json(), 
    productsRoutes, 
    userRoutes
);
};

export default routes;
