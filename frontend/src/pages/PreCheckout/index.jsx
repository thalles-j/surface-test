import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import useAuth from "../../hooks/useAuth";
import { useToast } from "../../context/ToastContext";
import { validatePreCheckoutData, hasCompleteAddress, normalizeAddress } from "../../utils/preCheckout";
import { api } from "../../services/api";

export default function PreCheckout() {
  const { cartItems, preCheckoutData, setPreCheckoutData } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [errors, setErrors] = useState({});
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate("/shop");
    }
  }, [cartItems.length, navigate]);

  useEffect(() => {
    let cancelled = false;
    async function loadFreshProfile() {
      setLoadingProfile(true);
      try {
        const { data } = await api.get("/conta?light=true");
        const profile = data?.usuario || data;
        if (!profile || typeof profile !== "object") {
          if (!cancelled) setLoadingProfile(false);
          return;
        }
        if (cancelled) return;

        const normalizedAddress = normalizeAddress(profile);

        setPreCheckoutData((prev) => ({
          ...prev,
          nome: profile.nome ?? prev.nome ?? "",
          email: profile.email ?? prev.email ?? "",
          telefone: String(profile.telefone ?? prev.telefone ?? "").replace(/\D/g, ""),
          tipo_pagamento: "DINHEIRO",
          logradouro: normalizedAddress.logradouro,
          numero: normalizedAddress.numero,
          complemento: normalizedAddress.complemento,
          bairro: normalizedAddress.bairro,
          cidade: normalizedAddress.cidade,
          estado: normalizedAddress.estado,
          cep: normalizedAddress.cep,
          endereco: "",
        }));
      } catch (err) {
        if (!cancelled && err.response?.status === 401) {
          navigate("/entrar");
        }
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    }
    loadFreshProfile();
    return () => { cancelled = true; };
  }, [setPreCheckoutData, navigate]);

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

  const addr = preCheckoutData;
  const addressComplete = hasCompleteAddress(addr);

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
              value={preCheckoutData.nome ?? ""}
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
                value={preCheckoutData.email ?? ""}
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
                value={preCheckoutData.telefone ?? ""}
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
        {loadingProfile ? (
          <p style={{ fontSize: "0.95rem", color: "var(--app-muted-text)" }}>
            Carregando endereco...
          </p>
        ) : addressComplete ? (
          <div style={{ fontSize: "0.95rem", lineHeight: 1.5 }}>
            <p>
              {addr.logradouro}, {addr.numero}
              {addr.complemento ? ` — ${addr.complemento}` : ""}
            </p>
            <p>{addr.bairro}</p>
            <p>
              {addr.cidade} / {addr.estado} — CEP{" "}
              {String(addr.cep ?? "").replace(/^(\d{5})(\d{3})$/, "$1-$2")}
            </p>
          </div>
        ) : (
          <p style={{ color: "var(--app-danger)", fontSize: "0.95rem" }}>
            Nenhum endereco completo cadastrado.{" "}
            <Link
              to={user ? "/account" : "/entrar"}
              style={{ textDecoration: "underline", color: "var(--app-primary-bg)" }}
            >
              Complete seu endereco no perfil
            </Link>{" "}
            para continuar.
          </p>
        )}
      </div>

      <div style={panelStyle}>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>
          Pagamento
        </h3>
        <p style={{ margin: 0, fontWeight: 600, fontSize: "0.95rem" }}>WhatsApp</p>
        <p style={{ fontSize: "0.82rem", color: "var(--app-muted-text)", margin: "0.25rem 0 0" }}>
          Voce sera direcionado para o WhatsApp ao finalizar.
        </p>
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
          disabled={!addressComplete || loadingProfile}
          style={{
            flex: 1,
            padding: "0.75rem",
            background: "var(--app-primary-bg)",
            color: "var(--app-primary-text)",
            border: "1px solid var(--app-primary-bg)",
            borderRadius: 4,
            cursor: !addressComplete || loadingProfile ? "not-allowed" : "pointer",
            fontSize: "1rem",
            fontWeight: 600,
            opacity: !addressComplete || loadingProfile ? 0.6 : 1,
          }}
        >
          Continuar para Checkout
        </button>
      </div>
    </section>
  );
}