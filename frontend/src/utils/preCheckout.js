const isFilled = (v) => typeof v === "string" && v.trim().length > 0;

export function normalizeAddress(source) {
  const profile = source?.usuario ?? source?.user ?? source ?? {};
  const rawAddr =
    profile?.endereco ??
    (Array.isArray(profile?.enderecos) && profile.enderecos.length > 0
      ? profile.enderecos.find(e => e?.principal) || profile.enderecos[0]
      : null) ??
    null;

  return {
    logradouro: String(rawAddr?.logradouro ?? rawAddr?.rua ?? "").trim(),
    numero: String(rawAddr?.numero ?? "").trim(),
    complemento: String(rawAddr?.complemento ?? "").trim(),
    bairro: String(rawAddr?.bairro ?? "").trim(),
    cidade: String(rawAddr?.cidade ?? "").trim(),
    estado: String(rawAddr?.estado ?? rawAddr?.uf ?? "").trim().toUpperCase(),
    cep: String(rawAddr?.cep ?? "").replace(/\D/g, ""),
  };
}

export function hasCompleteAddress(data = {}) {
  const addr = data || {};
  return !!(
    isFilled(addr.logradouro) &&
    isFilled(addr.numero) &&
    isFilled(addr.bairro) &&
    isFilled(addr.cidade) &&
    isFilled(addr.estado) &&
    isFilled(addr.cep)
  );
}

export function sanitizePreCheckoutData(data = {}) {
  return {
    nome: String(data?.nome || "").trim(),
    email: String(data?.email || "").trim().toLowerCase(),
    telefone: String(data?.telefone || "").replace(/\D/g, ""),
    tipo_pagamento: "DINHEIRO",
    logradouro: String(data?.logradouro || "").trim(),
    numero: String(data?.numero || "").trim(),
    complemento: String(data?.complemento || "").trim(),
    bairro: String(data?.bairro || "").trim(),
    cidade: String(data?.cidade || "").trim(),
    estado: String(data?.estado || "").trim().toUpperCase(),
    cep: String(data?.cep || "").replace(/\D/g, ""),
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

  return {
    sanitized,
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

export function isPreCheckoutComplete(data = {}) {
  return validatePreCheckoutData(data).isValid;
}
