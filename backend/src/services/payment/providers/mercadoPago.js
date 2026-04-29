import { PaymentProvider } from '../index.js';
import { MercadoPagoConfig, Preference } from 'mercadopago';

let client = null;

function getClient() {
  if (client) return client;
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token || token.includes('TEST-0000000000')) {
    console.warn('[MercadoPago] Access Token não configurado. Pagamentos não funcionarão em produção.');
  }
  client = new MercadoPagoConfig({ accessToken: token || 'dummy' });
  return client;
}

export class MercadoPagoProvider extends PaymentProvider {
  constructor() {
    super('mercado_pago');
  }

  async createPayment(order) {
    const preference = new Preference(getClient());

    const items = order.itens?.map((item) => ({
      id: String(item.id_produto),
      title: item.nome_produto,
      quantity: item.quantidade,
      unit_price: Number(item.preco_unitario),
      currency_id: 'BRL',
    })) || [];

    const body = {
      items,
      payer: {
        name: order.nome_cliente || '',
        email: order.email || '',
      },
      external_reference: String(order.id_pedido),
      back_urls: {
        success: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout/sucesso`,
        failure: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout/erro`,
        pending: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout/pendente`,
      },
      auto_return: 'approved',
      notification_url: `${process.env.BACKEND_URL || 'http://localhost:5001/api'}/checkout/webhook/mercadopago`,
    };

    try {
      const response = await preference.create({ body });
      return {
        paymentId: response.id,
        checkoutUrl: response.init_point,
        sandboxUrl: response.sandbox_init_point,
        status: 'pending',
      };
    } catch (error) {
      console.error('[MercadoPago] Erro ao criar preferência:', error?.message || error);
      throw new Error('Falha ao criar preferência de pagamento no MercadoPago.');
    }
  }

  async getPaymentStatus(paymentId) {
    // Para consulta direta usamos a API REST do MP
    try {
      const { default: axios } = await import('axios');
      const { data } = await axios.get(
        `https://api.mercadopago.com/v1/payments/search?external_reference=${encodeURIComponent(paymentId)}`,
        {
          headers: { Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}` },
        }
      );
      const payment = data.results?.[0];
      if (!payment) return { status: 'unknown' };
      return {
        status: payment.status, // approved, pending, in_process, rejected
        statusDetail: payment.status_detail,
        transactionAmount: payment.transaction_amount,
      };
    } catch (error) {
      console.error('[MercadoPago] Erro ao consultar pagamento:', error?.message || error);
      throw new Error('Falha ao consultar status do pagamento.');
    }
  }

  async processWebhook(payload, headers) {
    const signature = headers['x-signature-id'] || headers['x-signature'];
    // TODO: verificar assinatura do webhook quando MERCADO_PAGO_WEBHOOK_SECRET estiver configurado
    if (!payload || !payload.data || !payload.data.id) {
      return { processed: false, reason: 'Payload inválido' };
    }

    try {
      const { default: axios } = await import('axios');
      const { data: payment } = await axios.get(
        `https://api.mercadopago.com/v1/payments/${payload.data.id}`,
        {
          headers: { Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}` },
        }
      );

      return {
        processed: true,
        externalReference: payment.external_reference,
        status: payment.status,
        statusDetail: payment.status_detail,
        paymentId: payment.id,
      };
    } catch (error) {
      console.error('[MercadoPago] Erro ao processar webhook:', error?.message || error);
      return { processed: false, reason: 'Erro ao consultar pagamento' };
    }
  }

  async refund(paymentId, amount) {
    try {
      const { default: axios } = await import('axios');
      const { data } = await axios.post(
        `https://api.mercadopago.com/v1/payments/${paymentId}/refunds`,
        amount ? { amount } : {},
        {
          headers: { Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}` },
        }
      );
      return { refunded: true, refundId: data.id };
    } catch (error) {
      console.error('[MercadoPago] Erro ao reembolsar:', error?.message || error);
      throw new Error('Falha ao processar reembolso.');
    }
  }
}
