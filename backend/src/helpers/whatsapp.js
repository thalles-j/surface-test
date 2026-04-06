const WHATSAPP_NUMBER = '5524992709668';

/**
 * Formata valor monetário em pt-BR (ex: 1.234,56)
 */
function formatCurrency(value) {
  return Number(value).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Constrói a mensagem formatada para WhatsApp a partir de um pedido.
 * @param {Object} order - Pedido com pedidoProdutos, usuario, totais
 * @returns {string} Mensagem formatada
 */
export function buildWhatsAppMessage(order) {
  const customerName = order.nome_cliente || order.usuario?.nome || 'Cliente';
  const items = order.pedidoProdutos || [];

  const lines = [
    `🛒 Novo Pedido - Surface`,
    ``,
    `Cliente: ${customerName}`,
    `Pedido #: ${order.id_pedido}`,
    ``,
    `Itens:`,
  ];

  items.forEach((item, i) => {
    const name = item.produto?.nome_produto || 'Produto';
    const size = item.sku_variacao?.split('-').pop() || '';
    const sizeStr = size ? ` (${size})` : '';
    const qty = item.quantidade;
    const unitPrice = Number(item.preco_unitario);
    const totalItem = unitPrice * qty;
    lines.push(
      `${i + 1}. ${name}${sizeStr} — ${qty}x R$ ${formatCurrency(unitPrice)} = R$ ${formatCurrency(totalItem)}`
    );
  });

  lines.push(``);
  lines.push(`Subtotal: R$ ${formatCurrency(order.subtotal)}`);

  if (Number(order.desconto) > 0) {
    lines.push(`Desconto: -R$ ${formatCurrency(order.desconto)}`);
  }

  if (Number(order.frete) > 0) {
    lines.push(`Frete: R$ ${formatCurrency(order.frete)}`);
  } else {
    lines.push(`Frete: Grátis 🚚`);
  }

  lines.push(`Total: R$ ${formatCurrency(order.total)}`);
  lines.push(``);
  lines.push(`Aguardo confirmação para finalizar a compra! 🚀`);

  return lines.join('\n');
}

/**
 * Gera o link wa.me com a mensagem encodada.
 * @param {string} message - Mensagem de texto
 * @returns {string} URL completa do WhatsApp
 */
export function generateWhatsAppLink(message) {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
}
