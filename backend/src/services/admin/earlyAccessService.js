import prisma from '../../database/prisma.js';
import { sucesso, erro } from '../../helpers/apiResponse.js';

// ===== PUBLIC: Subscribe email =====
export const subscribeEarlyAccess = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return erro(res, 'Email válido é obrigatório');
    }

    const existing = await prisma.early_access_emails.findUnique({ where: { email } });
    if (existing) {
      return sucesso(res, { mensagem: 'Email já cadastrado', already: true });
    }

    await prisma.early_access_emails.create({ data: { email } });
    return sucesso(res, { mensagem: 'Inscrito com sucesso' }, 201);
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

// ===== PUBLIC: Check if email has early access =====
export const checkEarlyAccess = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return erro(res, 'Email é obrigatório');

    const record = await prisma.early_access_emails.findUnique({ where: { email } });
    if (!record || !record.liberado) {
      return res.json({ hasAccess: false });
    }
    return res.json({ hasAccess: true });
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

// ===== PUBLIC: Get store launch info (countdown + early access status) =====
export const getStoreLaunchInfo = async (req, res) => {
  try {
    const config = await prisma.configuracoes_loja.findFirst({
      select: {
        loja_ativa: true,
        data_abertura: true,
        early_access_ativo: true,
        nome_loja: true,
        instagram: true,
      },
    });
    return res.json(config || {});
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

// ===== ADMIN: List all early access emails =====
export const listEarlyAccessEmails = async (req, res) => {
  try {
    const emails = await prisma.early_access_emails.findMany({
      orderBy: { criado_em: 'desc' },
    });
    return res.json(emails);
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

// ===== ADMIN: Grant early access to specific emails =====
export const grantEarlyAccess = async (req, res) => {
  try {
    const { emails } = req.body;
    if (!Array.isArray(emails) || emails.length === 0) {
      return erro(res, 'Lista de emails é obrigatória');
    }

    const result = await prisma.early_access_emails.updateMany({
      where: { email: { in: emails } },
      data: { liberado: true },
    });

    return sucesso(res, { mensagem: `${result.count} email(s) liberado(s)`, count: result.count });
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

// ===== ADMIN: Revoke early access =====
export const revokeEarlyAccess = async (req, res) => {
  try {
    const { emails } = req.body;
    if (!Array.isArray(emails) || emails.length === 0) {
      return erro(res, 'Lista de emails é obrigatória');
    }

    const result = await prisma.early_access_emails.updateMany({
      where: { email: { in: emails } },
      data: { liberado: false },
    });

    return sucesso(res, { mensagem: `${result.count} acesso(s) revogado(s)`, count: result.count });
  } catch (error) {
    return erro(res, error.message, 500);
  }
};
