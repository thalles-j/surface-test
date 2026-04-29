const REQUIRED_PAYMENT_TYPES = ["PIX", "CARTAO", "DINHEIRO"];

export function sanitizePreCheckoutData(data = {}) {
  const cep = String(data?.cep || "").replace(/\D/g, "");

  return {
    nome: String(data?.nome || "").trim(),
    email: String(data?.email || "").trim().toLowerCase(),
    telefone: String(data?.telefone || "").replace(/\D/g, ""),
    tipo_pagamento: String(data?.tipo_pagamento || "").trim().toUpperCase(),
    // Endereço separado
    logradouro: String(data?.logradouro || data?.rua || "").trim(),
    numero: String(data?.numero || "").trim(),
    complemento: String(data?.complemento || "").trim(),
    bairro: String(data?.bairro || "").trim(),
    cidade: String(data?.cidade || "").trim(),
    estado: String(data?.estado || "").trim().toUpperCase(),
    cep: cep.length === 8 ? cep : "",
    // Fallback
    endereco: String(data?.endereco || "").trim(),
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

  // Validação de endereço separado
  const hasAddressFields =
    sanitized.logradouro &&
    sanitized.numero &&
    sanitized.cidade &&
    sanitized.estado &&
    sanitized.cep;

  if (!hasAddressFields && !sanitized.endereco) {
    errors.endereco = "Endereco obrigatorio.";
    if (!sanitized.logradouro) errors.logradouro = "Rua obrigatoria.";
    if (!sanitized.numero) errors.numero = "Numero obrigatorio.";
    if (!sanitized.cidade) errors.cidade = "Cidade obrigatoria.";
    if (!sanitized.estado) errors.estado = "Estado obrigatorio.";
    if (!sanitized.cep) errors.cep = "CEP obrigatorio.";
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
