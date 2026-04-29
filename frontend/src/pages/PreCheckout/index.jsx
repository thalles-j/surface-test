import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import useAuth from "../../hooks/useAuth";
import { useToast } from "../../context/ToastContext";
import {
  getPreCheckoutPaymentTypes,
  validatePreCheckoutData,
} from "../../utils/preCheckout";

const ESTADOS = [
  { sigla: "", nome: "Estado" },
  { sigla: "AC", nome: "Acre" },
  { sigla: "AL", nome: "Alagoas" },
  { sigla: "AP", nome: "Amapá" },
  { sigla: "AM", nome: "Amazonas" },
  { sigla: "BA", nome: "Bahia" },
  { sigla: "CE", nome: "Ceará" },
  { sigla: "DF", nome: "Distrito Federal" },
  { sigla: "ES", nome: "Espírito Santo" },
  { sigla: "GO", nome: "Goiás" },
  { sigla: "MA", nome: "Maranhão" },
  { sigla: "MT", nome: "Mato Grosso" },
  { sigla: "MS", nome: "Mato Grosso do Sul" },
  { sigla: "MG", nome: "Minas Gerais" },
  { sigla: "PA", nome: "Pará" },
  { sigla: "PB", nome: "Paraíba" },
  { sigla: "PR", nome: "Paraná" },
  { sigla: "PE", nome: "Pernambuco" },
  { sigla: "PI", nome: "Piauí" },
  { sigla: "RJ", nome: "Rio de Janeiro" },
  { sigla: "RN", nome: "Rio Grande do Norte" },
  { sigla: "RS", nome: "Rio Grande do Sul" },
  { sigla: "RO", nome: "Rondônia" },
  { sigla: "RR", nome: "Roraima" },
  { sigla: "SC", nome: "Santa Catarina" },
  { sigla: "SP", nome: "São Paulo" },
  { sigla: "SE", nome: "Sergipe" },
  { sigla: "TO", nome: "Tocantins" },
];

function maskCep(v) {
  return String(v || "").replace(/\D/g, "").replace(/^(\d{5})(\d)/, "$1-$2").slice(0, 9);
}

export default function PreCheckout() {
  const { cartItems, preCheckoutData, setPreCheckoutData } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [errors, setErrors] = useState({});
  const [cepLoading, setCepLoading] = useState(false);

  const paymentTypes = useMemo(() => getPreCheckoutPaymentTypes(), []);

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate("/shop");
    }
  }, [cartItems.length, navigate]);

  // Preenche dados do usuário logado automaticamente
  useEffect(() => {
    if (!user) return;

    const addr = user.endereco || null;

    setPreCheckoutData((prev) => ({
      ...prev,
      nome: prev.nome || user.nome || "",
      email: prev.email || user.email || "",
      telefone: prev.telefone || String(user.telefone || "").replace(/\D/g, ""),
      tipo_pagamento: prev.tipo_pagamento || "PIX",
      // Endereço separado
      logradouro: prev.logradouro || addr?.logradouro || "",
      numero: prev.numero || addr?.numero || "",
      complemento: prev.complemento || addr?.complemento || "",
      bairro: prev.bairro || addr?.bairro || "",
      cidade: prev.cidade || addr?.cidade || "",
      estado: prev.estado || addr?.estado || "",
      cep: prev.cep || addr?.cep || "",
      // Fallback
      endereco: prev.endereco || "",
    }));
  }, [user, setPreCheckoutData]);

  const handleCepBlur = useCallback(async () => {
    const rawCep = String(preCheckoutData.cep || "").replace(/\D/g, "");
    if (rawCep.length !== 8) return;

    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
      const data = await res.json();
      if (data.erro) {
        setErrors((prev) => ({ ...prev, cep: "CEP nao encontrado." }));
        return;
      }
      setPreCheckoutData((prev) => ({
        ...prev,
        logradouro: prev.logradouro || data.logradouro || "",
        bairro: prev.bairro || data.bairro || "",
        cidade: prev.cidade || data.localidade || "",
        estado: prev.estado || data.uf || "",
      }));
      setErrors((prev) => ({ ...prev, cep: "" }));
    } catch {
      // Silencioso — usuário pode preencher manualmente
    } finally {
      setCepLoading(false);
    }
  }, [preCheckoutData.cep, setPreCheckoutData]);

  if (cartItems.length === 0) return null;

  const panelStyle = {
    marginBottom: "1.5rem",
    padding: "1rem",
    background: "var(--app-surface-alt)",
    borderRadius: 8,
    border: "1px solid var(--app-border)",
  };

  const fieldStyle = {
    width: "100%",
    padding: "0.55rem",
    border: "1px solid var(--app-border)",
    borderRadius: 4,
    background: "var(--app-input-bg)",
    color: "var(--app-input-text)",
  };

  const handleFieldChange = (field, value) => {
    const nextValue =
      field === "telefone" || field === "cep"
        ? String(value || "").replace(/\D/g, "")
        : value;
    setPreCheckoutData((prev) => ({ ...prev, [field]: nextValue }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = () => {
    const validation = validatePreCheckoutData(preCheckoutData);
    setPreCheckoutData((prev) => ({ ...prev, ...validation.sanitized }));
    setErrors(validation.errors);

    if (!validation.isValid) {
      toast.error("Preencha todos os campos obrigatorios.");
      return;
    }

    navigate("/checkout");
  };

  return (
    <section style={{ maxWidth: 800, margin: "2rem auto", padding: "0 1rem" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>
        Dados para entrega
      </h2>

      <div style={panelStyle}>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>
          Informacoes pessoais
        </h3>

        <div style={{ display: "grid", gap: "0.6rem" }}>
          <div>
            <input
              type="text"
              placeholder="Nome completo"
              value={preCheckoutData.nome || ""}
              onChange={(e) => handleFieldChange("nome", e.target.value)}
              style={fieldStyle}
            />
            {errors.nome && (
              <p style={{ color: "var(--app-danger)", fontSize: "0.82rem" }}>{errors.nome}</p>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
            <div>
              <input
                type="email"
                placeholder="Email"
                value={preCheckoutData.email || ""}
                onChange={(e) => handleFieldChange("email", e.target.value)}
                style={fieldStyle}
              />
              {errors.email && (
                <p style={{ color: "var(--app-danger)", fontSize: "0.82rem" }}>{errors.email}</p>
              )}
            </div>
            <div>
              <input
                type="tel"
                placeholder="Telefone"
                value={preCheckoutData.telefone || ""}
                onChange={(e) => handleFieldChange("telefone", e.target.value)}
                style={fieldStyle}
              />
              {errors.telefone && (
                <p style={{ color: "var(--app-danger)", fontSize: "0.82rem" }}>{errors.telefone}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={panelStyle}>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>
          Endereco de entrega
        </h3>

        <div style={{ display: "grid", gap: "0.6rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "0.6rem" }}>
            <div>
              <input
                type="text"
                placeholder="CEP"
                value={maskCep(preCheckoutData.cep || "")}
                onChange={(e) => handleFieldChange("cep", e.target.value)}
                onBlur={handleCepBlur}
                maxLength={9}
                style={fieldStyle}
              />
              {cepLoading && (
                <p style={{ fontSize: "0.75rem", color: "var(--app-muted-text)", marginTop: 2 }}>
                  Buscando...
                </p>
              )}
              {errors.cep && (
                <p style={{ color: "var(--app-danger)", fontSize: "0.82rem" }}>{errors.cep}</p>
              )}
            </div>
            <div>
              <input
                type="text"
                placeholder="Rua / Logradouro"
                value={preCheckoutData.logradouro || ""}
                onChange={(e) => handleFieldChange("logradouro", e.target.value)}
                style={fieldStyle}
              />
              {errors.logradouro && (
                <p style={{ color: "var(--app-danger)", fontSize: "0.82rem" }}>
                  {errors.logradouro}
                </p>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 1fr", gap: "0.6rem" }}>
            <div>
              <input
                type="text"
                placeholder="Numero"
                value={preCheckoutData.numero || ""}
                onChange={(e) => handleFieldChange("numero", e.target.value)}
                style={fieldStyle}
              />
              {errors.numero && (
                <p style={{ color: "var(--app-danger)", fontSize: "0.82rem" }}>{errors.numero}</p>
              )}
            </div>
            <div>
              <input
                type="text"
                placeholder="Complemento (opcional)"
                value={preCheckoutData.complemento || ""}
                onChange={(e) => handleFieldChange("complemento", e.target.value)}
                style={fieldStyle}
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Bairro"
                value={preCheckoutData.bairro || ""}
                onChange={(e) => handleFieldChange("bairro", e.target.value)}
                style={fieldStyle}
              />
              {errors.bairro && (
                <p style={{ color: "var(--app-danger)", fontSize: "0.82rem" }}>{errors.bairro}</p>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 120px", gap: "0.6rem" }}>
            <div>
              <input
                type="text"
                placeholder="Cidade"
                value={preCheckoutData.cidade || ""}
                onChange={(e) => handleFieldChange("cidade", e.target.value)}
                style={fieldStyle}
              />
              {errors.cidade && (
                <p style={{ color: "var(--app-danger)", fontSize: "0.82rem" }}>{errors.cidade}</p>
              )}
            </div>
            <div>
              <select
                value={preCheckoutData.estado || ""}
                onChange={(e) => handleFieldChange("estado", e.target.value)}
                style={fieldStyle}
              >
                {ESTADOS.map((e) => (
                  <option key={e.sigla} value={e.sigla}>
                    {e.sigla ? `${e.sigla} — ${e.nome}` : e.nome}
                  </option>
                ))}
              </select>
              {errors.estado && (
                <p style={{ color: "var(--app-danger)", fontSize: "0.82rem" }}>{errors.estado}</p>
              )}
            </div>
            <div />
          </div>
        </div>
      </div>

      <div style={panelStyle}>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>
          Pagamento
        </h3>
        <div>
          <select
            value={preCheckoutData.tipo_pagamento || "PIX"}
            onChange={(e) => handleFieldChange("tipo_pagamento", e.target.value)}
            style={fieldStyle}
          >
            {paymentTypes.map((type) => (
              <option key={type} value={type}>
                {type === "PIX" && "PIX"}
                {type === "CARTAO" && "Cartao de Credito (Mercado Pago)"}
                {type === "DINHEIRO" && "WhatsApp / Dinheiro"}
              </option>
            ))}
          </select>
          {errors.tipo_pagamento && (
            <p style={{ color: "var(--app-danger)", fontSize: "0.82rem" }}>
              {errors.tipo_pagamento}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem" }}>
        <button
          onClick={() => navigate("/shop")}
          style={{
            flex: 1,
            padding: "0.75rem",
            background: "var(--app-surface)",
            color: "var(--app-text)",
            border: "1px solid var(--app-border)",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          Continuar Comprando
        </button>

        <button
          onClick={handleSubmit}
          style={{
            flex: 1,
            padding: "0.75rem",
            background: "var(--app-primary-bg)",
            color: "var(--app-primary-text)",
            border: "1px solid var(--app-primary-bg)",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: 600,
          }}
        >
          Continuar para Checkout
        </button>
      </div>
    </section>
  );
}
