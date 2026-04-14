import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import useAuth from "../../hooks/useAuth";
import { useToast } from "../../context/ToastContext";
import { api } from "../../services/api";
import { resolveImageUrl } from "../../utils/resolveImageUrl";

const CHECKOUT_COUPON_STORAGE_KEY = "checkoutCouponApplied";

export default function Checkout() {
  const {
    cartItems,
    createOrder,
    checkoutLoading,
    preCheckoutData,
    setPreCheckoutData,
  } = useCart();

  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
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

  const [preCheckoutErrors, setPreCheckoutErrors] = useState({});

  const formatCurrency = (value) =>
    `R$ ${(Number(value) || 0).toFixed(2).replace(".", ",")}`;

  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());

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

  const isPreCheckoutValid =
    String(preCheckoutData?.nome || "").trim().length > 1 &&
    validateEmail(preCheckoutData?.email || "") &&
    String(preCheckoutData?.telefone || "").replace(/\D/g, "").length >= 10;

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
    if (!user) return;

    setPreCheckoutData((prev) => ({
      nome: prev.nome || user.nome || "",
      email: prev.email || user.email || "",
      telefone: prev.telefone || user.telefone || "",
    }));
  }, [user, setPreCheckoutData]);

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

  const handleCustomerFieldChange = (field, value) => {
    setPreCheckoutData((prev) => ({ ...prev, [field]: value }));
    setPreCheckoutErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validatePreCheckout = () => {
    const errors = {};

    if (!String(preCheckoutData?.nome || "").trim()) {
      errors.nome = "Nome obrigatorio.";
    }

    if (!validateEmail(preCheckoutData?.email || "")) {
      errors.email = "Email invalido.";
    }

    const cleanPhone = String(preCheckoutData?.telefone || "").replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      errors.telefone = "Telefone invalido.";
    }

    setPreCheckoutErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFinalize = async () => {
    if (checkoutLoading) return;

    if (!validatePreCheckout()) {
      toast.error("Preencha nome, email e telefone para continuar.");
      return;
    }

    try {
      orderCompletedRef.current = true;
      const result = await createOrder(couponApplied, preCheckoutData);

      if (result) {
        setCouponApplied(null);
        localStorage.removeItem(CHECKOUT_COUPON_STORAGE_KEY);

        toast.success("Pedido criado com sucesso!");

        if (result.whatsappUrl) {
          window.location.href = result.whatsappUrl;
        } else if (user) {
          navigate("/account");
        } else {
          navigate(
            `/entrar?modo=first-access&email=${encodeURIComponent(
              preCheckoutData.email || ""
            )}`
          );
        }
      } else {
        orderCompletedRef.current = false;
        toast.error("Nao foi possivel criar o pedido.");
      }
    } catch (err) {
      orderCompletedRef.current = false;
      toast.error(
        err.response?.data?.mensagem ||
          err.message ||
          "Erro ao criar pedido."
      );
    }
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

  return (
    <section style={{ maxWidth: 800, margin: "2rem auto", padding: "0 1rem" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>
        Checkout
      </h2>

      <div
        style={{
          marginBottom: "1.5rem",
          padding: "1rem",
          background: "#f9f9f9",
          borderRadius: 8,
        }}
      >
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>
          Antes de finalizar
        </h3>

        <div style={{ display: "grid", gap: "0.6rem" }}>
          <div>
            <input
              type="text"
              placeholder="Nome completo"
              value={preCheckoutData.nome}
              onChange={(e) => handleCustomerFieldChange("nome", e.target.value)}
              style={{
                width: "100%",
                padding: "0.55rem",
                border: "1px solid #ddd",
                borderRadius: 4,
              }}
            />
            {preCheckoutErrors.nome && (
              <p style={{ color: "#d32f2f", fontSize: "0.82rem" }}>
                {preCheckoutErrors.nome}
              </p>
            )}
          </div>

          <div>
            <input
              type="email"
              placeholder="Email"
              value={preCheckoutData.email}
              onChange={(e) => handleCustomerFieldChange("email", e.target.value)}
              style={{
                width: "100%",
                padding: "0.55rem",
                border: "1px solid #ddd",
                borderRadius: 4,
              }}
            />
            {preCheckoutErrors.email && (
              <p style={{ color: "#d32f2f", fontSize: "0.82rem" }}>
                {preCheckoutErrors.email}
              </p>
            )}
          </div>

          <div>
            <input
              type="tel"
              placeholder="Telefone"
              value={preCheckoutData.telefone}
              onChange={(e) => handleCustomerFieldChange("telefone", e.target.value)}
              style={{
                width: "100%",
                padding: "0.55rem",
                border: "1px solid #ddd",
                borderRadius: 4,
              }}
            />
            {preCheckoutErrors.telefone && (
              <p style={{ color: "#d32f2f", fontSize: "0.82rem" }}>
                {preCheckoutErrors.telefone}
              </p>
            )}
          </div>
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
              borderBottom: "1px solid #eee",
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
                <p style={{ fontSize: "0.85rem", color: "#666" }}>
                  Tamanho: {item.selectedSize}
                </p>
              )}

              <p style={{ fontSize: "0.85rem", color: "#666" }}>
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
        style={{
          marginBottom: "1.5rem",
          padding: "1rem",
          background: "#f9f9f9",
          borderRadius: 8,
        }}
      >
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>
          Cupom de Desconto
        </h3>

        {couponApplied ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              style={{
                background: "#e8f5e9",
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
                color: "#d32f2f",
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
                border: "1px solid #ddd",
                borderRadius: 4,
                fontSize: "0.9rem",
              }}
              onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
            />

            <button
              onClick={handleApplyCoupon}
              disabled={couponLoading || !couponCode.trim()}
              style={{
                padding: "0.5rem 1rem",
                background: "#222",
                color: "#fff",
                border: "none",
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
          <p style={{ color: "#d32f2f", fontSize: "0.85rem", marginTop: "0.4rem" }}>
            {couponError}
          </p>
        )}
      </div>

      <div
        style={{
          padding: "1rem",
          background: "#f9f9f9",
          borderRadius: 8,
          marginBottom: "1.5rem",
        }}
      >
        <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.75rem" }}>
          Resumo do Pedido
        </h3>

        {previewLoading && <p style={{ color: "#666" }}>Calculando...</p>}
        {previewError && <p style={{ color: "#d32f2f" }}>{previewError}</p>}

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
                  color: "#2e7d32",
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
              <span style={{ color: preview.frete === 0 ? "#2e7d32" : "inherit" }}>
                {preview.frete === 0 ? "Gratis" : formatCurrency(preview.frete)}
              </span>
            </div>

            <hr
              style={{
                margin: "0.75rem 0",
                border: "none",
                borderTop: "1px solid #ddd",
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
            background: "#fff",
            border: "1px solid #222",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          Continuar Comprando
        </button>

        <button
          onClick={handleFinalize}
          disabled={checkoutLoading || previewLoading || !isPreCheckoutValid}
          style={{
            flex: 1,
            padding: "0.75rem",
            background: "#222",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor:
              checkoutLoading || previewLoading || !isPreCheckoutValid
                ? "not-allowed"
                : "pointer",
            fontSize: "1rem",
            fontWeight: 600,
            opacity:
              checkoutLoading || previewLoading || !isPreCheckoutValid ? 0.6 : 1,
          }}
        >
          {checkoutLoading ? "Processando..." : "Finalizar via WhatsApp"}
        </button>
      </div>
    </section>
  );
}
