import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { resolveImageUrl } from "../../utils/resolveImageUrl";
import { api } from "../../services/api";
import { buildWhatsAppCheckoutUrl } from "../../utils/whatsapp";
import QRCode from "qrcode";
import styles from "./style.module.css";

const CHECKOUT_COUPON_STORAGE_KEY = "checkoutCouponApplied";

function formatCurrency(value) {
  return `R$ ${(Number(value) || 0).toFixed(2).replace(".", ",")}`;
}

function maskCep(v) {
  return String(v || "").replace(/\D/g, "").replace(/^(\d{5})(\d)/, "$1-$2").slice(0, 9);
}

function translatePaymentType(tipo) {
  const map = {
    PIX: "PIX",
    CARTAO: "Cartão de Crédito (Mercado Pago)",
    DINHEIRO: "WhatsApp",
  };
  return map[tipo] || tipo;
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

  const [cep, setCep] = useState(() => String(preCheckoutData?.cep || "").replace(/\D/g, ""));
  const [freteCalculado, setFreteCalculado] = useState(null);
  const [freteLoading, setFreteLoading] = useState(false);
  const [freteError, setFreteError] = useState("");

  const [pixQrCode, setPixQrCode] = useState(null);
  const [pixCopiaCola, setPixCopiaCola] = useState("");
  const [showPix, setShowPix] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState("");

  const paymentType = preCheckoutData?.tipo_pagamento || "PIX";

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
      const cleanCep = cep.replace(/\D/g, "");
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
  }, [cartItems, buildItems, couponApplied, cep]);

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

  const handleCalcularFrete = async () => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) {
      setFreteError("CEP inválido.");
      return;
    }
    setFreteLoading(true);
    setFreteError("");
    try {
      const { data } = await api.post("/checkout/shipping", {
        cep: cleanCep,
        subtotal: preview?.subtotal || 0,
      });
      setFreteCalculado(data);
      // Recalcula preview com CEP para ter frete correto no resumo
      await fetchPreview();
    } catch (err) {
      setFreteError(err.response?.data?.mensagem || "Erro ao calcular frete.");
    } finally {
      setFreteLoading(false);
    }
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

  const generatePixQrCode = async (total) => {
    const pixKey = "5524988582885";
    const description = "Pagamento Surface";
    const merchantName = "Surface Streetwear";
    const merchantCity = "Volta Redonda";

    const payload = buildPixPayload(pixKey, total, description, merchantName, merchantCity);
    setPixCopiaCola(payload);

    try {
      const qr = await QRCode.toDataURL(payload, { width: 240, margin: 2 });
      setPixQrCode(qr);
      setShowPix(true);
    } catch {
      setPixQrCode(null);
    }
  };

  function buildPixPayload(key, amount, description, name, city) {
    const id = "SURFACE" + Date.now();
    const payloadFormat = "000201";
    const merchantAccount =
      "26" + String(14 + key.length).padStart(2, "0") + "0014BR.GOV.BCB.PIX0114" + key + "52040000";
    const merchantCategory = "5303986";
    const transactionAmount =
      "54" + String(String(amount.toFixed(2)).length).padStart(2, "0") + amount.toFixed(2);
    const countryCode = "5802BR";
    const merchantNameField = "59" + String(name.length).padStart(2, "0") + name;
    const merchantCityField = "60" + String(city.length).padStart(2, "0") + city;
    const additionalData = "62" + String(4 + 2 + id.length).padStart(2, "0") + "0504" + id;
    const crc16 = "6304";
    const payload =
      payloadFormat + merchantAccount + merchantCategory + transactionAmount + countryCode + merchantNameField + merchantCityField + additionalData + crc16;
    const crc = calculateCRC16(payload);
    return payload + crc;
  }

  function calculateCRC16(str) {
    let crc = 0xffff;
    for (let i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      }
    }
    return (crc & 0xffff).toString(16).toUpperCase().padStart(4, "0");
  }

  const handleWhatsAppSubmit = async () => {
    if (submitting) return;
    if (!preview) return;
    if (!preCheckoutData?.nome || !preCheckoutData?.email) {
      navigate("/pre-checkout");
      return;
    }
    setSubmitting(true);
    setOrderError("");

    try {
      const cleanCep = cep.replace(/\D/g, "");
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
        frete: finalFrete,
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
      const cleanCep = cep.replace(/\D/g, "");
      const { data: orderRes } = await api.post("/checkout/order", {
        items: buildItems(),
        codigo: couponApplied,
        nome: preCheckoutData.nome,
        email: preCheckoutData.email,
        telefone: preCheckoutData.telefone,
        tipo_pagamento: paymentType,
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

      if (paymentType === "CARTAO") {
        const { data: paymentRes } = await api.post("/checkout/payment", { id_pedido: idPedido });
        if (paymentRes.checkoutUrl) {
          clearCart();
          window.location.href = paymentRes.checkoutUrl;
          return;
        }
      }

      if (paymentType === "PIX") {
        await generatePixQrCode(Number(total));
        setSubmitting(false);
        return;
      }
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

  const finalFrete = freteCalculado ? freteCalculado.frete : preview?.frete ?? 0;
  const finalTotal = preview ? preview.subtotal - preview.desconto + finalFrete : 0;

  return (
    <section className={styles.checkout}>
      <h2 className={styles.titulo}>Finalizar Compra</h2>

      {/* Dados do Cliente — editáveis */}
      <div className={styles.painel}>
        <h3 className={styles.painelTitulo}>Dados do Cliente</h3>
        <div style={{ display: "grid", gap: "0.6rem" }}>
          <input
            type="text"
            placeholder="Nome completo"
            value={preCheckoutData?.nome || ""}
            onChange={(e) => setPreCheckoutData((p) => ({ ...p, nome: e.target.value }))}
            style={{ width: "100%", padding: "0.55rem", borderRadius: 4, border: "1px solid var(--app-border)", background: "var(--app-input-bg)", color: "var(--app-input-text)" }}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
            <input
              type="email"
              placeholder="Email"
              value={preCheckoutData?.email || ""}
              onChange={(e) => setPreCheckoutData((p) => ({ ...p, email: e.target.value }))}
              style={{ width: "100%", padding: "0.55rem", borderRadius: 4, border: "1px solid var(--app-border)", background: "var(--app-input-bg)", color: "var(--app-input-text)" }}
            />
            <input
              type="tel"
              placeholder="Telefone"
              value={preCheckoutData?.telefone || ""}
              onChange={(e) => setPreCheckoutData((p) => ({ ...p, telefone: String(e.target.value).replace(/\D/g, "") }))}
              style={{ width: "100%", padding: "0.55rem", borderRadius: 4, border: "1px solid var(--app-border)", background: "var(--app-input-bg)", color: "var(--app-input-text)" }}
            />
          </div>
        </div>

        <h3 className={styles.painelTitulo} style={{ marginTop: "1rem" }}>Endereço de Entrega</h3>
        <div style={{ display: "grid", gap: "0.6rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "0.6rem" }}>
            <input
              type="text"
              placeholder="CEP"
              value={maskCep(preCheckoutData?.cep || "")}
              onChange={(e) => {
                const raw = String(e.target.value).replace(/\D/g, "");
                setPreCheckoutData((p) => ({ ...p, cep: raw }));
                setCep(raw);
              }}
              maxLength={9}
              style={{ width: "100%", padding: "0.55rem", borderRadius: 4, border: "1px solid var(--app-border)", background: "var(--app-input-bg)", color: "var(--app-input-text)" }}
            />
            <input
              type="text"
              placeholder="Rua / Logradouro"
              value={preCheckoutData?.logradouro || ""}
              onChange={(e) => setPreCheckoutData((p) => ({ ...p, logradouro: e.target.value }))}
              style={{ width: "100%", padding: "0.55rem", borderRadius: 4, border: "1px solid var(--app-border)", background: "var(--app-input-bg)", color: "var(--app-input-text)" }}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 1fr", gap: "0.6rem" }}>
            <input
              type="text"
              placeholder="Número"
              value={preCheckoutData?.numero || ""}
              onChange={(e) => setPreCheckoutData((p) => ({ ...p, numero: e.target.value }))}
              style={{ width: "100%", padding: "0.55rem", borderRadius: 4, border: "1px solid var(--app-border)", background: "var(--app-input-bg)", color: "var(--app-input-text)" }}
            />
            <input
              type="text"
              placeholder="Complemento (opcional)"
              value={preCheckoutData?.complemento || ""}
              onChange={(e) => setPreCheckoutData((p) => ({ ...p, complemento: e.target.value }))}
              style={{ width: "100%", padding: "0.55rem", borderRadius: 4, border: "1px solid var(--app-border)", background: "var(--app-input-bg)", color: "var(--app-input-text)" }}
            />
            <input
              type="text"
              placeholder="Bairro"
              value={preCheckoutData?.bairro || ""}
              onChange={(e) => setPreCheckoutData((p) => ({ ...p, bairro: e.target.value }))}
              style={{ width: "100%", padding: "0.55rem", borderRadius: 4, border: "1px solid var(--app-border)", background: "var(--app-input-bg)", color: "var(--app-input-text)" }}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.6rem" }}>
            <input
              type="text"
              placeholder="Cidade"
              value={preCheckoutData?.cidade || ""}
              onChange={(e) => setPreCheckoutData((p) => ({ ...p, cidade: e.target.value }))}
              style={{ width: "100%", padding: "0.55rem", borderRadius: 4, border: "1px solid var(--app-border)", background: "var(--app-input-bg)", color: "var(--app-input-text)" }}
            />
            <select
              value={preCheckoutData?.estado || ""}
              onChange={(e) => setPreCheckoutData((p) => ({ ...p, estado: e.target.value }))}
              style={{ width: "100%", padding: "0.55rem", borderRadius: 4, border: "1px solid var(--app-border)", background: "var(--app-input-bg)", color: "var(--app-input-text)" }}
            >
              <option value="">Estado</option>
              {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map((uf) => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
          </div>
        </div>
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

      {/* Frete */}
      <div className={styles.painel}>
        <h3 className={styles.painelTitulo}>Frete</h3>
        <div className={styles.freteContainer}>
          <div className={styles.campoCep}>
            <label>CEP de entrega</label>
            <input
              type="text"
              value={cep}
              onChange={(e) => setCep(maskCep(e.target.value))}
              placeholder="00000-000"
              maxLength={9}
            />
          </div>
          <button
            className={styles.botaoCalcularFrete}
            onClick={handleCalcularFrete}
            disabled={freteLoading || cep.replace(/\D/g, "").length !== 8}
          >
            {freteLoading ? "..." : "Calcular"}
          </button>
        </div>
        {freteError && <p className={styles.erro}>{freteError}</p>}
        {freteCalculado && (
          <div className={styles.resultadoFrete}>
            <span>
              {freteCalculado.frete === 0 ? "Frete Grátis" : formatCurrency(freteCalculado.frete)}
            </span>
            <span style={{ opacity: 0.8, fontSize: "0.8rem" }}>
              ({freteCalculado.tipo} — {freteCalculado.prazo})
            </span>
            {freteCalculado.endereco && (
              <span style={{ opacity: 0.7, fontSize: "0.75rem" }}>
                {freteCalculado.endereco.cidade}/{freteCalculado.endereco.estado}
              </span>
            )}
          </div>
        )}
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

      {/* Pagamento (apenas visualização do método escolhido) */}
      <div className={styles.painel}>
        <h3 className={styles.painelTitulo}>Forma de Pagamento</h3>
        <p style={{ fontSize: "0.95rem", fontWeight: 600, margin: 0 }}>
          {translatePaymentType(paymentType)}
        </p>
        <p style={{ fontSize: "0.82rem", color: "var(--app-muted-text)", margin: "0.25rem 0 0" }}>
          {paymentType === "CARTAO"
            ? "Você será redirecionado para o Mercado Pago ao finalizar."
            : paymentType === "PIX"
            ? "Você verá o QR Code após finalizar."
            : "Você será direcionado para o WhatsApp ao finalizar."}
        </p>

        {showPix && paymentType === "PIX" && (
          <div className={styles.qrCodeContainer}>
            <img src={pixQrCode} alt="QR Code PIX" />
            <textarea
              className={styles.pixCopiaCola}
              readOnly
              rows={3}
              value={pixCopiaCola}
            />
            <button
              className={styles.botaoCopiar}
              onClick={() => navigator.clipboard.writeText(pixCopiaCola)}
            >
              Copia e Cola
            </button>
          </div>
        )}
      </div>

      {orderError && <p className={styles.erro} style={{ marginBottom: "1rem" }}>{orderError}</p>}

      {/* Botões de ação por tipo de pagamento */}
      <div className={styles.acoes} style={{ flexDirection: "column", gap: "0.75rem" }}>
        <button className={styles.botaoSecundario} onClick={() => navigate("/shop")}>
          Continuar Comprando
        </button>

        {paymentType === "CARTAO" && (
          <button
            className={styles.botaoPrimario}
            onClick={handleSubmit}
            disabled={submitting || previewLoading || !preview}
          >
            {submitting ? "Processando..." : "💳 Pagar com Mercado Pago"}
          </button>
        )}

        {paymentType === "PIX" && (
          <button
            className={styles.botaoPrimario}
            onClick={handleSubmit}
            disabled={submitting || previewLoading || !preview}
          >
            {submitting ? "Processando..." : showPix ? "📱 Já realizei o PIX" : "📱 Gerar PIX"}
          </button>
        )}

        {/* Botão WhatsApp sempre visível para todos os tipos */}
        <button
          className={styles.botaoWhatsApp}
          onClick={handleWhatsAppSubmit}
          disabled={submitting || previewLoading || !preview}
        >
          {submitting ? "Processando..." : "💬 Finalizar pelo WhatsApp"}
        </button>
      </div>
    </section>
  );
}
