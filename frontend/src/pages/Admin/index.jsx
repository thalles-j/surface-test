import React, { useState, useEffect, useRef } from 'react';
import styles from './style.module.css';

// --- CONFIGURAÇÃO DA API ---
const API_BASE = import.meta.env.VITE_API_BASE;

// Ajuste os endpoints conforme suas rotas no Node.js
const ENDPOINTS = {
  products: `${API_BASE}/products/`,  // GET para listar, POST para criar
  upload:   `${API_BASE}/upload`,    // POST para enviar imagens
  orders:   `${API_BASE}/orders`,    // GET para listar
};

const MessageBox = ({ message, onClose }) => {
  if (!message) return null;
  return (
    <div className={`${styles.messageOverlay} ${message ? styles.show : ""}`} onClick={onClose}>
      <div className={styles.messageBox} onClick={(e) => e.stopPropagation()}>
        <p>{message}</p>
        <button onClick={onClose}>Fechar</button>
      </div>
    </div>
  );
};

const PRODUTO_FORM_INICIAL = {
  nome: "",
  preco_base: "",
  categoria: "camisetas",
  descricao: ""
};

const VARIACAO_INICIAL = { tamanho: 'M', sku: '', estoque: '', preco: '' };

export default function AdminPainel() {
  const [activeTab, setActiveTab] = useState("produtos");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // --- Estados do Formulário ---
  const [produtoFormData, setProdutoFormData] = useState(PRODUTO_FORM_INICIAL);
  const [variacoes, setVariacoes] = useState([VARIACAO_INICIAL]);
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);
  
  // --- Estados dos Dados ---
  const [produtosList, setProdutosList] = useState([]);
  const [pedidosList, setPedidosList] = useState([]);
  const [pedidosStatus, setPedidosStatus] = useState({}); // Mapa para status local

  // --- Carregamento Inicial (Real) ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Busca paralela de produtos e pedidos
        const [resProducts, resOrders] = await Promise.all([
          fetch(ENDPOINTS.products),
          fetch(ENDPOINTS.orders)
        ]);

        if (!resProducts.ok || !resOrders.ok) throw new Error("Falha ao buscar dados");

        const productsData = await resProducts.json();
        const ordersData = await resOrders.json();
        
        // Backend deve retornar o array de produtos. Se retornar { data: [...] }, ajuste aqui.
        setProdutosList(productsData);
        setPedidosList(ordersData);
        
        // Inicializa o mapa de status
        const statusMap = ordersData.reduce((acc, p) => ({ ...acc, [p.id]: p.status }), {});
        setPedidosStatus(statusMap);
        
      } catch (err) {
        console.error(err);
        setMessage("Erro ao conectar com o servidor. Verifique se o backend está rodando.");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (API_BASE) fetchData();
    else setMessage("Erro: VITE_API_BASE não está definida no .env");
    
  }, []);

  // --- Funções do Formulário ---

  const handleChangeProdutoForm = (e) => {
    const { name, value } = e.target;
    setProdutoFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogout = () => {
    // Adicione lógica real de logout aqui (remover token do localStorage, etc)
    window.location.href = "/"; 
  };

  const handleAddProduto = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // 1. Validação básica
    if (!produtoFormData.nome) {
      setMessage("Por favor, informe o nome do produto.");
      setIsSubmitting(false);
      return;
    }
    if (variacoes.length === 0 || !variacoes[0].tamanho) {
      setMessage("Por favor, adicione pelo menos uma variação.");
      setIsSubmitting(false);
      return;
    }

    try {
      let uploadedFiles = [];

      // 2. Upload de Imagens (Se houver arquivos)
      if (files.length > 0) {
        const formData = new FormData();
        Array.from(files).forEach(file => {
          formData.append('photos', file); // O backend deve esperar 'photos' ou 'images'
        });

        const uploadRes = await fetch(ENDPOINTS.upload, {
          method: 'POST',
          body: formData, 
          // Nota: Não defina 'Content-Type' manualmente para multipart/form-data, o navegador faz isso.
        });

        if (!uploadRes.ok) throw new Error("Erro no upload das imagens");
        uploadedFiles = await uploadRes.json(); // Espera array de objetos { url, filename }
      }

      // 3. Preparar Payload JSON
      const precoBaseNum = parseFloat(produtoFormData.preco_base) || 0;
      
      const variacoesNorm = variacoes.map(v => ({
        tamanho: v.tamanho,
        sku: v.sku || `${produtoFormData.nome.toUpperCase().substring(0, 3)}-${v.tamanho}`,
        estoque: parseInt(v.estoque) || 0,
        preco: v.preco ? parseFloat(v.preco) : precoBaseNum
      }));

      const novoProdutoBody = {
        ...produtoFormData,
        preco_base: precoBaseNum,
        fotos: uploadedFiles,
        variacoes: variacoesNorm
      };

      // 4. Enviar Produto (JSON)
      const prodRes = await fetch(ENDPOINTS.products, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(novoProdutoBody)
      });

      if (!prodRes.ok) throw new Error("Erro ao salvar produto no banco");
      
      const savedProduct = await prodRes.json();

      // 5. Atualizar UI
      setProdutosList(prev => [...prev, savedProduct]);
      setMessage("Produto cadastrado com sucesso!");
      
      // Resetar Form
      setProdutoFormData(PRODUTO_FORM_INICIAL);
      setVariacoes([VARIACAO_INICIAL]);
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = null;

    } catch (err) {
      console.error(err);
      setMessage(`Erro: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // --- Variações (Logica local) ---
  const handleVariacaoChange = (index, field, value) => {
    const newVariacoes = [...variacoes];
    newVariacoes[index][field] = value;
    setVariacoes(newVariacoes);
  };

  const addVariacao = () => setVariacoes(prev => [...prev, { ...VARIACAO_INICIAL, tamanho: '' }]);
  
  const removeVariacao = (index) => {
    if (variacoes.length > 1) setVariacoes(prev => prev.filter((_, i) => i !== index));
  };
  
  // --- Ações nas Listas ---

  const handleDeleteProduto = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir este produto?")) return;

    try {
      const res = await fetch(`${ENDPOINTS.products}/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error("Erro ao deletar");

      setProdutosList(prev => prev.filter(p => p.id !== id));
      setMessage("Produto excluído.");
    } catch (err) {
      setMessage("Erro ao excluir produto.");
    }
  };

  const handlePedidoStatusChange = async (id, newStatus) => {
    // Atualização otimista (muda na tela antes de confirmar no server)
    const oldStatus = pedidosStatus[id];
    setPedidosStatus(prev => ({ ...prev, [id]: newStatus }));

    try {
      const res = await fetch(`${ENDPOINTS.orders}/${id}`, { // ou PATCH `${ENDPOINTS.orders}/${id}/status`
        method: 'PATCH', // ou PUT dependendo do seu backend
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error("Falha ao atualizar status");
      
      setMessage(`Pedido #${id} atualizado para ${newStatus}`);
    } catch (err) {
      // Reverte se der erro
      setPedidosStatus(prev => ({ ...prev, [id]: oldStatus }));
      setMessage("Erro ao atualizar status do pedido.");
    }
  };
  
  // --- Helpers de UI ---
  const getTabClassName = (tabName) => `${styles.btn_tab} ${activeTab === tabName ? styles.active : ""}`;

  if (isLoading) return <div className={styles.loadingContainer}>Carregando painel...</div>;
  
  return (
    <>
      <MessageBox message={message} onClose={() => setMessage("")} />
      
      <main className={styles.profileMain}>
        <div className={styles.profileContainer}>
          <div className={styles.profileHeader}>
            <div className={styles.profileButtons}>
              <button className={getTabClassName("produtos")} onClick={() => setActiveTab("produtos")}>
                Gerenciar Produtos
              </button>
              <button className={getTabClassName("pedidos")} onClick={() => setActiveTab("pedidos")}>
                Gerenciar Pedidos
              </button>
            </div>
            <div className={styles.logout}>
              <button className={styles.btn_logout} onClick={handleLogout}>Sair da Conta</button>
            </div>
          </div>

          <div className={styles.profileBody}>
            
            {/* --- TAB PRODUTOS --- */}
            <div className={styles.box_section} style={{ display: activeTab === "produtos" ? "block" : "none" }}>
              <h3 className={styles.sectionTitle}>Gerenciar Produtos</h3>
              
              <form className={`${styles.form} ${styles.adminForm}`} onSubmit={handleAddProduto}>
                <h4 className={styles.subtitle} style={{ marginTop: 0 }}>Adicionar Novo Produto</h4>
                
                <div className={styles.field}>
                  <label>Nome</label>
                  <input type="text" name="nome" value={produtoFormData.nome} onChange={handleChangeProdutoForm} disabled={isSubmitting} />
                </div>
                
                <div className={styles.fieldRow}>
                  <div className={`${styles.field} ${styles.field_third}`}>
                    <label>Preço Base (R$)</label>
                    <input type="number" name="preco_base" step="0.01" value={produtoFormData.preco_base} onChange={handleChangeProdutoForm} disabled={isSubmitting} />
                  </div>
                  <div className={`${styles.field} ${styles.field_third}`}>
                    <label>Categoria</label>
                    <select name="categoria" value={produtoFormData.categoria} onChange={handleChangeProdutoForm} disabled={isSubmitting}>
                      <option value="camisetas">Camisetas</option>
                      <option value="moletons">Moletons</option>
                      <option value="acessorios">Acessórios</option>
                    </select>
                  </div>
                   <div className={`${styles.field} ${styles.field_third}`}>
                    <label>Fotos</label>
                    <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={(e) => setFiles(e.target.files)} disabled={isSubmitting} />
                  </div>
                </div>
                
                <div className={styles.field}>
                  <label>Descrição</label>
                  <textarea name="descricao" value={produtoFormData.descricao} onChange={handleChangeProdutoForm} disabled={isSubmitting}></textarea>
                </div>

                {/* Variações Dinâmicas */}
                <div className={styles.variationsContainer}>
                  <label>Variações</label>
                  {variacoes.map((v, i) => (
                    <div key={i} className={styles.varRow}>
                      <input type="text" placeholder="Tam" className={styles.field_tamanho} value={v.tamanho} onChange={(e) => handleVariacaoChange(i, 'tamanho', e.target.value)} disabled={isSubmitting} />
                      <input type="text" placeholder="SKU" className={styles.field_sku} value={v.sku} onChange={(e) => handleVariacaoChange(i, 'sku', e.target.value)} disabled={isSubmitting} />
                      <input type="number" placeholder="Qtd" className={styles.field_estoque} value={v.estoque} onChange={(e) => handleVariacaoChange(i, 'estoque', e.target.value)} disabled={isSubmitting} />
                      <input type="number" placeholder="R$ (Opcional)" className={styles.field_preco} step="0.01" value={v.preco} onChange={(e) => handleVariacaoChange(i, 'preco', e.target.value)} disabled={isSubmitting} />
                      <button type="button" className={styles.btn_removeVar} onClick={() => removeVariacao(i)} disabled={isSubmitting || variacoes.length <= 1}>&times;</button>
                    </div>
                  ))}
                  <button type="button" className={styles.btn_addVar} onClick={addVariacao} disabled={isSubmitting}>+ Variação</button>
                </div>
                
                <div className={styles.fieldsubmit}>
                  <button className={styles.btn_submit} type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Enviando..." : "Salvar Produto"}
                  </button>
                </div>
              </form>
              
              <h4 className={styles.subtitle}>Lista de Produtos</h4>
              <table className={styles.adminTable}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nome</th>
                    <th>Preço</th>
                    <th>Estoque</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {produtosList.map(p => (
                    <tr key={p.id}>
                      <td data-label="ID">{p.id}</td>
                      <td data-label="Nome">{p.nome}</td>
                      <td data-label="Preço">R$ {parseFloat(p.preco_base).toFixed(2)}</td>
                      <td data-label="Estoque">{p.estoque || p.variacoes?.reduce((acc, v) => acc + v.estoque, 0)}</td>
                      <td data-label="Ações">
                        <button className={`${styles.btn_action} ${styles.delete}`} onClick={() => handleDeleteProduto(p.id)}>Excluir</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* --- TAB PEDIDOS --- */}
            <div className={styles.box_section} style={{ display: activeTab === "pedidos" ? "block" : "none" }}>
              <h3 className={styles.sectionTitle}>Gerenciar Pedidos</h3>
              <table className={styles.adminTable}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Data</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidosList.map(p => (
                    <tr key={p.id}>
                      <td data-label="ID">#{p.id}</td>
                      <td data-label="Cliente">{p.cliente || `Cliente ${p.userId}`}</td>
                      <td data-label="Data">{new Date(p.createdAt || p.data).toLocaleDateString()}</td>
                      <td data-label="Total">R$ {parseFloat(p.total).toFixed(2)}</td>
                      <td data-label="Status">
                        <select 
                          value={pedidosStatus[p.id] || p.status}
                          onChange={(e) => handlePedidoStatusChange(p.id, e.target.value)}
                        >
                          <option value="Processando">Processando</option>
                          <option value="Enviado">Enviado</option>
                          <option value="Entregue">Entregue</option>
                          <option value="Cancelado">Cancelado</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
          </div>
        </div>
      </main>
    </>
  );
};