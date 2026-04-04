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
                    { url: "/uploads/t-shirt_drop0_offwhite_front.png", descricao: "Frente" },
                    { url: "/uploads/t-shirt_drop0_offwhite_back.png", descricao: "Costas" },
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
                    { url: "/uploads/t-shirt_drop0_black_front.png", descricao: "Frente" },
                    { url: "/uploads/t-shirt_drop0_black_back.png", descricao: "Costas" },
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

    // 5️⃣ Criar cupons iniciais
    const cuponsData = [
        { codigo: 'BLACK20', desconto: 20.00, tipo: 'Porcentagem', validade: new Date('2024-11-30') },
        { codigo: 'FRETE10', desconto: 10.00, tipo: 'Frete', validade: new Date('2024-12-25') },
    ];

    for (const c of cuponsData) {
        await prisma.cupons.upsert({
            where: { codigo: c.codigo },
            update: {},
            create: c,
        });
    }
    console.log('✅ Cupons criados!');

    // 6️⃣ Criar campanhas iniciais
    const campanhasData = [
        { nome: 'Black Friday 2024', status: 'Planejada', data_inicio: new Date('2024-11-29'), data_fim: new Date('2024-12-02'), orcamento: 10000 },
        { nome: 'Promoção Natal', status: 'Ativa', data_inicio: new Date('2024-12-01'), orcamento: 5000 },
    ];

    for (const camp of campanhasData) {
        const exists = await prisma.campanhas.findFirst({ where: { nome: camp.nome } });
        if (!exists) {
            await prisma.campanhas.create({ data: camp });
        }
    }
    console.log('✅ Campanhas criadas!');

    // 7️⃣ Configurações iniciais da loja
    const loja = await prisma.configuracoes_loja.findFirst();
    if (!loja) {
        await prisma.configuracoes_loja.create({
            data: {
                nome_loja: 'Surface Streetwear',
                email: 'contato@surface.com',
                telefone: '+55 11 99999-9999',
                endereco: 'São Paulo, SP',
                metodo_pagamento: 'PIX, Cartão',
                frete: 15.0,
                frete_gratis_acima: 200.0,
                moeda: 'BRL',
                idioma: 'pt-BR',
                fundo_landing: '/uploads/t-shirt_drop0_offwhite_front.png'
            }
        });
        console.log('✅ Configurações da loja criadas!');
    }
}

main()
    .catch((e) => {
        console.error("❌ Erro no seed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
