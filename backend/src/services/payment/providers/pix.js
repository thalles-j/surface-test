import { PaymentProvider } from '../index.js';

/**
 * Pix Payment Provider (placeholder)
 * TODO: Implement with banking API (e.g., Gerencianet/EfiPay)
 */
export class PixProvider extends PaymentProvider {
  constructor() {
    super('pix');
    // TODO: Initialize with Pix API credentials
  }

  async createPayment(order) {
    // TODO: Generate Pix QR code and copia-e-cola
    // return { paymentId, qrCode, pixCopiaECola, status }
    throw new Error('Pix provider not yet implemented.');
  }

  async getPaymentStatus(paymentId) {
    // TODO: Check Pix payment status
    throw new Error('Pix provider not yet implemented.');
  }

  async processWebhook(payload, headers) {
    // TODO: Process Pix webhook notification
    throw new Error('Pix provider not yet implemented.');
  }

  async refund(paymentId, amount) {
    // TODO: Process Pix refund (devolução)
    throw new Error('Pix provider not yet implemented.');
  }
}
