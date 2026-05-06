export function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function buildAddressLine(data) {
  if (!data) return "";

  const { rua, numero, cidade, estado } = data;

  if (!rua || !numero || !cidade || !estado) return "";

  return `${rua}, ${numero} - ${cidade}/${estado}`;
}