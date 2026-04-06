const BRAND = {
  name: 'Surface',
  color: '#ffffff',
  bgDark: '#09090b',
  bgCard: '#18181b',
  textMuted: '#a1a1aa',
  border: '#27272a',
};

function layout(content, preheader = '') {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${BRAND.name}</title>
${preheader ? `<span style="display:none!important;font-size:1px;color:${BRAND.bgDark};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span>` : ''}
</head>
<body style="margin:0;padding:0;background-color:${BRAND.bgDark};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bgDark};padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
  <!-- Logo -->
  <tr><td align="center" style="padding:0 0 32px;">
    <span style="font-size:22px;font-weight:900;letter-spacing:6px;color:${BRAND.color};text-transform:uppercase;">${BRAND.name}</span>
  </td></tr>
  <!-- Card -->
  <tr><td style="background-color:${BRAND.bgCard};border:1px solid ${BRAND.border};border-radius:12px;padding:32px;">
    ${content}
  </td></tr>
  <!-- Footer -->
  <tr><td align="center" style="padding:24px 0 0;">
    <p style="margin:0;font-size:11px;color:#52525b;line-height:1.6;">
      ${BRAND.name} &copy; ${new Date().getFullYear()} &mdash; Todos os direitos reservados.<br/>
      Este e-mail foi enviado automaticamente. Não responda diretamente.
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function heading(text) {
  return `<h1 style="margin:0 0 8px;font-size:20px;font-weight:800;color:${BRAND.color};letter-spacing:-0.3px;">${text}</h1>`;
}

function subtext(text) {
  return `<p style="margin:0 0 24px;font-size:13px;color:${BRAND.textMuted};line-height:1.6;">${text}</p>`;
}

function divider() {
  return `<hr style="border:none;border-top:1px solid ${BRAND.border};margin:24px 0;"/>`;
}

function button(text, url) {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr>
    <td style="background-color:${BRAND.color};border-radius:8px;padding:12px 28px;">
      <a href="${url}" style="color:${BRAND.bgDark};font-size:13px;font-weight:700;text-decoration:none;letter-spacing:0.5px;text-transform:uppercase;">${text}</a>
    </td>
  </tr></table>`;
}

function infoRow(label, value) {
  return `<tr>
    <td style="padding:6px 0;font-size:12px;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:0.5px;font-weight:600;width:140px;">${label}</td>
    <td style="padding:6px 0;font-size:13px;color:${BRAND.color};font-weight:500;">${value}</td>
  </tr>`;
}

// ─── Templates ────────────────────────────────────────

export function orderConfirmation({ orderId, items, subtotal, desconto, frete, total, customerName }) {
  const itemsHtml = (items || []).map(i =>
    `<tr>
      <td style="padding:8px 0;font-size:13px;color:${BRAND.color};border-bottom:1px solid ${BRAND.border};">${i.nome} <span style="color:${BRAND.textMuted};">(${i.tamanho || '—'})</span></td>
      <td style="padding:8px 0;font-size:13px;color:${BRAND.textMuted};text-align:center;border-bottom:1px solid ${BRAND.border};">${i.quantidade}x</td>
      <td style="padding:8px 0;font-size:13px;color:${BRAND.color};text-align:right;border-bottom:1px solid ${BRAND.border};">R$ ${Number(i.preco).toFixed(2)}</td>
    </tr>`
  ).join('');

  const content = `
    ${heading('Pedido Confirmado')}
    ${subtext(`Olá${customerName ? ` ${customerName}` : ''}, recebemos seu pedido e ele já está sendo processado.`)}
    
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:4px;">
      ${infoRow('Pedido', `#${orderId}`)}
    </table>
    
    ${divider()}
    
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:0 0 8px;font-size:11px;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:1px;font-weight:700;">Produto</td>
        <td style="padding:0 0 8px;font-size:11px;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:1px;font-weight:700;text-align:center;">Qtd</td>
        <td style="padding:0 0 8px;font-size:11px;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:1px;font-weight:700;text-align:right;">Preço</td>
      </tr>
      ${itemsHtml}
    </table>
    
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
      ${subtotal ? infoRow('Subtotal', `R$ ${Number(subtotal).toFixed(2)}`) : ''}
      ${desconto ? infoRow('Desconto', `- R$ ${Number(desconto).toFixed(2)}`) : ''}
      ${frete !== undefined ? infoRow('Frete', frete > 0 ? `R$ ${Number(frete).toFixed(2)}` : 'Grátis') : ''}
      <tr>
        <td style="padding:12px 0 0;font-size:14px;color:${BRAND.color};font-weight:800;border-top:1px solid ${BRAND.border};width:140px;">TOTAL</td>
        <td style="padding:12px 0 0;font-size:14px;color:${BRAND.color};font-weight:800;border-top:1px solid ${BRAND.border};">R$ ${Number(total).toFixed(2)}</td>
      </tr>
    </table>
    
    ${subtext('<br/>Você receberá atualizações sobre o status do seu pedido por e-mail.')}
  `;

  return {
    subject: `Pedido #${orderId} confirmado — ${BRAND.name}`,
    html: layout(content, `Seu pedido #${orderId} foi confirmado!`),
  };
}

export function orderStatusUpdate({ orderId, statusDe, statusPara, customerName }) {
  const statusLabels = {
    pendente: 'Pendente',
    confirmado: 'Confirmado',
    em_separacao: 'Em Separação',
    enviado: 'Enviado',
    finalizado: 'Finalizado',
    cancelado: 'Cancelado',
    processando: 'Processando',
    concluido: 'Concluído',
  };

  const newLabel = statusLabels[statusPara] || statusPara;
  const oldLabel = statusLabels[statusDe] || statusDe;

  const statusColor = {
    confirmado: '#3b82f6',
    em_separacao: '#a855f7',
    enviado: '#6366f1',
    finalizado: '#10b981',
    cancelado: '#ef4444',
  }[statusPara] || BRAND.color;

  const content = `
    ${heading('Atualização do Pedido')}
    ${subtext(`Olá${customerName ? ` ${customerName}` : ''}, o status do seu pedido foi atualizado.`)}
    
    <table width="100%" cellpadding="0" cellspacing="0">
      ${infoRow('Pedido', `#${orderId}`)}
      ${infoRow('Status Anterior', oldLabel)}
    </table>
    
    ${divider()}
    
    <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr><td align="center">
        <span style="display:inline-block;padding:10px 24px;background-color:${statusColor};color:#fff;font-size:13px;font-weight:700;border-radius:8px;letter-spacing:1px;text-transform:uppercase;">${newLabel}</span>
      </td></tr>
    </table>
    
    ${statusPara === 'cancelado' ? subtext('<br/>Se você não solicitou este cancelamento, entre em contato conosco.') : ''}
    ${statusPara === 'enviado' ? subtext('<br/>Seu pedido está a caminho! Você receberá informações de rastreio em breve.') : ''}
    ${statusPara === 'finalizado' ? subtext('<br/>Obrigado por comprar na Surface! Esperamos que aproveite.') : ''}
  `;

  return {
    subject: `Pedido #${orderId} — ${newLabel} | ${BRAND.name}`,
    html: layout(content, `Seu pedido #${orderId} foi atualizado para ${newLabel}`),
  };
}

export function welcome({ name, email }) {
  const content = `
    ${heading('Bem-vindo à Surface')}
    ${subtext(`Olá ${name || ''},<br/><br/>Sua conta foi criada com sucesso. Agora você tem acesso a toda nossa coleção e pode acompanhar seus pedidos.`)}
    
    <table width="100%" cellpadding="0" cellspacing="0">
      ${infoRow('E-mail', email)}
    </table>
    
    ${subtext('<br/>Explore nossos produtos e encontre seu estilo.')}
  `;

  return {
    subject: `Bem-vindo à ${BRAND.name}`,
    html: layout(content, `Sua conta Surface foi criada com sucesso!`),
  };
}

export function passwordReset({ name, resetUrl }) {
  const content = `
    ${heading('Redefinir Senha')}
    ${subtext(`Olá${name ? ` ${name}` : ''}, recebemos uma solicitação para redefinir a senha da sua conta.`)}
    
    ${button('Redefinir Minha Senha', resetUrl)}
    
    ${subtext('Se você não solicitou esta alteração, ignore este e-mail. O link expira em 1 hora.')}
    
    <p style="margin:0;font-size:11px;color:#52525b;word-break:break-all;">${resetUrl}</p>
  `;

  return {
    subject: `Redefinição de senha — ${BRAND.name}`,
    html: layout(content, 'Alguém solicitou a redefinição da sua senha.'),
  };
}
