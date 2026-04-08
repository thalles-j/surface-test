import prisma from "../database/prisma.js";

export async function createRestockRequest({ produtoId, variacao, email, userId }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedVariacao = String(variacao).trim();
  const normalizedUserId = userId ? Number(userId) : null;

  const produto = await prisma.produtos.findUnique({
    where: { id_produto: produtoId },
    select: { id_produto: true },
  });

  if (!produto) {
    return { error: "Produto nao encontrado", status: 404 };
  }

  const dedupeWhere = normalizedUserId
    ? {
        id_produto: produtoId,
        variacao: normalizedVariacao,
        id_usuario: normalizedUserId,
      }
    : {
        id_produto: produtoId,
        variacao: normalizedVariacao,
        email: normalizedEmail,
      };

  const existingRequest = await prisma.restock_requests.findFirst({
    where: dedupeWhere,
  });

  if (existingRequest) {
    return { request: existingRequest, created: false };
  }

  const request = await prisma.restock_requests.create({
    data: {
      id_produto: produtoId,
      variacao: normalizedVariacao,
      id_usuario: normalizedUserId,
      email: normalizedEmail,
    },
  });

  return { request, created: true };
}

export async function getRestockRequestsGroupedByProduct() {
  const requests = await prisma.restock_requests.findMany({
    include: {
      usuario: {
        select: {
          id_usuario: true,
          nome: true,
          email: true,
        },
      },
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
    const interesse = {
      id: item.id,
      email: item.email || item.usuario?.email || null,
      user_id: item.id_usuario || null,
      user_nome: item.usuario?.nome || null,
      created_at: item.created_at,
    };

    if (variacaoItem) {
      variacaoItem.quantidade_interesses += 1;
      variacaoItem.interesses.push(interesse);
    } else {
      current.variacoes.push({
        variacao,
        quantidade_interesses: 1,
        interesses: [interesse],
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
