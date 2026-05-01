const WHATSAPP_NUMBER = '5524988582885';

function formatBRL(value) {
  return `R$ ${(Number(value) || 0).toFixed(2).replace('.', ',')}`;
}

function formatAddress({ logradouro, numero, complemento, bairro, cidade, estado, cep, endereco }) {
  if (endereco) return endereco;
  const parts = [
    [logradouro, numero].filter(Boolean).join(', '),
    complemento,
    bairro,
    [cidade, estado].filter(Boolean).join(' - '),
    cep ? `CEP: ${cep}` : null,
  ].filter(Boolean);
  return parts.join('\n');
}

function formatItem(item, index) {
  const size = item.selectedSize ? `Tamanho: ${item.selectedSize}` : '';
  const lines = [
    `${index + 1}. ${item.nome_produto || 'Produto'}`,
  ];
  if (size) lines.push(`   ${size}`);
  lines.push(`   Qtd: ${item.quantity || 1}`);
  lines.push(`   ${formatBRL(Number(item.preco || 0) * (item.quantity || 1))}`);
  return lines.join('\n');
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
  telefone,
  logradouro,
  numero,
  complemento,
  bairro,
  cidade,
  estado,
  cep,
  endereco,
}) {
  const lines = [
    `*NOVO PEDIDO - SURFACE*`,
    ``,
    `*Cliente:* ${customerName || 'Nao informado'}`,
    `*Pedido:* #${orderId || ''}`,
    `*Telefone:* ${telefone || ''}`,
    `*Endereco:*`,
    formatAddress({ logradouro, numero, complemento, bairro, cidade, estado, cep, endereco }),
    ``,
    `━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `*ITENS:*`,
    ``,
  ];

  (items || []).forEach((item, i) => {
    lines.push(formatItem(item, i));
    lines.push('');
  });

  lines.push(`━━━━━━━━━━━━━━━━━━━━`);
  lines.push('');
  lines.push(`*RESUMO:*`);
  lines.push('');

  if (subtotal != null) {
    lines.push(`Subtotal: ${formatBRL(subtotal)}`);
  }

  if (codigoCupom && Number(desconto) > 0) {
    lines.push(`Cupom ${codigoCupom}: -${formatBRL(desconto)}`);
  }

  if (frete != null) {
    const freteText = Number(frete) > 0 ? formatBRL(frete) : 'Gratis';
    lines.push(`Frete: ${freteText}`);
  }

  lines.push('');
  lines.push(`*TOTAL: ${formatBRL(total)}*`);
  lines.push('');
  lines.push(`━━━━━━━━━━━━━━━━━━━━`);
  lines.push('');
  lines.push(`Aguardamos a confirmacao do pagamento para separar o pedido.`);
  lines.push(`Obrigado por escolher a Surface.`);

  const message = lines.join('\n');
  const encoded = encodeURIComponent(message);

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
}
