import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Shop() {
  const [produtos, setProdutos] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/produtos") // sua API backend
      .then(res => res.json())
      .then(data => setProdutos(data))
      .catch(err => console.error("Erro ao carregar produtos:", err));
  }, []);

  return (
  <div style={{ padding: "20px", backgroundColor: "white" }}>
    <h1>Loja</h1>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
      {produtos.map(produto => (
        <div key={produto.id} style={{ border: "1px solid #ddd", padding: "10px" }}>
          <h3>{produto.nome}</h3>
          <p>{produto.descricao}</p>
          <p>R$ {produto.preco}</p>
          <Link to={`/product/${produto.id}`}>Ver detalhes</Link>
        </div>
      ))}
    </div>
  </div>
);
}
