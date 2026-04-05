import "dotenv/config";
import express from "express";
import cors from "cors"; // <- importar cors
import path from "path";
import { fileURLToPath } from "url";
import routes from "./routes/index.js";
import prisma from "./database/prisma.js";
import { erroMiddleware } from "./middlewares/erroMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT;
const app = express();

// --- Configuração CORS ---
// Permitir origens de desenvolvimento (localhost em qualquer porta) e/ou listas definidas via env
const allowedFromEnv = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow non-browser clients (curl, Postman)
    if (allowedFromEnv.includes(origin)) return callback(null, true);
    // allow any localhost origin during development
    if (/^https?:\/\/localhost(:\d+)?$/i.test(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
}));

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
routes(app);
app.use(erroMiddleware);

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
