/**
 * Email Service — Surface
 *
 * Provedor configurável via env:
 *   EMAIL_PROVIDER = "smtp" | "sendgrid"
 *
 * SMTP → usa Nodemailer direto (Mailtrap, Gmail, Amazon SES, etc.)
 * SendGrid → usa Nodemailer transport com host smtp.sendgrid.net
 *
 * Se EMAIL_PROVIDER não estiver definido, opera em modo preview (log only).
 */

import nodemailer from 'nodemailer';
import * as templates from './email/templates.js';

// ─── Config ──────────────────────────────────────────

const provider = (process.env.EMAIL_PROVIDER || '').toLowerCase();
const isEnabled = !!provider;

function buildTransport() {
  if (provider === 'sendgrid') {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }

  if (provider === 'smtp') {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return null;
}

const transporter = buildTransport();

const senderAddress = process.env.EMAIL_FROM || 'noreply@surface.com.br';
const senderName = process.env.EMAIL_FROM_NAME || 'Surface';

// ─── Core send ───────────────────────────────────────

/**
 * Envia um e-mail. Não lança erro — falhas são logadas silenciosamente.
 * Retorna { messageId, status } ou { status: 'skipped' | 'error' }.
 */
export async function sendMail({ to, subject, html }) {
  if (!to) {
    console.warn('[Email] Destinatário não informado, e-mail ignorado.');
    return { status: 'skipped', reason: 'no_recipient' };
  }

  if (!isEnabled || !transporter) {
    console.log(`[Email][preview] → ${to} | ${subject}`);
    return { status: 'preview', to, subject };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${senderName}" <${senderAddress}>`,
      to,
      subject,
      html,
    });
    console.log(`[Email] ✓ Enviado para ${to} (${info.messageId})`);
    return { status: 'sent', messageId: info.messageId };
  } catch (err) {
    console.error(`[Email] ✗ Falha ao enviar para ${to}:`, err.message);
    return { status: 'error', error: err.message };
  }
}

// ─── Helpers de alto nível ───────────────────────────

/**
 * Wrap assíncrono seguro — nunca propaga exceção ao chamador.
 * Pode ser chamado sem await para fire-and-forget.
 */
function safeSend(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (err) {
      console.error('[Email] Erro inesperado:', err.message);
      return { status: 'error', error: err.message };
    }
  };
}

// ─── Envios de alto nível ────────────────────────────

export const sendOrderConfirmation = safeSend(async (order) => {
  const email = order.email || order.usuario?.email || order.endereco_entrega?.email || order.endereco_entrega?.contato?.email;
  const name = order.nome_cliente || order.usuario?.nome;

  const items = (order.pedidoProdutos || []).map(pp => ({
    nome: pp.produto?.nome_produto || 'Produto',
    tamanho: pp.sku_variacao?.split('-').pop() || '',
    quantidade: pp.quantidade,
    preco: pp.preco_unitario,
  }));

  const { subject, html } = templates.orderConfirmation({
    orderId: order.id_pedido,
    customerName: name,
    items,
    subtotal: order.subtotal,
    desconto: order.desconto,
    frete: order.frete,
    total: order.total,
  });

  return sendMail({ to: email, subject, html });
});

export const sendOrderStatusUpdate = safeSend(async ({ order, statusDe, statusPara }) => {
  const email = order.email || order.usuario?.email || order.endereco_entrega?.email || order.endereco_entrega?.contato?.email;
  const name = order.nome_cliente || order.usuario?.nome;

  const { subject, html } = templates.orderStatusUpdate({
    orderId: order.id_pedido,
    statusDe,
    statusPara,
    customerName: name,
  });

  return sendMail({ to: email, subject, html });
});

export const sendWelcomeEmail = safeSend(async ({ email, name }) => {
  const { subject, html } = templates.welcome({ name, email });
  return sendMail({ to: email, subject, html });
});

export const sendPasswordResetEmail = safeSend(async ({ email, name, resetUrl }) => {
  const { subject, html } = templates.passwordReset({ name, resetUrl });
  return sendMail({ to: email, subject, html });
});

