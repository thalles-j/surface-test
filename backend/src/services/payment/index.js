/**
 * Payment Provider Interface
 * All payment providers must implement these methods.
 */
export class PaymentProvider {
  constructor(name) {
    this.name = name;
  }

  async createPayment(order) {
    throw new Error(`${this.name}: createPayment() not implemented`);
  }

  async getPaymentStatus(paymentId) {
    throw new Error(`${this.name}: getPaymentStatus() not implemented`);
  }

  async processWebhook(payload, headers) {
    throw new Error(`${this.name}: processWebhook() not implemented`);
  }

  async refund(paymentId, amount) {
    throw new Error(`${this.name}: refund() not implemented`);
  }
}

// Provider registry
const providers = {};

export function registerProvider(name, provider) {
  if (!(provider instanceof PaymentProvider)) {
    throw new Error('Provider must extend PaymentProvider class');
  }
  providers[name] = provider;
}

export function getProvider(name) {
  if (!providers[name]) {
    throw new Error(`Payment provider "${name}" not registered.`);
  }
  return providers[name];
}

export function getAvailableProviders() {
  return Object.keys(providers);
}

/**
 * Initialize all built-in payment providers.
 * Call once during app startup.
 */
export async function initPaymentProviders() {
  const { MercadoPagoProvider } = await import('./providers/mercadoPago.js');
  try {
    registerProvider('mercado_pago', new MercadoPagoProvider());
    console.log('[Payment] MercadoPago provider registered');
  } catch (e) {
    console.warn('[Payment] Falha ao registrar MercadoPago:', e.message);
  }
}
