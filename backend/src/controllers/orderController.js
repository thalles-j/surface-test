import { createOrder, getOrdersByUser, getOrderById } from '../services/orderService.js';
import { sendOrderConfirmation } from '../services/emailService.js';
import { buildWhatsAppMessage, generateWhatsAppLink } from '../helpers/whatsapp.js';

export async function createOrderController(req, res, next) {
  try {
    const userId = req.user.id;
    const { items, codigo_cupom } = req.body;
    const order = await createOrder(userId, items, codigo_cupom || null);

    // WhatsApp — gera link (nunca falha o pedido)
    let whatsappUrl = null;
    try {
      const message = buildWhatsAppMessage(order);
      whatsappUrl = generateWhatsAppLink(message);
    } catch (err) {
      console.error('[WhatsApp] Erro ao gerar link:', err.message);
    }

    // Email — fire-and-forget (nunca bloqueia a resposta)
    sendOrderConfirmation(order);

    return res.status(201).json({
      sucesso: true,
      pedido: order,
      whatsappUrl,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyOrdersController(req, res, next) {
  try {
    const userId = req.user.id;
    const orders = await getOrdersByUser(userId);
    return res.json(orders);
  } catch (error) {
    next(error);
  }
}

export async function getOrderByIdController(req, res, next) {
  try {
    const orderId = parseInt(req.params.id);
    const userId = req.user.id;
    const isAdmin = req.user.id_role === 1;
    const order = await getOrderById(orderId, userId, isAdmin);
    return res.json(order);
  } catch (error) {
    next(error);
  }
}
