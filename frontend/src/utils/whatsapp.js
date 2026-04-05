const WHATSAPP_NUMBER = '5524992709668';

/**
 * Generates a WhatsApp checkout URL with the order message.
 * @param {Object} params
 * @param {string} params.customerName
 * @param {Array} params.items - Cart items with nome_produto, selectedSize, quantity, preco
 * @param {number} params.total
 * @param {number|null} params.orderId - If order was created in DB
 * @param {number|null} params.subtotal
 * @param {number|null} params.desconto
 * @param {number|null} params.frete
 * @param {string|null} params.codigoCupom
 * @returns {string} wa.me URL
 */
export function buildWhatsAppCheckoutUrl({ customerName, items, total, orderId, subtotal, desconto, frete, codigoCupom }) {
  const lines = [
    `🛒 *Novo Pedido - Surface*`,
    ``,
    `*Cliente:* ${customerName}`,
  ];

  if (orderId) {
    lines.push(`*Pedido #:* ${orderId}`);
  }

  lines.push(``, `*Itens:*`);

  items.forEach((item, i) => {
    const size = item.selectedSize ? ` (${item.selectedSize})` : '';
    const itemSubtotal = (Number(item.preco) * item.quantity).toFixed(2);
    lines.push(`${i + 1}. ${item.nome_produto}${size} — ${item.quantity}x R$ ${Number(item.preco).toFixed(2)} = R$ ${itemSubtotal}`);
  });

  lines.push(``);

  if (subtotal != null) {
    lines.push(`*Subtotal: R$ ${Number(subtotal).toFixed(2)}*`);
  }

  if (codigoCupom && desconto > 0) {
    lines.push(`*Cupom (${codigoCupom}): -R$ ${Number(desconto).toFixed(2)}*`);
  }

  if (frete != null) {
    if (Number(frete) > 0) {
      lines.push(`*Frete: R$ ${Number(frete).toFixed(2)}*`);
    } else {
      lines.push(`*Frete: Grátis ✨*`);
    }
  }

  lines.push(`*Total: R$ ${Number(total).toFixed(2)}*`);
  lines.push(``, `Aguardo confirmação para finalizar a compra! 🙏`);

  const message = lines.join('\n');
  const encoded = encodeURIComponent(message);

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
}
