import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function ProductDetail() {
  const { id } = useParams();
  const [produto, setProduto] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/produtos/${id}`)
      .then(res => res.json())
      .then(data => setProduto(data))
      .catch(err => console.error("Erro ao carregar produto:", err));
  }, [id]);

  if (!produto) return <p>Carregando...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>{produto.nome}</h1>
      <p>{produto.descricao}</p>
      <p><strong>Preço:</strong> R$ {produto.preco}</p>
      <h3>Variações:</h3>
      <ul>
        {produto.variacoes?.map(v => (
          <li key={v.id_variacao}>
            {v.tamanho} - {v.quantidade} em estoque
          </li>
        ))}
      </ul>
    </div>
  );
}
