const WHATSAPP_NUMBER = '5524992709668';

function formatCurrency(value) {
  return Number(value).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function buildWhatsAppMessage(order) {
  const customerName = order.nome_cliente || order.usuario?.nome || 'Cliente';
  const items = order.pedidoProdutos || [];

  const lines = [
    `Novo Pedido - Surface`,
    ``,
    `Cliente: ${customerName}`,
  ];

  if (order.id_pedido) {
    lines.push(`Pedido #: ${order.id_pedido}`);
  }

  lines.push(``, `Itens:`);

  items.forEach((item, i) => {
    const name = item.produto?.nome_produto || 'Produto';
    const size = item.sku_variacao?.split('-').pop() || '';
    const sizeStr = size ? ` (${size})` : '';
    const qty = item.quantidade;
    const unitPrice = Number(item.preco_unitario);
    const totalItem = unitPrice * qty;

    lines.push(
      `${i + 1}. ${name}${sizeStr} - ${qty}x R$ ${formatCurrency(unitPrice)} = R$ ${formatCurrency(totalItem)}`
    );
  });

  lines.push(``, `Subtotal: R$ ${formatCurrency(order.subtotal)}`);

  if (order.codigo_cupom && Number(order.desconto) > 0) {
    lines.push(`Cupom (${order.codigo_cupom}): -R$ ${formatCurrency(order.desconto)}`);
  }

  if (Number(order.desconto) > 0) {
    lines.push(`Desconto total: -R$ ${formatCurrency(order.desconto)}`);
  }

  if (Number(order.frete) > 0) {
    lines.push(`Frete: R$ ${formatCurrency(order.frete)}`);
  } else {
    lines.push(`Frete: Gratis`);
  }

  lines.push(`Total: R$ ${formatCurrency(order.total)}`);
  lines.push(``, `Aguardo confirmacao para finalizar a compra!`);

  return lines.join('\n');
}

export function generateWhatsAppLink(message) {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
}
