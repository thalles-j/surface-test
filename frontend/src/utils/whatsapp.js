const WHATSAPP_NUMBER = '5524988582885';

function formatBRL(value) {
  return `R$ ${(Number(value) || 0).toFixed(2).replace('.', ',')}`;
}

/**
 * Generates a WhatsApp checkout URL with a rich formatted order message.
 */
function buildAddressLine(addr = {}) {
  const parts = [
    addr.logradouro,
    addr.numero,
    addr.complemento,
    addr.bairro,
    addr.cidade,
    addr.estado,
    addr.cep,
    addr.endereco,
  ].filter(Boolean);
  return parts.join(', ');
}

export function buildWhatsAppCheckoutUrl({
  customerName,
  items,
  total,
  orderId,
  subtotal,
  desconto,
  frete,
  codigoCupom,
  endereco,
  telefone,
  logradouro,
  numero,
  complemento,
  bairro,
  cidade,
  estado,
  cep,
}) {
  const lines = [
    `🛍️ *NOVO PEDIDO - SURFACE*`,
    ``,
    `👤 *Cliente:* ${customerName || 'Não informado'}`,
  ];

  if (orderId) {
    lines.push(`📋 *Pedido:* #${orderId}`);
  }

  if (telefone) {
    lines.push(`📞 *Telefone:* ${telefone}`);
  }

  const addressLine = buildAddressLine({ logradouro, numero, complemento, bairro, cidade, estado, cep, endereco });
  if (addressLine) {
    lines.push(`📍 *Endereço:* ${addressLine}`);
  }

  lines.push(``, `━━━━━━━━━━━━━━━━━━━━`, ``, `🛒 *ITENS:*`);

  items.forEach((item, i) => {
    const size = item.selectedSize ? ` [Tamanho: ${item.selectedSize}]` : '';
    lines.push(`${i + 1}. ${item.nome_produto}${size}`);
    lines.push(`   ${item.quantity}x ${formatBRL(item.preco)} = *${formatBRL(Number(item.preco) * item.quantity)}*`);
  });

  lines.push(``, `━━━━━━━━━━━━━━━━━━━━`, ``, `💰 *RESUMO:*`);

  if (subtotal != null) {
    lines.push(`   Subtotal: ${formatBRL(subtotal)}`);
  }

  if (codigoCupom && desconto > 0) {
    lines.push(`   🏷️ Cupom *${codigoCupom}*: -${formatBRL(desconto)}`);
  }

  if (frete != null) {
    lines.push(`   🚚 Frete: ${Number(frete) > 0 ? formatBRL(frete) : 'Grátis ✨'}`);
  }

  lines.push(``, `💳 *TOTAL: ${formatBRL(total)}*`);
  lines.push(``, `━━━━━━━━━━━━━━━━━━━━`, ``);
  lines.push(`Aguardo confirmação do pagamento para separar o pedido! 🙌`);
  lines.push(`Obrigado por escolher a Surface. 🔥`);

  const message = lines.join('\n');
  const encoded = encodeURIComponent(message);

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
}
