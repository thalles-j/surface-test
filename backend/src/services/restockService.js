import prisma from '../database/prisma.js';

async function ensureRestockTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS restock_interesses (
      id_interesse SERIAL PRIMARY KEY,
      id_produto INTEGER NOT NULL REFERENCES produtos(id_produto) ON DELETE CASCADE,
      tamanho VARCHAR(50),
      id_usuario INTEGER REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
      email VARCHAR(255),
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS restock_interesses_unique_user
    ON restock_interesses (id_produto, COALESCE(tamanho, ''), id_usuario)
    WHERE id_usuario IS NOT NULL;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS restock_interesses_unique_email
    ON restock_interesses (id_produto, COALESCE(tamanho, ''), LOWER(email))
    WHERE email IS NOT NULL;
  `);
}

export async function registerRestockInterest({
  idProduto,
  tamanho = null,
  idUsuario = null,
  email = null,
}) {
  await ensureRestockTable();

  const cleanSize = tamanho ? String(tamanho).trim() : null;
  const cleanEmail = email ? String(email).trim().toLowerCase() : null;

  const inserted = await prisma.$executeRaw`
    INSERT INTO restock_interesses (id_produto, tamanho, id_usuario, email)
    VALUES (${idProduto}, ${cleanSize}, ${idUsuario}, ${cleanEmail})
    ON CONFLICT DO NOTHING
  `;

  return { created: Number(inserted) > 0 };
}

export async function listRestockInterests() {
  await ensureRestockTable();

  const rows = await prisma.$queryRaw`
    SELECT
      ri.id_interesse,
      ri.id_produto,
      p.nome_produto,
      ri.tamanho,
      ri.id_usuario,
      u.nome AS nome_usuario,
      COALESCE(ri.email, u.email) AS email_contato,
      ri.criado_em
    FROM restock_interesses ri
    JOIN produtos p ON p.id_produto = ri.id_produto
    LEFT JOIN usuarios u ON u.id_usuario = ri.id_usuario
    ORDER BY ri.criado_em DESC
  `;

  return rows;
}

