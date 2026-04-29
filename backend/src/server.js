import "dotenv/config";
import app from "./app.js";
import prisma from "./database/prisma.js";
import { initPaymentProviders } from "./services/payment/index.js";

const PORT = process.env.PORT;

async function testConnection() {
  try {
    await prisma.$connect();
    console.log("Conexão com o banco feita com sucesso!");
  } catch (erro) {
    console.error("Erro de conexão com o banco:", erro);
  }
}

testConnection();
initPaymentProviders();

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
