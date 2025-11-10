// seed.js
import prisma from "./src/database/prisma.js";
import bcrypt from "bcryptjs";

// Função para gerar SKU a partir do nome do produto e tamanho
const gerarSku = (nome, tamanho) => {
    const nomeBase = nome.toUpperCase()
        .replace(/[^A-Z0-9\s]/g, '')
        .trim()
        .split(/\s+/)
        .slice(0, 4) // pegar até 4 palavras
        .join('-');
    return `${nomeBase}-${tamanho}`;
};

async function main() {
    console.log("Iniciando Seed...");

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
            senha: await bcrypt.hash("1234567", 10),
            id_role: 1,
        },
        {
            nome: "Teste da Silva",
            email: "teste@example.com",
            senha: await bcrypt.hash("abcdefg", 10),
            id_role: 2,
        },
    ];

    for (const user of usersData) {
        await prisma.usuarios.upsert({
            where: { email: user.email },
            update: { id_role: user.id_role },
            create: user,
        });
    }
    console.log("✅ Usuários criados!");

    // 4️⃣ Criar produtos DROP 0 SURFACE
    const produtosData = [
        {
            nome_produto: "T-Shirt DROP 0 SURFACE - OFF WHITE",
            descricao: "Camiseta edição limitada DROP 0 SURFACE cor Off White",
            preco: 159.99,
            id_categoria: 2,
            tipo: "Camiseta",
            variacoes_estoque: [
                { tamanho: "P", sku: gerarSku("T-Shirt DROP 0 SURFACE - OFF WHITE", "P"), estoque: 10, preco: 159.99 },
                { tamanho: "M", sku: gerarSku("T-Shirt DROP 0 SURFACE - OFF WHITE", "M"), estoque: 25, preco: 159.99 },
                { tamanho: "G", sku: gerarSku("T-Shirt DROP 0 SURFACE - OFF WHITE", "G"), estoque: 10, preco: 159.99 },
                { tamanho: "GG", sku: gerarSku("T-Shirt DROP 0 SURFACE - OFF WHITE", "GG"), estoque: 10, preco: 159.99 },
            ],
            fotos: {
                create: [
                    { url: "/uploads/drop0_t-shirt_offwhite_front.png", descricao: "Frente" },
                    { url: "/uploads/drop0_t-shirt_offwhite_back.png", descricao: "Costas" },
                ],
            },
        },
        {
            nome_produto: "T-Shirt DROP 0 SURFACE - BLACK",
            descricao: "Camiseta edição limitada DROP 0 SURFACE cor Black",
            preco: 159.99,
            id_categoria: 1,
            tipo: "Camiseta",
            variacoes_estoque: [
                { tamanho: "P", sku: gerarSku("T-Shirt DROP 0 SURFACE - BLACK", "P"), estoque: 10, preco: 159.99 },
                { tamanho: "M", sku: gerarSku("T-Shirt DROP 0 SURFACE - BLACK", "M"), estoque: 25, preco: 159.99 },
                { tamanho: "G", sku: gerarSku("T-Shirt DROP 0 SURFACE - BLACK", "G"), estoque: 10, preco: 159.99 },
                { tamanho: "GG", sku: gerarSku("T-Shirt DROP 0 SURFACE - BLACK", "GG"), estoque: 10, preco: 159.99 },
            ],
            fotos: {
                create: [
                    { url: "/uploads/drop0_t-shirt_black_front.png", descricao: "Frente" },
                    { url: "/uploads/drop0_t-shirt_black_back.png", descricao: "Costas" },
                ],
            },
        },
    ];

    for (const produto of produtosData) {
        await prisma.produtos.upsert({
            where: { nome_produto: produto.nome_produto },
            update: produto,
            create: produto,
        });
    }
    console.log("✅ Produtos DROP 0 SURFACE criados!");
}

main()
    .catch((e) => {
        console.error("❌ Erro no seed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
