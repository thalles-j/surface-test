// seed.js
import prisma from "./src/database/prisma.js";
import bcrypt from "bcryptjs";

async function main() {
  // 1️⃣ Criar roles fixas
  const rolesData = [
    { id_role: 1, nome_role: "Administrador" },
    { id_role: 2, nome_role: "Cliente" },
  ];

  for (const role of rolesData) {
    await prisma.roles.upsert({
      where: { id_role: role.id_role },
      update: {},
      create: role,
    });
  }
  console.log("✅ Roles criadas!");

  // 2️⃣ Criar categorias fixas
  const categoriasData = [
    { id_categoria: 1, nome_categoria: "Exclusivo" },
    { id_categoria: 2, nome_categoria: "Times" },
  ];

  for (const cat of categoriasData) {
    await prisma.categorias.upsert({
      where: { id_categoria: cat.id_categoria },
      update: {},
      create: cat,
    });
  }
  console.log("✅ Categorias criadas!");

  // 3️⃣ Criar usuários
  const usersData = [
    {
      nome: "Thalles José",
      email: "thalles@example.com",
      senha: await bcrypt.hash("123456", 10),
      id_role: 1,
    },
    {
      nome: "Teste da Silva",
      email: "teste@example.com",
      senha: await bcrypt.hash("abcdef", 10),
      id_role: 2,
    },
  ];

  for (const user of usersData) {
    await prisma.usuarios.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }
  console.log("✅ Usuários criados!");

  // 4️⃣ Criar produtos exemplo
  const produtosData = [
    {
      nome_produto: "Camiseta Exclusiva Branca",
      descricao: "Camiseta edição limitada branca",
      preco: 199.0,
      id_categoria: 1,
      estoque: 50,
      fotos: { create: [{ url: "https://meusite.com/imagens/exclusiva_branca.png" }] },
      VariacaoProduto: {
        create: [
          { tamanho: "P", quantidade: 10 },
          { tamanho: "M", quantidade: 25 },
          { tamanho: "G", quantidade: 10 },
          { tamanho: "GG", quantidade: 10 },
        ],
      },
    },
    {
      nome_produto: "Camisa Oficial Time A",
      descricao: "Camisa oficial do Time A - temporada 2025",
      preco: 159.9,
      id_categoria: 2,
      estoque: 70,
      fotos: { create: [{ url: "https://meusite.com/imagens/time_a.png" }] },
      VariacaoProduto: {
        create: [
          { tamanho: "P", quantidade: 15 },
          { tamanho: "M", quantidade: 20 },
          { tamanho: "G", quantidade: 20 },
          { tamanho: "GG", quantidade: 15 },
        ],
      },
    },
  ];

  for (const produto of produtosData) {
  await prisma.produtos.create({
    data: produto,
  });
}
  console.log("✅ Produtos criados!");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
