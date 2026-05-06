import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Tag,
  ChevronRight,
  CreditCard,
  Loader2,
  QrCode,
  MapPin,
  ArrowLeft,
} from "lucide-react";

import { useCart } from "../../context/CartContext";
import useAuth from "../../hooks/useAuth";
import { api } from "../../services/api";
import { normalizeAddress, validatePreCheckoutData, hasCompleteAddress } from "../../utils/preCheckout";
import { useToast } from "../../context/ToastContext";

import { resolveImageUrl } from "../../utils/resolveImageUrl";
import { buildWhatsAppCheckoutUrl } from "../../utils/whatsapp";

import { useCheckoutLogic } from "./hooks/useCheckoutLogic";
import { formatCurrency } from "./utils/checkoutHelpers";

import styles from "./style.module.css";

export default function CheckoutPage() {
  const navigate = useNavigate();

  const { user } = useAuth();
  // 🔥 Tentei puxar o setIsCartOpen do seu contexto caso ele exista
  const { cartItems, preCheckoutData, setPreCheckoutData, clearCart, setIsCartOpen } = useCart();
  const toast = useToast();

  const [savedAddress, setSavedAddress] = useState(null);
  const [errors, setErrors] = useState({});

  const [addressMode, setAddressMode] = useState("manual");

  const {
    couponCode,
    setCouponCode,
    couponApplied,
    couponError,
    couponLoading,
    handleApplyCoupon,
    handleRemoveCoupon,
    preview,
    previewLoading,
    submitting,
    orderError,
    handleSubmit,
    orderCompletedRef,
  } = useCheckoutLogic(
    cartItems,
    preCheckoutData,
    setPreCheckoutData,
    clearCart
  );

  useEffect(() => {
    let cancelled = false;

    async function loadProfileAddress() {
      try {
        const { data } = await api.get("/conta?light=true");
        const profile = data?.usuario || data;
        
        if (!profile || typeof profile !== "object") return;
        if (cancelled) return;

        const normalized = normalizeAddress(profile);
        
        if (normalized && normalized.logradouro) {
          setSavedAddress(normalized);
          setAddressMode("saved");

          setPreCheckoutData((prev) => ({
            ...prev,
            nome: prev.nome || profile.nome || "",
            email: prev.email || profile.email || "",
            telefone: prev.telefone || String(profile.telefone || "").replace(/\D/g, ""),
            cpf: prev.cpf || String(profile.cpf || "").replace(/\D/g, ""),
            cep: normalized.cep || "",
            rua: normalized.logradouro || normalized.rua || "",
            logradouro: normalized.logradouro || normalized.rua || "",
            numero: normalized.numero || "",
            bairro: normalized.bairro || "",
            cidade: normalized.cidade || "",
            estado: normalized.estado || "",
            complemento: normalized.complemento || "",
          }));
        } else {
          setPreCheckoutData((prev) => ({
            ...prev,
            nome: prev.nome || profile.nome || "",
            email: prev.email || profile.email || "",
            telefone: prev.telefone || String(profile.telefone || "").replace(/\D/g, ""),
            cpf: prev.cpf || String(profile.cpf || "").replace(/\D/g, ""),
          }));
        }
      } catch (err) {
        console.error("Erro ao buscar endereço do perfil:", err);
      }
    }

    loadProfileAddress();

    return () => {
      cancelled = true;
    };
  }, [setPreCheckoutData]);

  const hasSavedAddress = Boolean(savedAddress);

  const handleUseSavedAddress = () => {
    if (savedAddress) {
      setAddressMode("saved");
      setPreCheckoutData((prev) => ({
        ...prev,
        cep: savedAddress.cep || "",
        rua: savedAddress.logradouro || savedAddress.rua || "",
        logradouro: savedAddress.logradouro || savedAddress.rua || "",
        numero: savedAddress.numero || "",
        bairro: savedAddress.bairro || "",
        cidade: savedAddress.cidade || "",
        estado: savedAddress.estado || "",
        complemento: savedAddress.complemento || "",
      }));
    }
  };

  const handleUseManualAddress = () => {
    setAddressMode("manual");
    setPreCheckoutData((prev) => ({
      ...prev,
      cep: "",
      rua: "",
      logradouro: "",
      numero: "",
      bairro: "",
      cidade: "",
      estado: "",
      complemento: "",
    }));
  };

  // 🔥 1. Voltar normal (Seta de cima)
  const handleGoBack = () => {
    navigate(-1); // Retorna na navegação do histórico
  };

  // 🔥 2. Opção de Editar (Abre o /shop e o carrinho)
  const handleEditCart = () => {
    navigate("/shop"); // Vai para a rota /shop
    
    // Se a função setIsCartOpen existir no seu CartContext, ela abre o carrinho
    if (typeof setIsCartOpen === "function") {
      setIsCartOpen(true);
    }
  };

  const getImageUrl = (path) => {
    if (!path) return "https://via.placeholder.com/64?text=Img";
    return resolveImageUrl(path);
  };

  const getFrontImage = (item) => {
    if (item.imagem && typeof item.imagem === 'string') return item.imagem;
    if (item.image && typeof item.image === 'string') return item.image;
    const fotos = item.fotos || item.images || [];
    if (!Array.isArray(fotos) || fotos.length === 0) return null;
    const principal = fotos.find((f) => f.principal);
    return principal?.url || fotos[0]?.url || (typeof fotos[0] === 'string' ? fotos[0] : null);
  };

  if (!preview && previewLoading && !orderCompletedRef.current) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <Loader2 className="animate-spin" size={32} style={{ margin: "0 auto 16px" }} />
        <h2>Calculando seu pedido...</h2>
      </div>
    );
  }

  if ((!cartItems || cartItems.length === 0) && !orderCompletedRef.current) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2>Seu carrinho está vazio.</h2>
        <button 
          onClick={() => navigate("/")} 
          className={styles.submitBtn}
          style={{ width: "auto", padding: "10px 24px", margin: "20px auto" }}
        >
          Voltar para a loja
        </button>
      </div>
    );
  }

  const finalTotal = preview ? preview.total : 0;
  const addr = preCheckoutData || {};

  const handleValidateAndSubmit = () => {
    const validation = validatePreCheckoutData(preCheckoutData);
    setPreCheckoutData((prev) => ({ ...prev, ...validation.sanitized }));
    setErrors(validation.errors);

    if (!validation.isValid) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    if (!hasCompleteAddress(preCheckoutData)) {
      toast.error("Preencha o endereço completo.");
      return;
    }

    handleSubmit(buildWhatsAppCheckoutUrl);
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        
        {/* ================= LEFT ================= */}
        <div className={styles.leftColumn}>
          <header className={styles.header} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button 
                onClick={handleGoBack}
                style={{ 
                  background: "none", 
                  border: "none", 
                  cursor: "pointer", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  padding: "4px",
                  color: "#111"
                }}
                title="Voltar"
              >
                <ArrowLeft size={24} />
              </button>
              <h1 className={styles.title} style={{ margin: 0 }}>SURFACE</h1>
            </div>
            
            <nav className={styles.breadcrumb}>
              <span className={styles.breadcrumbItem} onClick={handleEditCart}>Carrinho</span>
              <ChevronRight size={12} />
              <span className={styles.breadcrumbItem}>Informações</span>
              <ChevronRight size={12} />
              <span>Pagamento</span>
            </nav>
          </header>

          <section className={styles.formSection}>
            {/* CONTATO */}
            <div>
              <h2 className={styles.formGroupTitle}>Contato</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <input
                  type="text" placeholder="Nome completo" value={addr.nome || ""}
                  onChange={(e) => setPreCheckoutData({ ...addr, nome: e.target.value })}
                  className={styles.input} style={{ marginBottom: 0 }}
                />
                <div className={styles.inputGrid}>
                  <input
                    type="email" placeholder="Email" value={addr.email || ""}
                    onChange={(e) => setPreCheckoutData({ ...addr, email: e.target.value })}
                    className={styles.input} style={{ marginBottom: 0 }}
                  />
                  <input
                    type="tel" placeholder="Telefone" value={addr.telefone || ""}
                    onChange={(e) => setPreCheckoutData({ ...addr, telefone: String(e.target.value).replace(/\D/g, "") })}
                    className={styles.input} style={{ marginBottom: 0 }}
                  />
                </div>
                <input
                  type="text" placeholder="CPF (opcional)" value={addr.cpf || ""}
                  onChange={(e) => setPreCheckoutData({ ...addr, cpf: String(e.target.value).replace(/\D/g, "") })}
                  className={styles.input} style={{ marginBottom: 0 }}
                />
              </div>
            </div>

            {/* ENTREGA */}
            <div>
              <h2 className={styles.formGroupTitle}>Entrega</h2>
              
              <div style={{ border: "1px solid #d1d5db", borderRadius: "8px", overflow: "hidden", marginBottom: "16px" }}>
                
                {/* Opção 1: Endereço Ativo */}
                {hasSavedAddress && (
                  <div 
                    onClick={handleUseSavedAddress}
                    style={{
                      padding: "16px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer",
                      backgroundColor: addressMode === "saved" ? "#eff6ff" : "#fff",
                      borderBottom: "1px solid #d1d5db"
                    }}
                  >
                    <div style={{ 
                      width: "18px", height: "18px", borderRadius: "50%", 
                      border: addressMode === "saved" ? "6px solid #2563eb" : "1px solid #d1d5db", 
                      backgroundColor: "#fff"
                    }} />
                    <span style={{ fontSize: "14px", fontWeight: "500", color: "#111", flex: 1 }}>Usar endereço ativo</span>
                  </div>
                )}

                {/* Opção 2: Colocar Endereço */}
                <div 
                  onClick={handleUseManualAddress}
                  style={{
                    padding: "16px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer",
                    backgroundColor: addressMode === "manual" ? "#eff6ff" : "#fff"
                  }}
                >
                  <div style={{ 
                    width: "18px", height: "18px", borderRadius: "50%", 
                    border: addressMode === "manual" ? "6px solid #2563eb" : "1px solid #d1d5db", 
                    backgroundColor: "#fff"
                  }} />
                  <span style={{ fontSize: "14px", fontWeight: "500", color: "#111", flex: 1 }}>Colocar endereço</span>
                </div>
              </div>

              {/* Inputs para colocar novo endereço */}
              {addressMode === "manual" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <input
                    type="text" placeholder="CEP" value={addr.cep || ""}
                    onChange={(e) => setPreCheckoutData({ ...addr, cep: e.target.value })}
                    className={styles.input} style={{ marginBottom: 0 }}
                  />
                  <input
                    type="text" placeholder="Rua / Logradouro" value={addr.logradouro || addr.rua || ""}
                    onChange={(e) => setPreCheckoutData({ ...addr, logradouro: e.target.value, rua: e.target.value })}
                    className={styles.input} style={{ marginBottom: 0 }}
                  />
                  <div className={styles.inputGrid}>
                    <input
                      type="text" placeholder="Número" value={addr.numero || ""}
                      onChange={(e) => setPreCheckoutData({ ...addr, numero: e.target.value })}
                      className={styles.input} style={{ marginBottom: 0 }}
                    />
                    <input
                      type="text" placeholder="Complemento" value={addr.complemento || ""}
                      onChange={(e) => setPreCheckoutData({ ...addr, complemento: e.target.value })}
                      className={styles.input} style={{ marginBottom: 0 }}
                    />
                  </div>
                  <input
                    type="text" placeholder="Bairro" value={addr.bairro || ""}
                    onChange={(e) => setPreCheckoutData({ ...addr, bairro: e.target.value })}
                    className={styles.input} style={{ marginBottom: 0 }}
                  />
                  <div className={styles.inputGrid}>
                    <input
                      type="text" placeholder="Cidade" value={addr.cidade || ""}
                      onChange={(e) => setPreCheckoutData({ ...addr, cidade: e.target.value })}
                      className={styles.input} style={{ marginBottom: 0 }}
                    />
                    <input
                      type="text" placeholder="Estado (UF)" value={addr.estado || ""}
                      onChange={(e) => setPreCheckoutData({ ...addr, estado: e.target.value })}
                      className={styles.input} style={{ marginBottom: 0 }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* PAGAMENTO */}
            <div>
              <h2 className={styles.formGroupTitle}>Pagamento</h2>
              <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "16px" }}>
                Todas as transações são seguras e criptografadas.
              </p>
              
              <div style={{ border: "1px solid #d1d5db", borderRadius: "8px", overflow: "hidden" }}>
                <div 
                  onClick={() => setPreCheckoutData({ ...addr, formaPagamento: "cartao" })}
                  style={{
                    padding: "16px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer",
                    backgroundColor: addr.formaPagamento === "cartao" ? "#eff6ff" : "#fff",
                    borderBottom: "1px solid #d1d5db"
                  }}
                >
                  <div style={{ 
                    width: "18px", height: "18px", borderRadius: "50%", border: addr.formaPagamento === "cartao" ? "6px solid #2563eb" : "1px solid #d1d5db", backgroundColor: "#fff"
                  }} />
                  <CreditCard size={20} color={addr.formaPagamento === "cartao" ? "#111" : "#6b7280"} />
                  <span style={{ fontSize: "14px", fontWeight: "500", color: "#111", flex: 1 }}>Cartão de crédito</span>
                </div>

                {addr.formaPagamento === "cartao" && (
                  <div style={{ padding: "16px", backgroundColor: "#f9fafb", borderBottom: "1px solid #d1d5db" }}>
                    <select
                      value={addr.parcelas || "1"}
                      onChange={(e) => setPreCheckoutData({ ...addr, parcelas: e.target.value })}
                      className={styles.input} style={{ marginBottom: 0 }}
                    >
                      <option value="1">1x (À vista)</option>
                      {[...Array(11)].map((_, i) => (
                        <option key={i + 2} value={i + 2}>{i + 2}x (Com juros)</option>
                      ))}
                    </select>
                  </div>
                )}

                <div 
                  onClick={() => setPreCheckoutData({ ...addr, formaPagamento: "pix" })}
                  style={{
                    padding: "16px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer",
                    backgroundColor: addr.formaPagamento === "pix" ? "#eff6ff" : "#fff"
                  }}
                >
                  <div style={{ 
                    width: "18px", height: "18px", borderRadius: "50%", border: addr.formaPagamento === "pix" ? "6px solid #2563eb" : "1px solid #d1d5db", backgroundColor: "#fff"
                  }} />
                  <QrCode size={20} color={addr.formaPagamento === "pix" ? "#111" : "#6b7280"} />
                  <span style={{ fontSize: "14px", fontWeight: "500", color: "#111" }}>Pix</span>
                </div>

                {addr.formaPagamento === "pix" && (
                  <div style={{ padding: "20px 16px", backgroundColor: "#f9fafb", textAlign: "center", borderTop: "1px solid #d1d5db" }}>
                    <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>
                      Depois de clicar em "Finalizar via WhatsApp", nossa equipe gerará o seu código Pix para finalizar a compra com segurança.
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {orderError && <div className={styles.errorBox}>{orderError}</div>}
          </section>
        </div>

        {/* ================= RIGHT (STICKY) ================= */}
        <div className={styles.rightColumn}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "600", margin: 0, color: "#111" }}>Resumo do pedido</h2>
            <button 
              onClick={handleEditCart} 
              style={{ 
                background: "none", 
                border: "none", 
                color: "#2563eb", 
                fontSize: "14px", 
                fontWeight: "500", 
                cursor: "pointer", 
                textDecoration: "underline",
                padding: 0
              }}
            >
              Editar itens
            </button>
          </div>

          <div className={styles.itemsList}>
            {cartItems.map((item, index) => {
              const nome = item.nome_produto || item.nome || item.name || "Produto";
              const preco = Number(item.preco_promocional || item.preco || item.price || 0);
              const quantidade = Number(item.quantidade || item.quantity || 1);
              const tamanho = item.tamanho || item.selectedSize || item.size;

              return (
                <div key={`${item.id_produto || item.id}-${index}`} className={styles.itemCard}>
                  <div className={styles.itemImgContainer}>
                    <img src={getImageUrl(getFrontImage(item))} alt={nome} className={styles.itemImg} onError={(e) => { e.target.src = "https://via.placeholder.com/64?text=Erro"; }} />
                    <div className={styles.itemBadge}>{quantidade}</div>
                  </div>
                  
                  <div className={styles.itemInfo}>
                    <p className={styles.itemName}>{nome}</p>
                    {tamanho && <p className={styles.itemDetails}>{tamanho}</p>}
                  </div>
                  
                  <span className={styles.itemPrice}>{formatCurrency(preco * quantidade)}</span>
                </div>
              );
            })}
          </div>

          <div className={styles.couponSection}>
            {couponApplied ? (
              <div style={{ display: "flex", gap: "10px", alignItems: "center", flex: 1 }}>
                <Tag size={16} />
                <span style={{ flex: 1, fontWeight: "500" }}>{couponApplied}</span>
                <button onClick={handleRemoveCoupon} className={styles.couponBtn}>Remover</button>
              </div>
            ) : (
              <>
                <input
                  className={styles.couponInput}
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Código de desconto"
                />
                <button onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim()} className={styles.couponBtn}>
                  {couponLoading ? <Loader2 size={18} className="animate-spin" /> : "Aplicar"}
                </button>
              </>
            )}
          </div>
          {couponError && <p style={{ color: "#ef4444", fontSize: "13px", marginTop: "-10px", marginBottom: "15px" }}>{couponError}</p>}

          <div>
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>{formatCurrency(preview ? preview.subtotal : 0)}</span>
            </div>
          </div>

          {/* ================= RESUMO DO ENDEREÇO ================= */}
          <div style={{ backgroundColor: "#f9fafb", padding: "16px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", fontWeight: "600", color: "#374151" }}>
              <MapPin size={18} color="#4f46e5" />
              <span>Endereço de Entrega</span>
            </div>
            
            <div style={{ fontSize: "14px", color: "#6b7280", lineHeight: "1.5", marginLeft: "26px" }}>
              {addr.rua || addr.logradouro ? (
                <>
                  <p>{addr.logradouro || addr.rua}, {addr.numero} {addr.complemento && `- ${addr.complemento}`}</p>
                  <p>{addr.bairro}, {addr.cidade} - {addr.estado}</p>
                  <p>CEP: {addr.cep}</p>
                </>
              ) : (
                <p style={{ fontStyle: "italic", color: "#9ca3af" }}>
                  Nenhum endereço selecionado ou informado.
                </p>
              )}
            </div>
          </div>
          {/* ======================================================= */}

          <div className={styles.totalBox}>
            <span>Total</span>
            <span style={{ fontSize: "24px" }}>
              <span style={{ fontSize: "14px", color: "#6b7280", marginRight: "8px", fontWeight: "400" }}>BRL</span>
              {formatCurrency(finalTotal)}
            </span>
          </div>

          <button
            onClick={handleValidateAndSubmit}
            disabled={submitting || previewLoading || !preview || !addr.formaPagamento}
            className={styles.submitBtn}
          >
            {submitting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>Pagar agora via WhatsApp</>
            )}
          </button>

          {!addr.formaPagamento && (
            <p style={{ textAlign: "center", color: "#ef4444", fontSize: "12px", marginTop: "12px" }}>
              Selecione uma forma de pagamento na etapa anterior.
            </p>
          )}

          <p className={styles.securityText}>
            <CreditCard size={14} /> Transação segura via WhatsApp
          </p>
        </div>
      </div>
    </div>
  );
}