import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../../../services/api";

export function useCheckoutLogic(cartItems, preCheckoutData, setPreCheckoutData, clearCart) {
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(null);
  const [couponError, setCouponError] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState(null);

  const orderCompletedRef = useRef(false);

  const itemsPayload = cartItems.map((item) => ({
    id_produto: item.id_produto,
    selectedSize: item.selectedSize,
    sku_variacao: item.sku_variacao || null,
    quantity: item.quantity,
  }));

  const fetchPreview = useCallback(async (codigoCupom = null) => {
    if (cartItems.length === 0) {
      setPreview(null);
      setPreviewLoading(false);
      return;
    }
    setPreviewLoading(true);
    try {
      const { data } = await api.post("/checkout/preview", {
        items: itemsPayload,
        codigo_cupom: codigoCupom,
        cep: preCheckoutData.cep || null,
      });
      setPreview({
        subtotal: Number(data.subtotal || 0),
        desconto: Number(data.desconto || 0),
        frete: Number(data.frete || 0),
        total: Number(data.total || 0),
        itens: data.itens || [],
        cupom: data.cupom || null,
      });
      if (data.cupom?.codigo) {
        setCouponApplied(data.cupom.codigo);
      }
    } catch (err) {
      console.error("Erro ao calcular preview:", err);
      const subtotal = cartItems.reduce(
        (acc, item) => acc + Number(item.preco) * item.quantity,
        0
      );
      setPreview({ subtotal, desconto: 0, frete: 0, total: subtotal, itens: [], cupom: null });
    } finally {
      setPreviewLoading(false);
    }
  }, [cartItems, preCheckoutData.cep]);

  useEffect(() => {
    fetchPreview(couponApplied);
  }, [fetchPreview, couponApplied]);

  async function handleApplyCoupon() {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const { data } = await api.post("/checkout/validate-coupon", {
        codigo: couponCode.trim().toUpperCase(),
      });
      if (data.sucesso) {
        setCouponApplied(data.cupom.codigo);
        await fetchPreview(data.cupom.codigo);
      } else {
        setCouponError("Cupom inválido");
      }
    } catch (err) {
      const msg = err?.response?.data?.mensagem || err?.response?.data?.message || "Cupom inválido";
      setCouponError(msg);
    } finally {
      setCouponLoading(false);
    }
  }

  function handleRemoveCoupon() {
    setCouponApplied(null);
    setCouponCode("");
    setCouponError(null);
    fetchPreview(null);
  }

  function handleSubmit(buildWhatsAppCheckoutUrl) {
    setSubmitting(true);
    setOrderError(null);

    try {
      const url = buildWhatsAppCheckoutUrl({
        customerName: preCheckoutData.nome,
        telefone: preCheckoutData.telefone,
        cpf: preCheckoutData.cpf,
        items: cartItems,
        subtotal: preview?.subtotal || 0,
        desconto: preview?.desconto || 0,
        frete: preview?.frete || 0,
        total: preview?.total || (preview?.subtotal - preview?.desconto) || 0,
        codigoCupom: couponApplied,
        logradouro: preCheckoutData.logradouro,
        numero: preCheckoutData.numero,
        complemento: preCheckoutData.complemento,
        bairro: preCheckoutData.bairro,
        cidade: preCheckoutData.cidade,
        estado: preCheckoutData.estado,
        cep: preCheckoutData.cep,
      });

      window.open(url, "_blank");

      clearCart();
      orderCompletedRef.current = true;
    } catch (err) {
      console.error(err);
      setOrderError("Erro ao finalizar pedido");
    } finally {
      setSubmitting(false);
    }
  }

  return {
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
  };
}
