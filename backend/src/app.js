import express from "express";
import routes from "./routes/index.js";
import conectaNaDatabase from "./database/conectaNaDatabase.js";

const conexao = await conectaNaDatabase();

conexao.on("error", (erro) => {
    console.error("erro de conexão", erro);
});

conexao.once("open", () => {
    console.log("Conexao com o banco feita com sucesso");
})

const app = express();
routes(app);


export default app;
