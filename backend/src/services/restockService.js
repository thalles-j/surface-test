import prisma from "../database/prisma.js";

export async function createRestockRequest({ produtoId, variacao, email }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedVariacao = String(variacao).trim();

  const produto = await prisma.produtos.findUnique({
    where: { id_produto: produtoId },
    select: { id_produto: true },
  });

  if (!produto) {
    return { error: "Produto nao encontrado", status: 404 };
  }

  const existingRequest = await prisma.restock_requests.findFirst({
    where: {
      id_produto: produtoId,
      variacao: normalizedVariacao,
      email: normalizedEmail,
    },
  });

  if (existingRequest) {
    return { request: existingRequest, created: false };
  }

  const request = await prisma.restock_requests.create({
    data: {
      id_produto: produtoId,
      variacao: normalizedVariacao,
      email: normalizedEmail,
    },
  });

  return { request, created: true };
}

export async function getRestockRequestsGroupedByProduct() {
  const requests = await prisma.restock_requests.findMany({
    include: {
      produto: {
        select: {
          id_produto: true,
          nome_produto: true,
          status: true,
        },
      },
    },
    orderBy: [{ created_at: "desc" }],
  });

  const groupedMap = new Map();

  for (const item of requests) {
    const productId = item.id_produto;
    const variacao = item.variacao;

    if (!groupedMap.has(productId)) {
      groupedMap.set(productId, {
        produto_id: productId,
        nome_produto: item.produto.nome_produto,
        status: item.produto.status,
        total_interesses: 0,
        variacoes: [],
      });
    }

    const current = groupedMap.get(productId);
    current.total_interesses += 1;

    const variacaoItem = current.variacoes.find((v) => v.variacao === variacao);
    if (variacaoItem) {
      variacaoItem.quantidade_interesses += 1;
    } else {
      current.variacoes.push({
        variacao,
        quantidade_interesses: 1,
      });
    }

    groupedMap.set(productId, current);
  }

  return {
    total_registros: requests.length,
    produtos: Array.from(groupedMap.values()).sort(
      (a, b) => b.total_interesses - a.total_interesses
    ),
  };
}

function normalizeEmail(email) {
  if (!email) return null;
  const value = String(email).trim().toLowerCase();
  return value || null;
}
