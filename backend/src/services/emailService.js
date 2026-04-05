/**
 * Serviço de Email / Notificações (Placeholder)
 * 
 * Preparado para integração futura com:
 * - SendGrid
 * - Resend
 * - Amazon SES
 * - Nodemailer (SMTP direto)
 */

export const EMAIL_TEMPLATES = {
  ORDER_CONFIRMATION: 'order_confirmation',
  ORDER_SHIPPED: 'order_shipped',
  ORDER_DELIVERED: 'order_delivered',
  ORDER_CANCELLED: 'order_cancelled',
  WELCOME: 'welcome',
  PASSWORD_RESET: 'password_reset',
  ABANDONED_CART: 'abandoned_cart',
  PROMOTION: 'promotion',
};

/**
 * Envia um email transacional
 * @param {Object} params - { to, template, data }
 * @returns {Object} - { messageId, status }
 */
export async function sendEmail({ to, template, data }) {
  // TODO: Integrar com provider real
  console.log(`[EmailService] Enviando "${template}" para ${to}`);
  return {
    messageId: `msg_${Date.now()}`,
    status: 'queued',
    to,
    template,
  };
}

/**
 * Envia notificação de confirmação de pedido
 * @param {Object} order - pedido completo
 */
export async function sendOrderConfirmation(order) {
  return sendEmail({
    to: order.email || order.usuario?.email,
    template: EMAIL_TEMPLATES.ORDER_CONFIRMATION,
    data: {
      orderId: order.id_pedido,
      total: order.total,
      items: order.pedidoProdutos?.length || 0,
    },
  });
}

/**
 * Envia notificação de envio do pedido
 * @param {Object} params - { email, orderId, trackingCode }
 */
export async function sendShippingNotification({ email, orderId, trackingCode }) {
  return sendEmail({
    to: email,
    template: EMAIL_TEMPLATES.ORDER_SHIPPED,
    data: { orderId, trackingCode },
  });
}

/**
 * Envia email de boas-vindas
 * @param {Object} params - { email, name }
 */
export async function sendWelcomeEmail({ email, name }) {
  return sendEmail({
    to: email,
    template: EMAIL_TEMPLATES.WELCOME,
    data: { name },
  });
}

/**
 * Envia email de recuperação de senha
 * @param {Object} params - { email, resetToken }
 */
export async function sendPasswordResetEmail({ email, resetToken }) {
  return sendEmail({
    to: email,
    template: EMAIL_TEMPLATES.PASSWORD_RESET,
    data: { resetToken },
  });
}
