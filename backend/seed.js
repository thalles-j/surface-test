// seed.js
import prisma from "./src/database/prisma.js";
import bcrypt from "bcryptjs";

// Função auxiliar para gerar o SKU da variação
const gerarSku = (nome, tamanho) => {
    // Ex: "Camiseta Exclusiva Branca" -> "CAMISETA-EXC-BRANCA"
    const nomeBase = nome.toUpperCase().replace(/[^A-Z0-9\s]/g, '').trim().split(/\s+/).slice(0, 3).join('-');
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
            update: { id_role: user.id_role }, // Pode ser útil atualizar a role se o usuário já existir
            create: user,
        });
    }
    console.log("✅ Usuários criados!");

    // 4️⃣ Criar produtos exemplo
    
    // Define a lista de variações de tamanho para os produtos
    const variacoesExclusivo = [
        { tamanho: "P", quantidade: 10 },
        { tamanho: "M", quantidade: 25 },
        { tamanho: "G", quantidade: 10 },
        { tamanho: "GG", quantidade: 10 },
    ];
    
    // Para o Produto 2
    const variacoesTime = [
        { tamanho: "P", quantidade: 15 },
        { tamanho: "M", quantidade: 20 },
        { tamanho: "G", quantidade: 20 },
        { tamanho: "GG", quantidade: 15 },
    ];


    const produtosData = [
        {
            nome_produto: "Camiseta Exclusiva Branca",
            descricao: "Camiseta edição limitada branca",
            preco: 199.0,
            id_categoria: 1,
            
            
            // NOVO CAMPO: variacoes_estoque (JSONB)
            variacoes_estoque: variacoesExclusivo.map(v => ({
                sku: gerarSku("Camiseta Exclusiva Branca", v.tamanho),
                tamanho: v.tamanho,
                estoque: v.quantidade,
                preco: 199.00 
            })),
            
            fotos: { create: [{ url: "https://meusite.com/imagens/exclusiva_branca.png", descricao: "Frente da camiseta" }] },
            
            
        },
        {
            nome_produto: "Camisa Oficial Time A",
            descricao: "Camisa oficial do Time A - temporada 2025",
            preco: 159.9,
            id_categoria: 2,
            

            variacoes_estoque: variacoesTime.map(v => ({
                sku: gerarSku("Camisa Oficial Time A", v.tamanho),
                tamanho: v.tamanho,
                estoque: v.quantidade,
                preco: 159.90
            })),

            fotos: { create: [{ url: "https://meusite.com/imagens/time_a.png", descricao: "Camisa vista frontal" }] },
            
            
        },
    ];

    for (const produto of produtosData) {
        await prisma.produtos.upsert({
            where: { nome_produto: produto.nome_produto },
            update: produto,
            create: produto,
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