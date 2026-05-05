import { useState, useEffect, useRef } from "react";

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

  useEffect(() => {
    // simula preview (depois você liga API real)
    const subtotal = cartItems.reduce(
      (acc, item) => acc + Number(item.preco) * item.quantity,
      0
    );

    setPreview({
      subtotal,
      desconto: 0,
      frete: 0,
    });

    setPreviewLoading(false);
  }, [cartItems]);

  function handleApplyCoupon() {
    setCouponLoading(true);

    setTimeout(() => {
      if (couponCode === "10OFF") {
        setCouponApplied(couponCode);
        setCouponError(null);
        setPreview((prev) => ({
          ...prev,
          desconto: prev.subtotal * 0.1,
        }));
      } else {
        setCouponError("Cupom inválido");
      }

      setCouponLoading(false);
    }, 800);
  }

  function handleRemoveCoupon() {
    setCouponApplied(null);
    setCouponCode("");
    setPreview((prev) => ({
      ...prev,
      desconto: 0,
    }));
  }

  function handleSubmit(buildWhatsAppCheckoutUrl) {
    setSubmitting(true);

    try {
      const url = buildWhatsAppCheckoutUrl({
        cartItems,
        preCheckoutData,
        preview,
      });

      window.open(url, "_blank");

      clearCart();
      orderCompletedRef.current = true;
    } catch (err) {
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