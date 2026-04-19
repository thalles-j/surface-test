import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import useAuth from "../../hooks/useAuth";
import { useToast } from "../../context/ToastContext";
import { api } from "../../services/api";
import {
  getPreCheckoutPaymentTypes,
  validatePreCheckoutData,
} from "../../utils/preCheckout";

const CHECKOUT_COUPON_STORAGE_KEY = "checkoutCouponApplied";

export default function PreCheckout() {
  const { cartItems, preCheckoutData, setPreCheckoutData } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const paymentTypes = useMemo(() => getPreCheckoutPaymentTypes(), []);

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate("/shop");
    }
  }, [cartItems.length, navigate]);

  useEffect(() => {
    if (!user) return;

    setPreCheckoutData((prev) => ({
      ...prev,
      nome: prev.nome || user.nome || "",
      email: prev.email || user.email || "",
      telefone: prev.telefone || String(user.telefone || "").replace(/\D/g, ""),
      endereco: prev.endereco || "",
      tipo_pagamento: prev.tipo_pagamento || "PIX",
    }));
  }, [user, setPreCheckoutData]);

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
      field === "telefone" ? String(value || "").replace(/\D/g, "") : value;
    setPreCheckoutData((prev) => ({ ...prev, [field]: nextValue }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async () => {
    if (submitting) return;

    const validation = validatePreCheckoutData(preCheckoutData);
    setPreCheckoutData((prev) => ({ ...prev, ...validation.sanitized }));
    setErrors(validation.errors);

    if (!validation.isValid) {
      toast.error("Preencha todos os campos obrigatorios.");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError("");
      const appliedCoupon = localStorage.getItem(CHECKOUT_COUPON_STORAGE_KEY);
      const codigoCupom = appliedCoupon ? String(appliedCoupon).trim().toUpperCase() : null;
      const items = cartItems.map((item) => ({
        id_produto: item.id_produto,
        selectedSize: item.selectedSize,
        sku_variacao: item.sku_variacao || null,
        quantity: item.quantity,
      }));

      const { data } = await api.post("/checkout/pre-checkout", {
        ...validation.sanitized,
        items,
        codigo: codigoCupom,
      });
      const whatsappUrl = data?.whatsappUrl;

      if (!whatsappUrl) {
        throw new Error("Resposta sem whatsappUrl.");
      }

      window.location.href = whatsappUrl;
    } catch (err) {
      const message =
        err.response?.data?.mensagem ||
        err.response?.data?.message ||
        err.message ||
        "Erro ao iniciar pre-checkout.";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section style={{ maxWidth: 800, margin: "2rem auto", padding: "0 1rem" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>
        Pre-checkout
      </h2>

      <div
        style={panelStyle}
      >
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>
          Dados para finalizar no WhatsApp
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
              placeholder="Telefone (somente numeros)"
              value={preCheckoutData.telefone || ""}
              onChange={(e) => handleFieldChange("telefone", e.target.value)}
              style={fieldStyle}
            />
            {errors.telefone && (
              <p style={{ color: "var(--app-danger)", fontSize: "0.82rem" }}>{errors.telefone}</p>
            )}
          </div>

          <div>
            <input
              type="text"
              placeholder="Endereco completo"
              value={preCheckoutData.endereco || ""}
              onChange={(e) => handleFieldChange("endereco", e.target.value)}
              style={fieldStyle}
            />
            {errors.endereco && (
              <p style={{ color: "var(--app-danger)", fontSize: "0.82rem" }}>{errors.endereco}</p>
            )}
          </div>

          <div>
            <select
              value={preCheckoutData.tipo_pagamento || "PIX"}
              onChange={(e) => handleFieldChange("tipo_pagamento", e.target.value)}
              style={fieldStyle}
            >
              {paymentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
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
      </div>

      {submitError && (
        <p style={{ color: "var(--app-danger)", fontSize: "0.9rem", marginBottom: "0.75rem" }}>
          {submitError}
        </p>
      )}

      <div style={{ display: "flex", gap: "1rem" }}>
        <button
          onClick={() => navigate("/checkout")}
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
          Ir para Checkout
        </button>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            flex: 1,
            padding: "0.75rem",
            background: "var(--app-primary-bg)",
            color: "var(--app-primary-text)",
            border: "1px solid var(--app-primary-bg)",
            borderRadius: 4,
            cursor: submitting ? "not-allowed" : "pointer",
            fontSize: "1rem",
            fontWeight: 600,
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? "Enviando..." : "Finalizar pelo WhatsApp"}
        </button>
      </div>
    </section>
  );
}
