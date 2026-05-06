import "dotenv/config";
import app from "./app.js";
import prisma from "./database/prisma.js";
const PORT = process.env.PORT;

function validateProductionEnv() {
  const isProduction = process.env.NODE_ENV === "production";
  if (!isProduction) return;

  const required = [
    { key: "FRONTEND_URL", desc: "URL publica do frontend" },
    { key: "EMAIL_PROVIDER", desc: "provedor de e-mail (smtp ou sendgrid)" },
  ];

  const missing = required.filter((r) => !process.env[r.key]);
  if (missing.length > 0) {
    console.error("\n[ERRO CRITICO] Ambiente de producao sem variaveis obrigatorias:");
    missing.forEach((m) => console.error(`  - ${m.key}: ${m.desc}`));
    console.error("O servidor sera encerrado para evitar comportamento inseguro.\n");
    process.exit(1);
  }
}

validateProductionEnv();

async function testConnection() {
  try {
    await prisma.$connect();
    console.log("Conexao com o banco feita com sucesso!");
  } catch (erro) {
    console.error("Erro de conexao com o banco:", erro);
  }
}

testConnection();

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
