import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { resolveImageUrl } from "../../utils/resolveImageUrl";
import { api } from "../../services/api";
import { buildWhatsAppCheckoutUrl } from "../../utils/whatsapp";
import styles from "./style.module.css";

const CHECKOUT_COUPON_STORAGE_KEY = "checkoutCouponApplied";

function formatCurrency(value) {
  return `R$ ${(Number(value) || 0).toFixed(2).replace(".", ",")}`;
}

function maskCep(v) {
  return String(v || "").replace(/\D/g, "").replace(/^(\d{5})(\d)/, "$1-$2").slice(0, 9);
}

export default function Checkout() {
  const { cartItems, preCheckoutData, setPreCheckoutData, clearCart } = useCart();
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

  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState("");

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
      const cleanCep = String(preCheckoutData?.cep || "").replace(/\D/g, "");
      const { data } = await api.post("/checkout/preview", {
        items: buildItems(),
        codigo: couponApplied,
        cep: cleanCep.length === 8 ? cleanCep : null,
      });
      setPreview(data);
    } catch (err) {
      setPreviewError(
        err.response?.data?.mensagem || err.response?.data?.message || "Erro ao calcular resumo."
      );
    } finally {
      setPreviewLoading(false);
    }
  }, [cartItems, buildItems, couponApplied, preCheckoutData?.cep]);

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
      navigate("/shop");
      return;
    }
    if (cartItems.length > 0) fetchPreview();
  }, [cartItems.length, fetchPreview, navigate]);

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code || code.length < 3) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      await api.post("/checkout/validate-coupon", { codigo: code });
      localStorage.setItem(CHECKOUT_COUPON_STORAGE_KEY, code);
      setCouponApplied(code);
    } catch (err) {
      setCouponError(err.response?.data?.mensagem || err.response?.data?.message || "Cupom inválido.");
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
    if (!path) return "https://via.placeholder.com/64?text=Img";
    return resolveImageUrl(path);
  };

  const getFrontImage = (fotos) => {
    if (!fotos || !Array.isArray(fotos) || fotos.length === 0) return null;
    const principal = fotos.find((f) => f.principal);
    if (principal) return principal.url;
    return fotos[0]?.url;
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!preview) return;
    if (!preCheckoutData?.nome || !preCheckoutData?.email) {
      navigate("/pre-checkout");
      return;
    }
    setSubmitting(true);
    setOrderError("");

    try {
      const cleanCep = String(preCheckoutData.cep || "").replace(/\D/g, "");
      const { data: orderRes } = await api.post("/checkout/order", {
        items: buildItems(),
        codigo: couponApplied,
        nome: preCheckoutData.nome,
        email: preCheckoutData.email,
        telefone: preCheckoutData.telefone,
        tipo_pagamento: "DINHEIRO",
        cep: cleanCep.length === 8 ? cleanCep : null,
        logradouro: preCheckoutData.logradouro || null,
        numero: preCheckoutData.numero || null,
        complemento: preCheckoutData.complemento || null,
        bairro: preCheckoutData.bairro || null,
        cidade: preCheckoutData.cidade || null,
        estado: preCheckoutData.estado || null,
      });

      const idPedido = orderRes.pedido.id_pedido;
      const total = orderRes.pedido.total;
      orderCompletedRef.current = true;

      const url = buildWhatsAppCheckoutUrl({
        customerName: preCheckoutData.nome,
        items: cartItems,
        total,
        orderId: idPedido,
        subtotal: preview.subtotal,
        desconto: preview.desconto,
        frete: preview.frete,
        codigoCupom: couponApplied,
        telefone: preCheckoutData.telefone,
        logradouro: preCheckoutData.logradouro,
        numero: preCheckoutData.numero,
        complemento: preCheckoutData.complemento,
        bairro: preCheckoutData.bairro,
        cidade: preCheckoutData.cidade,
        estado: preCheckoutData.estado,
        cep: preCheckoutData.cep,
      });
      clearCart();
      window.location.href = url;
    } catch (err) {
      setOrderError(
        err.response?.data?.mensagem || err.response?.data?.message || "Erro ao finalizar pedido."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (cartItems.length === 0 && !orderCompletedRef.current) {
    return null;
  }

  const finalFrete = preview?.frete ?? 0;
  const finalTotal = preview ? preview.subtotal - preview.desconto + finalFrete : 0;

  const addr = preCheckoutData || {};
  const addressLine = [
    addr.logradouro,
    addr.numero,
    addr.complemento,
    addr.bairro,
    addr.cidade,
    addr.estado,
    addr.cep ? maskCep(addr.cep) : null,
  ].filter(Boolean).join(", ");

  return (
    <section className={styles.checkout}>
      <h2 className={styles.titulo}>Finalizar Compra</h2>

      {/* Dados do Cliente */}
      <div className={styles.painel}>
        <h3 className={styles.painelTitulo}>Dados do Cliente</h3>
        <div style={{ display: "grid", gap: "0.6rem" }}>
          <input
            type="text"
            placeholder="Nome completo"
            value={(preCheckoutData && preCheckoutData.nome) || ""}
            onChange={(e) => setPreCheckoutData((p) => ({ ...p, nome: e.target.value }))}
            style={{ width: "100%", padding: "0.55rem", borderRadius: 4, border: "1px solid var(--app-border)", background: "var(--app-input-bg)", color: "var(--app-input-text)" }}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
            <input
              type="email"
              placeholder="Email"
              value={(preCheckoutData && preCheckoutData.email) || ""}
              onChange={(e) => setPreCheckoutData((p) => ({ ...p, email: e.target.value }))}
              style={{ width: "100%", padding: "0.55rem", borderRadius: 4, border: "1px solid var(--app-border)", background: "var(--app-input-bg)", color: "var(--app-input-text)" }}
            />
            <input
              type="tel"
              placeholder="Telefone"
              value={(preCheckoutData && preCheckoutData.telefone) || ""}
              onChange={(e) => setPreCheckoutData((p) => ({ ...p, telefone: String(e.target.value).replace(/\D/g, "") }))}
              style={{ width: "100%", padding: "0.55rem", borderRadius: 4, border: "1px solid var(--app-border)", background: "var(--app-input-bg)", color: "var(--app-input-text)" }}
            />
          </div>
        </div>

        <h3 className={styles.painelTitulo} style={{ marginTop: "1rem" }}>Endereço de Entrega</h3>
        {addressLine ? (
          <p style={{ fontSize: "0.95rem", lineHeight: 1.5, margin: 0 }}>{addressLine}</p>
        ) : (
          <p style={{ color: "var(--app-danger)", fontSize: "0.95rem", margin: 0 }}>
            Endereço incompleto. Volte ao pré-checkout para atualizar.
          </p>
        )}
      </div>

      {/* Itens */}
      <div className={styles.painel}>
        <h3 className={styles.painelTitulo}>Itens do Pedido</h3>
        <div className={styles.listaItens}>
          {cartItems.map((item, index) => (
            <div key={`${item.id_produto}-${item.selectedSize || index}`} className={styles.item}>
              <img
                src={getImageUrl(getFrontImage(item.fotos))}
                alt={item.nome_produto}
                className={styles.imagemItem}
                onError={(e) => { e.target.src = "https://via.placeholder.com/64?text=Err"; }}
              />
              <div className={styles.detalhesItem}>
                <p className={styles.nomeItem}>{item.nome_produto}</p>
                {item.selectedSize && (
                  <p className={styles.metaItem}>Tamanho: {item.selectedSize}</p>
                )}
                <p className={styles.metaItem}>
                  {item.quantity}x {formatCurrency(item.preco)}
                </p>
              </div>
              <div className={styles.precoItem}>
                {formatCurrency(Number(item.preco) * item.quantity)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cupom */}
      <div className={styles.painel}>
        <h3 className={styles.painelTitulo}>Cupom de Desconto</h3>
        {couponApplied ? (
          <div className={styles.tagCupom}>
            <span>{couponApplied} (aplicado)</span>
            <button className={styles.botaoRemoverCupom} onClick={handleRemoveCoupon}>
              Remover
            </button>
          </div>
        ) : (
          <div className={styles.cupomContainer}>
            <input
              type="text"
              className={styles.inputCupom}
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Digite o código"
              onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
            />
            <button
              className={styles.botaoAplicarCupom}
              onClick={handleApplyCoupon}
              disabled={couponLoading || !couponCode.trim()}
            >
              {couponLoading ? "..." : "Aplicar"}
            </button>
          </div>
        )}
        {couponError && <p className={styles.erro}>{couponError}</p>}
      </div>

      {/* Resumo */}
      <div className={styles.painel}>
        <h3 className={styles.painelTitulo}>Resumo</h3>
        {previewLoading && <p className={styles.carregando}>Calculando...</p>}
        {previewError && <p className={styles.erro}>{previewError}</p>}
        {preview && !previewLoading && (
          <>
            <div className={styles.linhaResumo}>
              <span>Subtotal</span>
              <span>{formatCurrency(preview.subtotal)}</span>
            </div>
            {preview.desconto > 0 && (
              <div className={`${styles.linhaResumo} ${styles.desconto}`}>
                <span>Desconto {preview.cupom ? `(${preview.cupom.codigo})` : ""}</span>
                <span>-{formatCurrency(preview.desconto)}</span>
              </div>
            )}
            <div className={styles.linhaResumo}>
              <span>Frete</span>
              <span style={{ color: finalFrete === 0 ? "var(--app-success)" : "inherit" }}>
                {finalFrete === 0 ? "Grátis" : formatCurrency(finalFrete)}
              </span>
            </div>
            <div className={styles.linhaTotal}>
              <span>Total</span>
              <span>{formatCurrency(finalTotal)}</span>
            </div>
          </>
        )}
      </div>

      {/* Pagamento */}
      <div className={styles.painel}>
        <h3 className={styles.painelTitulo}>Forma de Pagamento</h3>
        <p style={{ fontSize: "0.95rem", fontWeight: 600, margin: 0 }}>WhatsApp</p>
        <p style={{ fontSize: "0.82rem", color: "var(--app-muted-text)", margin: "0.25rem 0 0" }}>
          Você será direcionado para o WhatsApp ao finalizar.
        </p>
      </div>

      {orderError && <p className={styles.erro} style={{ marginBottom: "1rem" }}>{orderError}</p>}

      <div className={styles.acoes} style={{ flexDirection: "column", gap: "0.75rem" }}>
        <button className={styles.botaoSecundario} onClick={() => navigate("/shop")}>
          Continuar Comprando
        </button>

        <button
          className={styles.botaoWhatsApp}
          onClick={handleSubmit}
          disabled={submitting || previewLoading || !preview}
        >
          {submitting ? "Processando..." : "💬 Finalizar pelo WhatsApp"}
        </button>
      </div>
    </section>
  );
}
