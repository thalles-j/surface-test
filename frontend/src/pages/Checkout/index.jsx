import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import useAuth from "../../hooks/useAuth";
import { useToast } from "../../context/ToastContext";
import { api } from "../../services/api";
import { resolveImageUrl } from "../../utils/resolveImageUrl";
import { buildWhatsAppCheckoutUrl } from "../../utils/whatsapp";

export default function Checkout() {
  const { cartItems, createOrder, checkoutLoading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const orderCompletedRef = useRef(false);

  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(null);
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

  const fetchPreview = useCallback(
    async (cupom = null) => {
      if (cartItems.length === 0) return;
      setPreviewLoading(true);
      setPreviewError("");
      try {
        const { data } = await api.post("/checkout/preview", {
          items: buildItems(),
          codigo_cupom: cupom,
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
    },
    [cartItems, buildItems]
  );

  useEffect(() => {
    if (cartItems.length === 0 && !orderCompletedRef.current) {
      navigate("/shop");
      return;
    }
    if (cartItems.length > 0) {
      fetchPreview(couponApplied);
    }
  }, [cartItems.length]);

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setCouponError("");
    setCouponLoading(true);
    try {
      await api.post("/checkout/validate-coupon", { codigo: code });
      setCouponApplied(code);
      await fetchPreview(code);
    } catch (err) {
      const msg =
        err.response?.data?.mensagem || "Cupom inválido.";
      setCouponError(msg);
      setCouponApplied(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = async () => {
    setCouponCode("");
    setCouponApplied(null);
    setCouponError("");
    await fetchPreview(null);
  };

  const handleFinalize = async () => {
    if (checkoutLoading) return;
    const itemsSnapshot = [...cartItems];
    try {
      orderCompletedRef.current = true;
      const order = await createOrder(couponApplied);
      if (order) {
        const whatsappUrl = buildWhatsAppCheckoutUrl({
          customerName: user?.nome || user?.name || "Cliente",
          items: itemsSnapshot,
          total: preview?.total ?? order.total,
          orderId: order.id_pedido,
          subtotal: preview?.subtotal ?? order.subtotal,
          desconto: preview?.desconto ?? order.desconto ?? 0,
          frete: preview?.frete ?? order.frete ?? 0,
          codigoCupom: couponApplied,
        });
        window.open(whatsappUrl, "_blank");
        toast.success("Pedido criado! Redirecionando para o WhatsApp...");
        navigate("/account");
      }
    } catch (err) {
      orderCompletedRef.current = false;
      toast.error(err.response?.data?.mensagem || err.message || "Erro ao criar pedido.");
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

  if (!user) {
    navigate("/entrar");
    return null;
  }

  if (cartItems.length === 0 && !orderCompletedRef.current) {
    return null;
  }

  return (
    <section style={{ maxWidth: 800, margin: "2rem auto", padding: "0 1rem" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>
        Checkout
      </h2>

      {/* Order Items */}
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

      {/* Coupon Section */}
      <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "#f9f9f9", borderRadius: 8 }}>
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
              {couponApplied} ✓
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
              placeholder="Digite o código"
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

      {/* Order Summary */}
      <div style={{ padding: "1rem", background: "#f9f9f9", borderRadius: 8, marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.75rem" }}>
          Resumo do Pedido
        </h3>

        {previewLoading && <p style={{ color: "#666" }}>Calculando...</p>}
        {previewError && <p style={{ color: "#d32f2f" }}>{previewError}</p>}

        {preview && !previewLoading && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
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
                <span>Desconto {preview.cupom ? `(${preview.cupom.codigo})` : ""}</span>
                <span>-{formatCurrency(preview.desconto)}</span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
              <span>Frete</span>
              <span style={{ color: preview.frete === 0 ? "#2e7d32" : "inherit" }}>
                {preview.frete === 0 ? "Grátis ✨" : formatCurrency(preview.frete)}
              </span>
            </div>

            <hr style={{ margin: "0.75rem 0", border: "none", borderTop: "1px solid #ddd" }} />

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

      {/* Actions */}
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
          disabled={checkoutLoading || previewLoading}
          style={{
            flex: 1,
            padding: "0.75rem",
            background: "#222",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: checkoutLoading || previewLoading ? "not-allowed" : "pointer",
            fontSize: "1rem",
            fontWeight: 600,
            opacity: checkoutLoading || previewLoading ? 0.6 : 1,
          }}
        >
          {checkoutLoading ? "Processando..." : "Finalizar via WhatsApp"}
        </button>
      </div>
    </section>
  );
}
