import React, { useState, useEffect, useRef } from 'react';
import styles from './style.module.css';

import { api } from '../../services/api';
import useAuth from '../../hooks/useAuth';

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
  const { logout } = useAuth(); 

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
  const [pedidosStatus, setPedidosStatus] = useState({});

  // --- Carregamento Inicial ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 1. Buscar Produtos (Rota: /api/products)
        const resProducts = await api.get('/products');
        setProdutosList(resProducts.data);

        
      } catch (err) {
        console.error(err);
        setMessage("Erro ao carregar dados. Verifique se o backend está rodando.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // --- Funções do Formulário ---

  const handleChangeProdutoForm = (e) => {
    const { name, value } = e.target;
    setProdutoFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddProduto = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Validações
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

      // 1. Upload de Imagens (Rota: /api/upload)
      if (files.length > 0) {
        const formData = new FormData();
        Array.from(files).forEach(file => {
          // Certifique-se que seu Multer no backend espera o campo 'photos' ou 'images'
          formData.append('photos', file); 
        });

        const uploadRes = await api.post('/upload', formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        
        // O backend deve retornar um array de objetos { url, filename } ou strings
        uploadedFiles = uploadRes.data; 
      }

      // 2. Preparar JSON
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

      // 3. Criar Produto (Rota: /api/products)
      const prodRes = await api.post('/products', novoProdutoBody);
      
      // Atualiza a lista na tela
      setProdutosList(prev => [...prev, prodRes.data]);
      setMessage("Produto cadastrado com sucesso!");
      
      // Limpa o form
      setProdutoFormData(PRODUTO_FORM_INICIAL);
      setVariacoes([VARIACAO_INICIAL]);
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = null;

    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.mensagem || err.message;
      setMessage(`Erro: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // --- Variações ---
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
      await api.delete(`/products/${id}`);
      setProdutosList(prev => prev.filter(p => p.id !== id)); // Otimista: remove da tela
      setMessage("Produto excluído.");
    } catch (err) {
      setMessage("Erro ao excluir produto.");
    }
  };

  const handlePedidoStatusChange = async (id, newStatus) => {
    const oldStatus = pedidosStatus[id];
    setPedidosStatus(prev => ({ ...prev, [id]: newStatus })); // Otimista

    try {
      await api.patch(`/orders/${id}`, { status: newStatus });
      setMessage(`Pedido #${id} atualizado para ${newStatus}`);
    } catch (err) {
      setPedidosStatus(prev => ({ ...prev, [id]: oldStatus })); // Reverte
      setMessage("Erro ao atualizar status do pedido.");
    }
  };
  
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
              <button className={styles.btn_logout} onClick={logout}>Sair da Conta</button>
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
                    <th>Estoque Total</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {produtosList.map(p => (
                    // AQUI ESTAVA O ERRO: Usamos as chaves do JSON real agora
                    <tr key={p.id_produto}>
                      <td data-label="ID">{p.id_produto}</td>
                      <td data-label="Nome">{p.nome_produto}</td>
                      <td data-label="Preço">R$ {parseFloat(p.preco).toFixed(2)}</td>
                      <td data-label="Estoque">
                        {/* Calcula o total somando o array 'variacoes_estoque' */}
                        {p.variacoes_estoque 
                            ? p.variacoes_estoque.reduce((acc, v) => acc + (v.estoque || 0), 0) 
                            : 0}
                      </td>
                      <td data-label="Ações">
                        <button 
                          className={`${styles.btn_action} ${styles.delete}`} 
                          onClick={() => handleDeleteProduto(p.id_produto)}
                        >
                          Excluir
                        </button>
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
                  {pedidosList.length > 0 ? pedidosList.map(p => (
                    <tr key={p.id}>
                      <td data-label="ID">#{p.id}</td>
                      <td data-label="Cliente">{p.cliente || `ID: ${p.id_usuario}`}</td>
                      <td data-label="Data">{new Date(p.createdAt || p.data_pedido).toLocaleDateString()}</td>
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
                  )) : (
                    <tr>
                       <td colSpan="5" style={{textAlign: 'center'}}>Nenhum pedido encontrado (ou rota não configurada).</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
          </div>
        </div>
      </main>
    </>
  );
};