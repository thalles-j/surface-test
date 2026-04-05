import { PaymentProvider } from '../index.js';

/**
 * Stripe Payment Provider (placeholder)
 * TODO: Implement with stripe npm package
 */
export class StripeProvider extends PaymentProvider {
  constructor() {
    super('stripe');
    // TODO: Initialize Stripe with process.env.STRIPE_SECRET_KEY
  }

  async createPayment(order) {
    // TODO: Create Stripe Checkout Session or PaymentIntent
    // return { paymentId, checkoutUrl, status }
    throw new Error('Stripe provider not yet implemented.');
  }

  async getPaymentStatus(paymentId) {
    // TODO: Retrieve payment status from Stripe
    throw new Error('Stripe provider not yet implemented.');
  }

  async processWebhook(payload, headers) {
    // TODO: Verify Stripe webhook signature and process event
    throw new Error('Stripe provider not yet implemented.');
  }

  async refund(paymentId, amount) {
    // TODO: Create Stripe refund
    throw new Error('Stripe provider not yet implemented.');
  }
}
