import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function ProductDetail() {
  const { id } = useParams();
  const [produto, setProduto] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduto = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:5000/api/products/${id}`);
        if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`);
        const data = await res.json();
        setProduto(data);
      } catch (err) {
        console.error("Erro ao carregar produto:", err);
        setError(err.message || "Erro ao carregar produto");
      } finally {
        setLoading(false);
      }
    };

    fetchProduto();
  }, [id]);

  if (loading) return <p>Carregando...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!produto) return <p>Produto não encontrado</p>;

  const formatPrice = (price) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price);

  return (
    <div style={{ padding: "20px" }}>
      <h1>{produto.nome_produto}</h1>
      <p>{produto.descricao}</p>
      <p><strong>Preço base:</strong> {formatPrice(produto.preco)}</p>

      <h3>Variações:</h3>
      {produto.variacoes_estoque?.length ? (
        <ul>
          {produto.variacoes_estoque.map(v => (
            <li key={v.sku}>
              {v.tamanho} - {v.estoque} em estoque - {formatPrice(v.preco)}
            </li>
          ))}
        </ul>
      ) : (
        <p>Sem variações disponíveis</p>
      )}

      <h3>Categoria:</h3>
      <p>{produto.categoria?.nome_categoria || "Não informada"}</p>
    </div>
  );
}
