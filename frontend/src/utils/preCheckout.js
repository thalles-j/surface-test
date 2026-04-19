const REQUIRED_PAYMENT_TYPES = ["PIX", "CARTAO", "DINHEIRO"];

export function sanitizePreCheckoutData(data = {}) {
  return {
    nome: String(data?.nome || "").trim(),
    email: String(data?.email || "").trim().toLowerCase(),
    telefone: String(data?.telefone || "").replace(/\D/g, ""),
    endereco: String(data?.endereco || "").trim(),
    tipo_pagamento: String(data?.tipo_pagamento || "").trim().toUpperCase(),
  };
}

export function validatePreCheckoutData(data = {}) {
  const sanitized = sanitizePreCheckoutData(data);
  const errors = {};

  if (!sanitized.nome) {
    errors.nome = "Nome obrigatorio.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized.email)) {
    errors.email = "Email invalido.";
  }

  if (!/^\d{10,}$/.test(sanitized.telefone)) {
    errors.telefone = "Telefone invalido.";
  }

  if (!sanitized.endereco) {
    errors.endereco = "Endereco obrigatorio.";
  }

  if (!REQUIRED_PAYMENT_TYPES.includes(sanitized.tipo_pagamento)) {
    errors.tipo_pagamento = "Selecione um tipo de pagamento valido.";
  }

  return {
    sanitized,
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

export function isPreCheckoutComplete(data = {}) {
  return validatePreCheckoutData(data).isValid;
}

export function getPreCheckoutPaymentTypes() {
  return REQUIRED_PAYMENT_TYPES;
}
