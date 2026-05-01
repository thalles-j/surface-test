import prisma from "../database/prisma.js";
import ErroBase from "../errors/ErroBase.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendWelcomeEmail, sendPasswordResetEmail } from "./emailService.js";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function buildSecretVersion(senhaHash) {
  return crypto
    .createHmac("sha256", process.env.JWT_SECRET)
    .update(String(senhaHash))
    .digest("base64url")
    .slice(0, 16);
}

function extractContactEmail(enderecoEntrega) {
  if (!enderecoEntrega || typeof enderecoEntrega !== "object") return null;
  const directEmail = enderecoEntrega.email;
  const nestedEmail = enderecoEntrega.contato?.email;
  const value = directEmail || nestedEmail;
  if (!value) return null;
  return normalizeEmail(value);
}

async function linkOrdersByEmailToUser(userId, email) {
  if (!userId || !email) return;

  const normalizedEmail = normalizeEmail(email);
  if (!prisma?.pedidos?.findMany) return;

  const guestOrders = await prisma.pedidos.findMany({
    where: { id_usuario: null },
    select: { id_pedido: true, endereco_entrega: true },
  });

  const list = Array.isArray(guestOrders) ? guestOrders : [];

  const matchingOrderIds = list
    .filter((order) => extractContactEmail(order.endereco_entrega) === normalizedEmail)
    .map((order) => order.id_pedido);

  if (matchingOrderIds.length === 0) return;

  await prisma.pedidos.updateMany({
    where: {
      id_pedido: { in: matchingOrderIds },
      id_usuario: null,
    },
    data: { id_usuario: userId },
  });
}

/* ======================================================
  LOGIN SERVICE
====================================================== */
export const loginService = async (email, senha) => {
  if (!email || !senha) {
    throw new ErroBase("Email e senha são obrigatórios", 400);
  }

  const cleanEmail = normalizeEmail(email);

  try {
    const usuario = await prisma.usuarios.findUnique({
      where: { email: cleanEmail },
      include: { role: true },
    });

    if (!usuario) {
      throw new ErroBase("Credenciais inválidas", 401);
    }

    const senhaValida = await bcrypt.compare(String(senha), usuario.senha);

    if (!senhaValida) {
      throw new ErroBase("Credenciais inválidas", 401);
    }

    const token = jwt.sign(
      {
        id: usuario.id_usuario,
        email: usuario.email,
        id_role: usuario.id_role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    await linkOrdersByEmailToUser(usuario.id_usuario, usuario.email);

    return { token, usuario };
  } catch (error) {
    if (error instanceof ErroBase) throw error;
    console.error("[loginService] Erro inesperado:", error);
    throw new ErroBase("Erro interno do servidor", 500);
  }
};

/* ======================================================
   REGISTER SERVICE
====================================================== */
export const registerService = async (dados) => {
  const { nome, email, senha, telefone } = dados;
  const cleanEmail = normalizeEmail(email);

  if (!telefone) {
    throw new ErroBase("Telefone é obrigatório", 400);
  }

  // Verifica se o email ja existe
  const existente = await prisma.usuarios.findUnique({
    where: { email: cleanEmail },
  });

  if (existente) {
    throw new ErroBase("Email já cadastrado", 400);
  }

  // Hash da senha
  const senhaHash = await bcrypt.hash(senha, 10);

  // Criar usuario
  const usuario = await prisma.usuarios.create({
    data: {
      nome,
      email: cleanEmail,
      senha: senhaHash,
      telefone,
      id_role: 2,
    },
  });

  // Gera token igual no login
  const token = jwt.sign(
    {
      id: usuario.id_usuario,
      email: usuario.email,
      id_role: usuario.id_role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  // Fire-and-forget - nao bloqueia o registro
  sendWelcomeEmail({ email: usuario.email, name: usuario.nome });

  await linkOrdersByEmailToUser(usuario.id_usuario, usuario.email);

  return { usuario, token };
};

export const requestPasswordResetService = async (email) => {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) {
    throw new ErroBase("Email é obrigatório.", 400);
  }

  const usuario = await prisma.usuarios.findUnique({
    where: { email: cleanEmail },
    select: { id_usuario: true, nome: true, email: true, senha: true },
  });

  // Nao revela se o usuario existe.
  if (!usuario) return { ok: true };

  const secretVersion = buildSecretVersion(usuario.senha);

  const token = jwt.sign(
    {
      action: "reset_password",
      id: usuario.id_usuario,
      email: usuario.email,
      secretVersion,
    },
    process.env.JWT_SECRET,
    { expiresIn: "30m" }
  );

  const isProduction = process.env.NODE_ENV === "production";
  const frontendUrl = process.env.FRONTEND_URL;

  if (isProduction && !frontendUrl) {
    throw new ErroBase("Configuracao incompleta do servidor.", 500);
  }

  const baseUrl = (frontendUrl || "http://localhost:5173").replace(/\/$/, "");
  const resetUrl = `${baseUrl}/entrar?modo=reset&token=${token}`;

  sendPasswordResetEmail({
    email: usuario.email,
    name: usuario.nome,
    resetUrl,
  });

  return { ok: true };
};

export const resetPasswordService = async (token, novaSenha) => {
  if (!token) {
    throw new ErroBase("Token de recuperacao e obrigatorio.", 400);
  }
  if (!novaSenha || String(novaSenha).trim().length < 7) {
    throw new ErroBase("A nova senha deve ter no minimo 7 caracteres.", 400);
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ErroBase("Token invalido ou expirado.", 400);
  }

  if (payload?.action !== "reset_password" || !payload?.email || !payload?.secretVersion) {
    throw new ErroBase("Token invalido.", 400);
  }

  const usuario = await prisma.usuarios.findUnique({
    where: { email: normalizeEmail(payload.email) },
    select: { id_usuario: true, senha: true },
  });

  if (!usuario) {
    throw new ErroBase("Usuario nao encontrado.", 404);
  }

  const currentSecretVersion = buildSecretVersion(usuario.senha);
  if (payload.secretVersion !== currentSecretVersion) {
    throw new ErroBase("Token invalido ou ja utilizado.", 400);
  }

  const senhaHash = await bcrypt.hash(String(novaSenha), 10);
  await prisma.usuarios.update({
    where: { id_usuario: usuario.id_usuario },
    data: { senha: senhaHash },
  });

  return { ok: true };
};

export const getFirstAccessStatusService = async (email) => {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) {
    throw new ErroBase("Email é obrigatório.", 400);
  }

  const [usuario, guestOrders] = await Promise.all([
    prisma.usuarios.findUnique({
      where: { email: cleanEmail },
      select: { id_usuario: true, email: true },
    }),
    prisma.pedidos.findMany({
      where: { id_usuario: null },
      select: { id_pedido: true, endereco_entrega: true },
    }),
  ]);

  const pedidosDoEmail = (Array.isArray(guestOrders) ? guestOrders : []).filter(
    (order) => extractContactEmail(order.endereco_entrega) === cleanEmail
  );

  return {
    hasConta: !!usuario,
    temPedidosPorEmail: pedidosDoEmail.length > 0,
    podePrimeiroAcesso: !usuario && pedidosDoEmail.length > 0,
  };
};

/* ======================================================
  LOGOUT SERVICE
====================================================== */
export const logoutService = async () => {
  // Como estamos usando JWT, o logout pode ser tratado no frontend
  return;
};
