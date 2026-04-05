/**
 * Serviço de Pagamento (Placeholder)
 * 
 * Preparado para integração futura com gateways de pagamento:
 * - Stripe
 * - Mercado Pago
 * - PagSeguro
 * - PIX via API do banco
 */

export const PAYMENT_PROVIDERS = {
  STRIPE: 'stripe',
  MERCADO_PAGO: 'mercado_pago',
  PAGSEGURO: 'pagseguro',
  PIX: 'pix',
};

export const PAYMENT_STATUS = {
  PENDING: 'pendente',
  PROCESSING: 'processando',
  APPROVED: 'aprovado',
  REJECTED: 'rejeitado',
  REFUNDED: 'reembolsado',
};

/**
 * Cria uma sessão de pagamento
 * @param {Object} params - { orderId, amount, provider, customerEmail }
 * @returns {Object} - { sessionId, redirectUrl, status }
 */
export async function createPaymentSession({ orderId, amount, provider, customerEmail }) {
  // TODO: Integrar com gateway real
  console.log(`[PaymentService] Criando sessão: pedido #${orderId}, R$${amount}, via ${provider}`);
  return {
    sessionId: `placeholder_${Date.now()}`,
    redirectUrl: null,
    status: PAYMENT_STATUS.PENDING,
    provider,
  };
}

/**
 * Consulta status de um pagamento
 * @param {string} sessionId
 * @returns {Object} - { status, paidAt, provider }
 */
export async function getPaymentStatus(sessionId) {
  // TODO: Consultar gateway real
  return {
    status: PAYMENT_STATUS.PENDING,
    paidAt: null,
    provider: null,
  };
}

/**
 * Processa reembolso
 * @param {Object} params - { sessionId, amount, reason }
 * @returns {Object} - { refundId, status }
 */
export async function processRefund({ sessionId, amount, reason }) {
  // TODO: Integrar com gateway real
  console.log(`[PaymentService] Reembolso: ${sessionId}, R$${amount}, motivo: ${reason}`);
  return {
    refundId: `refund_${Date.now()}`,
    status: PAYMENT_STATUS.REFUNDED,
  };
}

/**
 * Webhook handler para notificações do gateway
 * @param {Object} payload
 * @returns {Object}
 */
export async function handleWebhook(payload) {
  // TODO: Processar webhook real (Stripe/MP)
  console.log('[PaymentService] Webhook recebido:', JSON.stringify(payload).slice(0, 200));
  return { received: true };
}
