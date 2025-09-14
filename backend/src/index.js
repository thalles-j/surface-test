import express from "express";
import dotenv from "dotenv";
import usuariosRoutes from "./routes/userRoutes.js";

dotenv.config();
const app = express();
app.use(express.json());

app.use("/usuarios", usuariosRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
