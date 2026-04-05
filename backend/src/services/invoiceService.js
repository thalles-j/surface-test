/**
 * Serviço de Nota Fiscal (Placeholder)
 * 
 * Preparado para integração futura com:
 * - NF-e via SEFAZ
 * - APIs de emissão (Nuvem Fiscal, Bling, Omie)
 * - Geração de PDF
 */

export const INVOICE_STATUS = {
  DRAFT: 'rascunho',
  ISSUED: 'emitida',
  CANCELLED: 'cancelada',
};

/**
 * Gera uma nota fiscal para um pedido
 * @param {Object} params - { orderId, items, customer, total }
 * @returns {Object} - { invoiceId, number, status, pdfUrl }
 */
export async function generateInvoice({ orderId, items, customer, total }) {
  // TODO: Integrar com API de emissão real
  console.log(`[InvoiceService] Gerando NF para pedido #${orderId}, total R$${total}`);
  return {
    invoiceId: `nf_${Date.now()}`,
    number: null,
    status: INVOICE_STATUS.DRAFT,
    pdfUrl: null,
  };
}

/**
 * Consulta nota fiscal
 * @param {string} invoiceId
 * @returns {Object}
 */
export async function getInvoice(invoiceId) {
  // TODO: Buscar no banco ou API externa
  return {
    invoiceId,
    number: null,
    status: INVOICE_STATUS.DRAFT,
    pdfUrl: null,
  };
}

/**
 * Cancela uma nota fiscal
 * @param {string} invoiceId
 * @param {string} reason
 * @returns {Object}
 */
export async function cancelInvoice(invoiceId, reason) {
  // TODO: Cancelar via API real
  console.log(`[InvoiceService] Cancelando NF ${invoiceId}: ${reason}`);
  return {
    invoiceId,
    status: INVOICE_STATUS.CANCELLED,
  };
}
