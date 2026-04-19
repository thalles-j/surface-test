import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { resolveImageUrl } from "../../utils/resolveImageUrl";
import { api } from "../../services/api";

const CHECKOUT_COUPON_STORAGE_KEY = "checkoutCouponApplied";

export default function Checkout() {
  const {
    cartItems,
    preCheckoutData
  } = useCart();

  const navigate = useNavigate();
  const orderCompletedRef = useRef(false);

  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(() => {
    const stored = localStorage.getItem(CHECKOUT_COUPON_STORAGE_KEY);
    return stored ? String(stored).trim().toUpperCase() : null;
  });

  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  const formatCurrency = (value) =>
    `R$ ${(Number(value) || 0).toFixed(2).replace(".", ",")}`;

  const buildItems = useCallback(
    () =>
      cartItems.map((item) => ({
        id_produto: item.id_produto,
        selectedSize: item.selectedSize,
        sku_variacao: item.sku_variacao || null,
        quantity: item.quantity,
      })),
    [cartItems]
  );

  const fetchPreview = useCallback(async () => {
    if (cartItems.length === 0) return;

    setPreviewLoading(true);
    setPreviewError("");

    try {
      const { data } = await api.post("/checkout/preview", {
        items: buildItems(),
        codigo: couponApplied,
      });

      setPreview(data);
    } catch (err) {
      const msg =
        err.response?.data?.mensagem ||
        err.response?.data?.message ||
        "Erro ao calcular resumo.";

      setPreviewError(msg);
    } finally {
      setPreviewLoading(false);
    }
  }, [cartItems, buildItems, couponApplied]);

  useEffect(() => {
    if (couponApplied) {
      const normalized = String(couponApplied).trim().toUpperCase();
      setCouponCode(normalized);
      localStorage.setItem(CHECKOUT_COUPON_STORAGE_KEY, normalized);
    } else {
      setCouponCode("");
      localStorage.removeItem(CHECKOUT_COUPON_STORAGE_KEY);
    }
  }, [couponApplied]);

  useEffect(() => {
    if (cartItems.length === 0 && !orderCompletedRef.current) {
      try {
        const storedCart = JSON.parse(localStorage.getItem("cartItems") || "[]");
        const hasPersistedCart = Array.isArray(storedCart) && storedCart.length > 0;

        if (hasPersistedCart) {
          return;
        }
      } catch {
        // segue fluxo normal
      }

      navigate("/shop");
      return;
    }

    if (cartItems.length > 0) {
      fetchPreview();
    }
  }, [cartItems.length, fetchPreview, navigate]);

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();

    if (!code || code.length < 3) return;

    setCouponLoading(true);
    setCouponError("");

    try {
      await api.post("/checkout/validate-coupon", {
        codigo: code,
      });

      // Persist immediately after successful validation to avoid refresh timing loss.
      localStorage.setItem(CHECKOUT_COUPON_STORAGE_KEY, code);
      setCouponApplied(code);
    } catch (err) {
      const msg =
        err.response?.data?.mensagem ||
        err.response?.data?.message ||
        "Cupom invalido.";

      setCouponError(msg);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(null);
    setCouponCode("");
    setCouponError("");
    setPreviewError("");
  };

  const getImageUrl = (path) => {
    if (!path) return "https://via.placeholder.com/60?text=Img";
    return resolveImageUrl(path);
  };

  const getFrontImage = (fotos) => {
    if (!fotos || !Array.isArray(fotos) || fotos.length === 0) return null;
    const principal = fotos.find((f) => f.principal);
    if (principal) return principal.url;
    return fotos[0]?.url;
  };

  if (cartItems.length === 0 && !orderCompletedRef.current) {
    return null;
  }

  const panelStyle = {
    marginBottom: "1.5rem",
    padding: "1rem",
    background: "var(--app-surface-alt)",
    borderRadius: 8,
    border: "1px solid var(--app-border)",
  };

  return (
    <section style={{ maxWidth: 800, margin: "2rem auto", padding: "0 1rem" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>
        Checkout
      </h2>

      <div
        style={panelStyle}
      >
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>
          Dados do Pré-checkout
        </h3>

        <div style={{ display: "grid", gap: "0.6rem" }}>
          <p style={{ margin: 0, color: "var(--app-muted-text)" }}><strong>Nome:</strong> {preCheckoutData.nome}</p>
          <p style={{ margin: 0, color: "var(--app-muted-text)" }}><strong>Email:</strong> {preCheckoutData.email}</p>
          <p style={{ margin: 0, color: "var(--app-muted-text)" }}><strong>Telefone:</strong> {preCheckoutData.telefone}</p>
          <p style={{ margin: 0, color: "var(--app-muted-text)" }}><strong>Endereco:</strong> {preCheckoutData.endereco}</p>
          <p style={{ margin: 0, color: "var(--app-muted-text)" }}><strong>Pagamento:</strong> {preCheckoutData.tipo_pagamento}</p>
        </div>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.75rem" }}>
          Itens do Pedido
        </h3>

        {cartItems.map((item, index) => (
          <div
            key={`${item.id_produto}-${item.selectedSize || index}`}
            style={{
              display: "flex",
              gap: "1rem",
              padding: "0.75rem 0",
              borderBottom: "1px solid var(--app-border)",
              alignItems: "center",
            }}
          >
            <img
              src={getImageUrl(getFrontImage(item.fotos))}
              alt={item.nome_produto}
              style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 4 }}
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/60?text=Err";
              }}
            />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600 }}>{item.nome_produto}</p>

              {item.selectedSize && (
                <p style={{ fontSize: "0.85rem", color: "var(--app-muted-text)" }}>
                  Tamanho: {item.selectedSize}
                </p>
              )}

              <p style={{ fontSize: "0.85rem", color: "var(--app-muted-text)" }}>
                {item.quantity}x {formatCurrency(item.preco)}
              </p>
            </div>

            <div style={{ fontWeight: 600 }}>
              {formatCurrency(Number(item.preco) * item.quantity)}
            </div>
          </div>
        ))}
      </div>

      <div
        style={panelStyle}
      >
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>
          Cupom de Desconto
        </h3>

        {couponApplied ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              style={{
                background: "var(--app-surface)",
                color: "var(--app-success)",
                padding: "0.35rem 0.75rem",
                borderRadius: 4,
                fontWeight: 600,
                fontSize: "0.9rem",
              }}
            >
              {couponApplied} (aplicado)
            </span>

            <button
              onClick={handleRemoveCoupon}
              style={{
                background: "none",
                border: "none",
                color: "var(--app-danger)",
                cursor: "pointer",
                fontSize: "0.85rem",
                textDecoration: "underline",
              }}
            >
              Remover
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Digite o codigo"
              style={{
                flex: 1,
                padding: "0.5rem",
                border: "1px solid var(--app-border)",
                borderRadius: 4,
                fontSize: "0.9rem",
                background: "var(--app-input-bg)",
                color: "var(--app-input-text)",
              }}
              onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
            />

            <button
              onClick={handleApplyCoupon}
              disabled={couponLoading || !couponCode.trim()}
              style={{
                padding: "0.5rem 1rem",
                background: "var(--app-primary-bg)",
                color: "var(--app-primary-text)",
                border: "1px solid var(--app-primary-bg)",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              {couponLoading ? "..." : "Aplicar"}
            </button>
          </div>
        )}

        {couponError && (
          <p style={{ color: "var(--app-danger)", fontSize: "0.85rem", marginTop: "0.4rem" }}>
            {couponError}
          </p>
        )}
      </div>

      <div
        style={{
          ...panelStyle,
          marginBottom: "1.5rem",
        }}
      >
        <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.75rem" }}>
          Resumo do Pedido
        </h3>

        {previewLoading && <p style={{ color: "var(--app-muted-text)" }}>Calculando...</p>}
        {previewError && <p style={{ color: "var(--app-danger)" }}>{previewError}</p>}

        {preview && !previewLoading && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.4rem",
              }}
            >
              <span>Subtotal</span>
              <span>{formatCurrency(preview.subtotal)}</span>
            </div>

            {preview.desconto > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.4rem",
                  color: "var(--app-success)",
                }}
              >
                <span>
                  Desconto {preview.cupom ? `(${preview.cupom.codigo})` : ""}
                </span>
                <span>-{formatCurrency(preview.desconto)}</span>
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.4rem",
              }}
            >
              <span>Frete</span>
              <span style={{ color: preview.frete === 0 ? "var(--app-success)" : "inherit" }}>
                {preview.frete === 0 ? "Gratis" : formatCurrency(preview.frete)}
              </span>
            </div>

            <hr
              style={{
                margin: "0.75rem 0",
                border: "none",
                borderTop: "1px solid var(--app-border)",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontWeight: 700,
                fontSize: "1.1rem",
              }}
            >
              <span>Total</span>
              <span>{formatCurrency(preview.total)}</span>
            </div>
          </>
        )}
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
          onClick={() => navigate("/pre-checkout")}
          disabled={previewLoading}
          style={{
            flex: 1,
            padding: "0.75rem",
            background: "var(--app-primary-bg)",
            color: "var(--app-primary-text)",
            border: "1px solid var(--app-primary-bg)",
            borderRadius: 4,
            cursor:
              previewLoading
                ? "not-allowed"
                : "pointer",
            fontSize: "1rem",
            fontWeight: 600,
            opacity:
              previewLoading
                ? 0.6
                : 1
          }}
        >
          Editar dados no Pré-checkout
        </button>
      </div>
    </section>
  );
}
