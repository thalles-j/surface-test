import express from "express";
import routes from "./routes/index.js";
import prisma from "./database/prisma.js";

const app = express();

app.use(express.json()); // Para aceitar JSON no corpo das requisições

// Monta as rotas
routes(app);

// Teste de conexão com o banco
async function testConnection() {
  try {
    await prisma.$connect(); // Conecta e verifica
    console.log("Conexão com o banco feita com sucesso");
  } catch (erro) {
    console.error("Erro de conexão com o banco:", erro);
  }
}

testConnection();


export default app;
