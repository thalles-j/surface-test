import React, { useState, useEffect, useMemo, useContext } from 'react';
import { X, ShoppingBag } from 'lucide-react';
import { resolveImageUrl } from "../utils/resolveImageUrl";
import { useCart } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import { api } from "../services/api";

export default function ProductModal({ isOpen, onClose, produto }) {
  const [selectedSize, setSelectedSize] = useState("");
  const [activePhoto, setActivePhoto] = useState(0);
  const [loading, setLoading] = useState(false);

  const { addToCart, showAlertModal } = useCart();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    setSelectedSize("");
    setActivePhoto(0);
    setLoading(false);
  }, [produto, isOpen]);

  const variacoes = useMemo(() => {
    if (!produto) return [];

    try {
      if (typeof produto.variacoes_estoque === 'string') {
        return JSON.parse(produto.variacoes_estoque);
      }

      if (Array.isArray(produto.variacoes_estoque)) {
        return produto.variacoes_estoque;
      }
    } catch (error) {
      console.error("Erro ao ler variacoes_estoque:", error);
    }

    return [];
  }, [produto]);

  if (!isOpen || !produto) return null;

  const isProductInactive = String(produto.status || '').toLowerCase() !== 'ativo';

  const formatPrice = (val) =>
    parseFloat(val || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
    });

  const hasVariations = variacoes.length > 0;
  const availableVariacoes = isProductInactive
    ? variacoes
    : variacoes.filter((v) => Number(v?.estoque || 0) > 0);
  const selectedVariacao = variacoes.find((v) => v.tamanho === selectedSize);

  const isOutOfStock =
    hasVariations &&
    selectedSize &&
    Number(selectedVariacao?.estoque || 0) <= 0;
  const isAllSoldOut = !isProductInactive && hasVariations && availableVariacoes.length === 0;

  const handleAction = async () => {
    if (loading) return;
    if (hasVariations && !selectedSize) return;
    if (isProductInactive) return;

    setLoading(true);

    if (isOutOfStock) {
      if (!user) {
        showAlertModal({
          title: "Login necessario",
          message: "Voce precisa estar logado para ser avisado.",
          type: "auth",
        });
        setLoading(false);
        return;
      }

      try {
        await api.post("/notify-me", {
          id_produto: produto.id_produto || produto.id,
          tamanho: selectedSize,
        });

        showAlertModal({
          title: "Aviso ativado",
          message: "Te avisaremos quando voltar ao estoque.",
          type: "success",
        });
      } catch (err) {
        showAlertModal({
          title: "Erro",
          message: err?.response?.data?.message || "Nao foi possivel ativar o aviso.",
          type: "error",
        });
      }

      setLoading(false);
      return;
    }

    addToCart({
      ...produto,
      id_produto: produto.id_produto || produto.id,
      selectedSize: selectedSize || "Unico",
    });

    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div
        className="w-full max-w-[1000px] flex flex-col md:flex-row relative shadow-2xl"
        style={{ background: "var(--app-surface)", color: "var(--app-text)", border: "1px solid var(--app-border)" }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50"
          style={{ color: "var(--app-text)" }}
        >
          <X />
        </button>

        <div className="w-full md:w-1/2 p-8">
          <img
            src={resolveImageUrl(produto.fotos?.[activePhoto]?.url)}
            alt={produto.nome_produto}
            className="w-full object-contain"
          />
        </div>

        <div className="w-full md:w-1/2 p-8">
          <h2 className="text-2xl font-bold mb-2 uppercase">{produto.nome_produto}</h2>

          <p className="mb-6">R$ {formatPrice(produto.preco)}</p>

          {hasVariations && (
            <div className="mb-6">
              <div className="flex gap-2 flex-wrap">
                {isProductInactive
                  ? variacoes.map((v) => (
                      <button
                        key={v.sku || v.tamanho}
                        disabled
                        className="px-4 py-2 border text-sm opacity-40 cursor-not-allowed line-through"
                        style={{
                          background: "var(--app-surface-alt)",
                          color: "var(--app-muted-text)",
                          borderColor: "var(--app-border)",
                        }}
                      >
                        {v.tamanho} - ESGOTADO
                      </button>
                    ))
                  : availableVariacoes.map((v) => (
                      <button
                        key={v.sku || v.tamanho}
                        onClick={() => setSelectedSize(v.tamanho)}
                        className="px-4 py-2 border text-sm transition"
                        style={{
                          background: selectedSize === v.tamanho ? "var(--app-primary-bg)" : "var(--app-surface)",
                          color: selectedSize === v.tamanho ? "var(--app-primary-text)" : "var(--app-text)",
                          borderColor: "var(--app-border)",
                        }}
                      >
                        {v.tamanho}
                      </button>
                    ))}
              </div>

              {isAllSoldOut && (
                <p className="mt-3 text-sm" style={{ color: "var(--app-muted-text)" }}>
                  Todos os tamanhos estao esgotados no momento.
                </p>
              )}

              {isProductInactive && (
                <p className="mt-3 text-sm" style={{ color: "var(--app-muted-text)" }}>
                  Produto indisponivel. Nenhum tamanho pode ser comprado enquanto estiver inativo.
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleAction}
            disabled={(hasVariations && !selectedSize) || loading || isProductInactive || isAllSoldOut}
            className="w-full h-[60px] flex items-center justify-center gap-2"
            style={{
              background: (hasVariations && !selectedSize) || loading || isProductInactive || isAllSoldOut ? "var(--app-border)" : "var(--app-primary-bg)",
              color: (hasVariations && !selectedSize) || loading || isProductInactive || isAllSoldOut ? "var(--app-muted-text)" : "var(--app-primary-text)",
            }}
          >
            <ShoppingBag />

            {loading
              ? "CARREGANDO..."
              : isProductInactive
                ? "INDISPONIVEL"
                : isAllSoldOut
                  ? "ESGOTADO"
                : hasVariations && !selectedSize
                  ? "SELECIONE UM TAMANHO"
                  : isOutOfStock
                    ? "AVISE-ME"
                    : "ADICIONAR AO CARRINHO"}
          </button>
        </div>
      </div>
    </div>
  );
}
