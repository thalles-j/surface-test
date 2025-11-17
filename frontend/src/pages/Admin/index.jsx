import React, { useEffect, useState } from "react";
import styles from "./style.module.css";

export default function AdminDestop() {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState(0);
  const [tipo, setTipo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [categories, setCategories] = useState([]);

  const [variacoes, setVariacoes] = useState([
    { tamanho: "M", sku: "", estoque: 0, preco: 0 },
  ]);

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data || []))
      .catch(() => setCategories([]));
  }, []);

  function addVariacao() {
    setVariacoes((v) => [...v, { tamanho: "", sku: "", estoque: 0, preco: preco }]);
  }

  function removeVariacao(idx) {
    setVariacoes((v) => v.filter((_, i) => i !== idx));
  }

  async function uploadPhotos() {
    if (!files || files.length === 0) return [];
    const fd = new FormData();
    for (const f of files) fd.append("photos", f, f.name);

    const res = await fetch("http://localhost:5000/api/upload", { method: "POST", body: fd });
    if (!res.ok) throw new Error("Erro ao enviar imagens");
    return res.json();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const uploaded = await uploadPhotos();

      // normalize variacoes: ensure numbers
      const variacoesNorm = variacoes.map((v) => ({
        tamanho: v.tamanho,
        sku: v.sku || `${nome}-${v.tamanho}`,
        estoque: Number(v.estoque) || 0,
        preco: Number(v.preco) || Number(preco) || 0,
      }));

      const payload = {
        nome_produto: nome,
        descricao,
        preco: Number(preco),
        id_categoria: Number(categoria) || (categories[0] && categories[0].id_categoria) || 1,
        tipo,
        variacoes_estoque: variacoesNorm,
        fotos: uploaded,
      };

      const res = await fetch("http://localhost:5000/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.mensagem || "Erro ao criar produto");
      }

      setMessage("Produto criado com sucesso");
      setNome("");
      setDescricao("");
      setPreco(0);
      setVariacoes([{ tamanho: "M", sku: "", estoque: 0, preco: 0 }]);
      setFiles([]);
    } catch (err) {
      setMessage(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <h2>Adicionar Produto (Admin)</h2>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label>Nome</label>
        <input value={nome} onChange={(e) => setNome(e.target.value)} required />

        <label>Descrição</label>
        <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} />

        <label>Preço</label>
        <input type="number" step="0.01" value={preco} onChange={(e) => setPreco(e.target.value)} required />

        <label>Categoria</label>
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          <option value="">-- Selecionar --</option>
          {categories.map((c) => (
            <option key={c.id_categoria} value={c.id_categoria}>{c.nome_categoria}</option>
          ))}
        </select>

        <label>Tipo</label>
        <input value={tipo} onChange={(e) => setTipo(e.target.value)} />

        <div className={styles.variacoes}>
          <h4>Variações (tamanhos)</h4>
          {variacoes.map((v, i) => (
            <div key={i} className={styles.varRow}>
              <input placeholder="Tamanho" value={v.tamanho} onChange={(e) => setVariacoes((arr) => { const copy = [...arr]; copy[i].tamanho = e.target.value; return copy; })} />
              <input placeholder="SKU (opcional)" value={v.sku} onChange={(e) => setVariacoes((arr) => { const copy = [...arr]; copy[i].sku = e.target.value; return copy; })} />
              <input placeholder="Estoque" type="number" value={v.estoque} onChange={(e) => setVariacoes((arr) => { const copy = [...arr]; copy[i].estoque = e.target.value; return copy; })} />
              <input placeholder="Preço (opcional)" type="number" step="0.01" value={v.preco} onChange={(e) => setVariacoes((arr) => { const copy = [...arr]; copy[i].preco = e.target.value; return copy; })} />
              <button type="button" onClick={() => removeVariacao(i)}>Remover</button>
            </div>
          ))}
          <button type="button" onClick={addVariacao}>Adicionar variação</button>
        </div>

        <label>Fotos</label>
        <input type="file" multiple accept="image/*" onChange={(e) => setFiles(Array.from(e.target.files))} />

        <div className={styles.actions}>
          <button type="submit" disabled={loading}>{loading ? "Enviando..." : "Criar Produto"}</button>
        </div>
      </form>
      {message && <div className={styles.message}>{message}</div>}
    </div>
  );
}
