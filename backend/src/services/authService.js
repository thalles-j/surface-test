import prisma from "../database/prisma.js";
import ErroBase from "../errors/ErroBase.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendWelcomeEmail, sendPasswordResetEmail } from "./emailService.js";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
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
  const cleanEmail = normalizeEmail(email);

  const usuario = await prisma.usuarios.findUnique({
    where: { email: cleanEmail },
    include: { role: true },
  });

  if (!usuario) {
    throw new ErroBase("Usuário não encontrado", 404);
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senha);

  if (!senhaValida) {
    throw new ErroBase("Senha incorreta", 401);
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
    select: { id_usuario: true, nome: true, email: true },
  });

  // Nao revela se o usuario existe.
  if (!usuario) return { ok: true };

  const token = jwt.sign(
    {
      action: "reset_password",
      id: usuario.id_usuario,
      email: usuario.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "30m" }
  );

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const resetUrl = `${frontendUrl.replace(/\/$/, "")}/entrar?modo=reset&token=${token}`;

  sendPasswordResetEmail({
    email: usuario.email,
    name: usuario.nome,
    resetUrl,
  });

  return { ok: true };
};

export const resetPasswordService = async (token, novaSenha) => {
  if (!token) {
    throw new ErroBase("Token de recuperação é obrigatório.", 400);
  }
  if (!novaSenha || String(novaSenha).trim().length < 7) {
    throw new ErroBase("A nova senha deve ter no mínimo 7 caracteres.", 400);
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ErroBase("Token inválido ou expirado.", 400);
  }

  if (payload?.action !== "reset_password" || !payload?.email) {
    throw new ErroBase("Token inválido.", 400);
  }

  const usuario = await prisma.usuarios.findUnique({
    where: { email: normalizeEmail(payload.email) },
    select: { id_usuario: true },
  });

  if (!usuario) {
    throw new ErroBase("Usuário não encontrado.", 404);
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
