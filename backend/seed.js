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
            senha: await bcrypt.hash("1234567", 10),
            id_role: 1,
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

    // 8️⃣ Criar coleção DROP 0 e associar produtos
    const drop = await prisma.colecoes.upsert({
        where: { nome: 'DROP 0' },
        update: {},
        create: { nome: 'DROP 0', descricao: 'Coleção DROP 0 SURFACE', status: 'Ativo', locked: false }
    });

    const prodOff = await prisma.produtos.findUnique({ where: { nome_produto: 'T-Shirt DROP 0 SURFACE - OFF WHITE' } });
    const prodBlack = await prisma.produtos.findUnique({ where: { nome_produto: 'T-Shirt DROP 0 SURFACE - BLACK' } });

    if (prodOff) {
        await prisma.colecao_produtos.upsert({ where: { id_colecao_id_produto: { id_colecao: drop.id_colecao, id_produto: prodOff.id_produto } }, update: {}, create: { id_colecao: drop.id_colecao, id_produto: prodOff.id_produto } });
    }
    if (prodBlack) {
        await prisma.colecao_produtos.upsert({ where: { id_colecao_id_produto: { id_colecao: drop.id_colecao, id_produto: prodBlack.id_produto } }, update: {}, create: { id_colecao: drop.id_colecao, id_produto: prodBlack.id_produto } });
    }
    console.log('✅ Coleção DROP 0 criada e produtos associados!');

    // 9️⃣ Criar pedidos de teste
    const cliente = await prisma.usuarios.findUnique({ where: { email: 'teste@example.com' } });
    if (cliente && prodOff) {
        const pedido = await prisma.pedidos.create({ data: { id_usuario: cliente.id_usuario, status: 'Pago', total: Number(prodOff.preco), data_pedido: new Date() } });
        await prisma.pedido_produtos.create({ data: { id_pedido: pedido.id_pedido, id_produto: prodOff.id_produto, sku_variacao: (prodOff.variacoes_estoque && prodOff.variacoes_estoque[0]) ? prodOff.variacoes_estoque[0].sku : 'NA', quantidade: 1, preco_unitario: Number(prodOff.preco) } });
    }

    if (cliente && prodBlack) {
        const pedido2 = await prisma.pedidos.create({ data: { id_usuario: cliente.id_usuario, status: 'Pendente', total: Number(prodBlack.preco) * 2, data_pedido: new Date() } });
        await prisma.pedido_produtos.create({ data: { id_pedido: pedido2.id_pedido, id_produto: prodBlack.id_produto, sku_variacao: (prodBlack.variacoes_estoque && prodBlack.variacoes_estoque[0]) ? prodBlack.variacoes_estoque[0].sku : 'NA', quantidade: 2, preco_unitario: Number(prodBlack.preco) } });
    }
    console.log('✅ Pedidos de teste criados!');

    // 10️⃣ Inicializar contador de acessos
    await prisma.acessos.upsert({ where: { path: '/' }, update: { count: { increment: 5 }, ultimo_acesso: new Date() }, create: { path: '/', count: 5, ultimo_acesso: new Date() } });
    console.log('✅ Contador de acessos inicializado!');
}

main()
    .catch((e) => {
        console.error("❌ Erro no seed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
