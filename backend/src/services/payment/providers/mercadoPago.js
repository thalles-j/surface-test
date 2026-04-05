import { PaymentProvider } from '../index.js';

/**
 * Mercado Pago Payment Provider (placeholder)
 * TODO: Implement with mercadopago npm package
 */
export class MercadoPagoProvider extends PaymentProvider {
  constructor() {
    super('mercado_pago');
    // TODO: Initialize with process.env.MERCADO_PAGO_ACCESS_TOKEN
  }

  async createPayment(order) {
    // TODO: Create Mercado Pago preference
    // return { paymentId, checkoutUrl, status }
    throw new Error('Mercado Pago provider not yet implemented.');
  }

  async getPaymentStatus(paymentId) {
    // TODO: Retrieve payment status from Mercado Pago
    throw new Error('Mercado Pago provider not yet implemented.');
  }

  async processWebhook(payload, headers) {
    // TODO: Verify Mercado Pago IPN/webhook and process event
    throw new Error('Mercado Pago provider not yet implemented.');
  }

  async refund(paymentId, amount) {
    // TODO: Create Mercado Pago refund
    throw new Error('Mercado Pago provider not yet implemented.');
  }
}
