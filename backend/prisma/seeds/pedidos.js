import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Gerando mais 4 pedidos para completar o histórico...");

  // 1. Recuperar (ou garantir) Marcelo e Produtos
  const marcelo = await prisma.usuarios.findUnique({ where: { email: "marcelo@teste.com" } });
  const p1 = await prisma.produtos.findUnique({ where: { nome_produto: "Favela e Uzi" } });
  const p2 = await prisma.produtos.findUnique({ where: { nome_produto: "Macaco com Airmax" } });
  const p3 = await prisma.produtos.upsert({
    where: { nome_produto: "T-Shirt DROP 0 SURFACE - BLACK" },
    update: {},
    create: { nome_produto: "T-Shirt DROP 0 SURFACE - BLACK", preco: 159.99, id_categoria: 1 }
  });
  const p4 = await prisma.produtos.upsert({
    where: { nome_produto: "T-SHIRT O RIO NÃO É ASSIM." },
    update: {},
    create: { nome_produto: "T-SHIRT O RIO NÃO É ASSIM.", preco: 219.99, id_categoria: 1 }
  });

  // 2. Novos Dados de Pedidos (4 Adicionais)
  const novosPedidosData = [
    {
      status: "pendente",
      subtotal: 159.99,
      total: 179.99,
      metodo: "DINHEIRO",
      pagamento: "aguardando_pagamento",
      itens: [{ produto: p3, sku: "TSHIRT-DROP-0-SURFACE-P" }]
    },
    {
      status: "enviado",
      subtotal: 379.89,
      total: 379.89, // Frete grátis simulado
      metodo: "DINHEIRO",
      pagamento: "pago",
      obs: "Enviar em embalagem de presente",
      itens: [
        { produto: p4, sku: "ORIO-NAO-E-ASSIM-G" },
        { produto: p2, sku: "MACACO-COM-AIRMAX-GG" }
      ]
    },
    {
      status: "cancelado",
      subtotal: 149.90,
      total: 149.90,
      metodo: "DINHEIRO",
      pagamento: "estornado",
      itens: [{ produto: p1, sku: "FAVELA-UZI-UNICO" }]
    },
    {
      status: "processando",
      subtotal: 319.98,
      total: 334.98,
      metodo: "DINHEIRO",
      pagamento: "pago",
      itens: [
        { produto: p3, sku: "TSHIRT-DROP-0-SURFACE-M" },
        { produto: p3, sku: "TSHIRT-DROP-0-SURFACE-G" }
      ]
    }
  ];

  // 3. Loop de Inserção
  for (const ped of novosPedidosData) {
    const p = await prisma.pedidos.create({
      data: {
        id_usuario: marcelo.id_usuario,
        status: ped.status,
        subtotal: ped.subtotal,
        frete: ped.total - ped.subtotal,
        total: ped.total,
        metodo_pagamento: ped.metodo,
        status_pagamento: ped.pagamento,
        observacoes_internas: ped.obs || null,
        pedidoProdutos: {
          create: ped.itens.map(i => ({
            id_produto: i.produto.id_produto,
            preco_unitario: i.produto.preco,
            quantidade: 1,
            sku_variacao: i.sku
          }))
        }
      }
    });
    console.log(`✅ Pedido #${p.id_pedido} (${p.status}) criado.`);
  }

  console.log("✨ Todos os pedidos foram gerados com sucesso!");
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());