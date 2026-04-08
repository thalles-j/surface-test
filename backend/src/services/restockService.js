import { Prisma } from "@prisma/client";
import prisma from "../database/prisma.js";

let restockUserColumnAvailable;

export async function createRestockRequest({ produtoId, variacao, email, userId }) {
  const normalizedProdutoId = Number(produtoId);
  const normalizedEmail = normalizeEmail(email);
  const normalizedVariacao = String(variacao).trim();
  const normalizedUserId = userId ? Number(userId) : null;

  const produto = await prisma.produtos.findUnique({
    where: { id_produto: normalizedProdutoId },
    select: { id_produto: true },
  });

  if (!produto) {
    return { error: "Produto nao encontrado", status: 404 };
  }

  const canUseUserColumn = await isRestockUserColumnAvailable();
  const effectiveUserId = canUseUserColumn ? normalizedUserId : null;

  const dedupeWhere = buildDedupeWhere({
    produtoId: normalizedProdutoId,
    variacao: normalizedVariacao,
    email: normalizedEmail,
    userId: effectiveUserId,
  });

  const existingRequest = await prisma.restock_requests.findFirst({ where: dedupeWhere });
  if (existingRequest) {
    return { request: existingRequest, created: false };
  }

  const createData = {
    id_produto: normalizedProdutoId,
    variacao: normalizedVariacao,
    email: normalizedEmail,
    ...(effectiveUserId ? { id_usuario: effectiveUserId } : {}),
  };

  try {
    const request = await prisma.restock_requests.create({ data: createData });
    return { request, created: true };
  } catch (error) {
    if (isMissingRestockUserColumnError(error)) {
      restockUserColumnAvailable = false;

      const fallbackWhere = buildDedupeWhere({
        produtoId: normalizedProdutoId,
        variacao: normalizedVariacao,
        email: normalizedEmail,
        userId: null,
      });

      const existingFallback = await prisma.restock_requests.findFirst({ where: fallbackWhere });
      if (existingFallback) {
        return { request: existingFallback, created: false };
      }

      const fallbackRequest = await prisma.restock_requests.create({
        data: {
          id_produto: normalizedProdutoId,
          variacao: normalizedVariacao,
          email: normalizedEmail,
        },
      });

      return { request: fallbackRequest, created: true };
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await prisma.restock_requests.findFirst({ where: dedupeWhere });
      if (existing) {
        return { request: existing, created: false };
      }
    }

    throw error;
  }
}

export async function getRestockRequestsGroupedByProduct() {
  const canUseUserColumn = await isRestockUserColumnAvailable();

  const requests = await prisma.restock_requests.findMany({
    include: {
      ...(canUseUserColumn
        ? {
            usuario: {
              select: {
                id_usuario: true,
                nome: true,
                email: true,
              },
            },
          }
        : {}),
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
    produtos: Array.from(groupedMap.values()).sort((a, b) => b.total_interesses - a.total_interesses),
  };
}

async function isRestockUserColumnAvailable() {
  if (typeof restockUserColumnAvailable === "boolean") {
    return restockUserColumnAvailable;
  }

  try {
    const result = await prisma.$queryRaw`
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'restock_requests'
      AND column_name = 'id_usuario'
      LIMIT 1
    `;

    restockUserColumnAvailable = Array.isArray(result) && result.length > 0;
  } catch (_error) {
    // Em caso de falha de introspeccao, mantemos o caminho mais seguro.
    restockUserColumnAvailable = true;
  }

  return restockUserColumnAvailable;
}

function buildDedupeWhere({ produtoId, variacao, email, userId }) {
  if (userId) {
    return {
      id_produto: produtoId,
      variacao,
      id_usuario: userId,
    };
  }

  return {
    id_produto: produtoId,
    variacao,
    email,
  };
}

function normalizeEmail(email) {
  if (!email) return null;
  const value = String(email).trim().toLowerCase();
  return value || null;
}

function isMissingRestockUserColumnError(error) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2022" &&
    String(error?.meta?.column || "").includes("id_usuario")
  );
}
