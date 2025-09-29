import "dotenv/config";
import express from "express";
import cors from "cors"; // <- importar cors
import routes from "./routes/index.js";
import prisma from "./database/prisma.js";

const PORT = process.env.PORT;
const app = express();

// --- Configuração CORS ---
app.use(cors({
  origin: "http://localhost:5173", // frontend
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

app.use(express.json());
routes(app);

// Teste de conexão com o banco
async function testConnection() {
  try {
    await prisma.$connect();
    console.log("Conexão com o banco feita com sucesso!");
  } catch (erro) {
    console.error("Erro de conexão com o banco:", erro);
  }
}

testConnection();

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

export default app;
