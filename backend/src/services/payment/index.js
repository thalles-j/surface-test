/**
 * Payment Provider Interface
 * All payment providers must implement these methods.
 * This is the architecture preparation - no real implementation yet.
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
