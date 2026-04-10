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

  // RESET
  useEffect(() => {
    setSelectedSize("");
    setActivePhoto(0);
    setLoading(false);
  }, [produto, isOpen]);

  // VARIAÇÕES
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

  const formatPrice = (val) =>
    parseFloat(val || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2
    });

  const hasVariations = variacoes.length > 0;

  const selectedVariacao = variacoes.find(v => v.tamanho === selectedSize);

  const isOutOfStock =
    hasVariations &&
    selectedSize &&
    selectedVariacao?.estoque === 0;

  // ============================
  // AÇÃO PRINCIPAL
  // ============================
  const handleAction = async () => {
    if (loading) return;
    if (hasVariations && !selectedSize) return;

    setLoading(true);

    // 🔥 AVISE-ME
    if (isOutOfStock) {
      if (!user) {
        showAlertModal({
          title: "Login necessário",
          message: "Você precisa estar logado para ser avisado.",
          type: "auth"
        });
        setLoading(false);
        return;
      }

      try {
        await api.post("/notify-me", {
          id_produto: produto.id_produto || produto.id,
          tamanho: selectedSize
        });

        showAlertModal({
          title: "Aviso ativado",
          message: "Te avisaremos quando voltar ao estoque.",
          type: "success"
        });

      } catch (err) {
        showAlertModal({
          title: "Erro",
          message:
            err?.response?.data?.message ||
            "Não foi possível ativar o aviso.",
          type: "error"
        });
      }

      setLoading(false);
      return;
    }

    // 🛒 ADD CARRINHO (SEM DUPLICAR)
    addToCart({
      ...produto,
      id_produto: produto.id_produto || produto.id,
      selectedSize: selectedSize || "Único"
    });

    // 🔥 ABRE DIRETO (SEM TOGGLE BUGADO)
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-[1000px] flex flex-col md:flex-row relative shadow-2xl">

        {/* FECHAR */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50"
        >
          <X />
        </button>

        {/* IMAGEM */}
        <div className="w-full md:w-1/2 p-8">
          <img
            src={resolveImageUrl(produto.fotos?.[activePhoto]?.url)}
            alt={produto.nome_produto}
            className="w-full object-contain"
          />
        </div>

        {/* INFO */}
        <div className="w-full md:w-1/2 p-8">

          <h2 className="text-2xl font-bold mb-2 uppercase">
            {produto.nome_produto}
          </h2>

          <p className="mb-6">
            R$ {formatPrice(produto.preco)}
          </p>

          {/* TAMANHOS */}
          {hasVariations && (
            <div className="mb-6 flex gap-2 flex-wrap">
              {variacoes.map((v) => {
                const outOfStock = v.estoque === 0;

                return (
                  <button
                    key={v.sku || v.tamanho}
                    onClick={() => setSelectedSize(v.tamanho)}
                    className={`px-4 py-2 border text-sm transition
                      ${selectedSize === v.tamanho ? 'bg-black text-white' : ''}
                      ${outOfStock ? 'opacity-40' : 'hover:border-black'}
                    `}
                  >
                    {v.tamanho}
                  </button>
                );
              })}
            </div>
          )}

          {/* BOTÃO */}
          <button
            onClick={handleAction}
            disabled={(hasVariations && !selectedSize) || loading}
            className="w-full h-[60px] bg-black text-white flex items-center justify-center gap-2 disabled:bg-gray-300"
          >
            <ShoppingBag />

            {loading
              ? "CARREGANDO..."
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
