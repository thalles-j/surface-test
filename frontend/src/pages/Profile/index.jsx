import { useEffect, useState } from "react";
import styles from "./style.module.css";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { api } from "../../services/api"; 

export default function Profile() {
  const [activeSection, setActiveSection] = useState("dados");
  const { user, loading, logout } = useAuth(); 
  const navigate = useNavigate();

  // Estados locais
  const [userData, setUserData] = useState(user);
  const [editedData, setEditedData] = useState(user);
  
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState(false);

  // 1. Proteção de Rota
  useEffect(() => {
    if (!loading && !user) navigate("/entrar");
  }, [user, loading, navigate]);

  // 2. Sincroniza dados quando o usuário carrega
  useEffect(() => {
    if (user) {
      setUserData(user);
      setEditedData(user);
    }
  }, [user]);

  const handleChange = (field, value) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  // --- FUNÇÃO SALVAR (Com Axios) ---
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await api.put("/conta", editedData);
      
      setUserData(response.data.usuario);
      setEditName(false);
      
      alert("Perfil atualizado com sucesso!");
    } catch (err) {
      console.error(err);
      // Pega a mensagem de erro do backend se existir
      const errorMsg = err.response?.data?.mensagem || "Erro ao salvar alterações.";
      alert(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/entrar");
    } catch {
      alert("Erro ao sair da conta");
    }
  };

  // --- Lógica de Endereços (Front-only por enquanto) ---
  const handleAddEndereco = () => {
    if (editedData.enderecos?.length >= 5) return;
    const novo = { logradouro: "", numero: "", cidade: "", estado: "", cep: "", principal: false };
    setEditedData(prev => ({
      ...prev,
      enderecos: [...(prev.enderecos || []), novo]
    }));
  };

  const handleRemoveEndereco = (index) => {
    setEditedData(prev => ({
      ...prev,
      enderecos: prev.enderecos.filter((_, i) => i !== index)
    }));
  };

  const handleSelectPrincipal = (index) => {
    setEditedData(prev => ({
      ...prev,
      enderecos: prev.enderecos.map((end, i) => ({ ...end, principal: i === index }))
    }));
  };

  const formatCurrency = (value) => `R$ ${(Number(value) || 0).toFixed(2)}`;

  // --- Renderização ---
  if (loading) return <div style={{padding: 40, textAlign: 'center'}}>Carregando perfil...</div>;
  if (!userData) return null;

  return (
    <section>
      <main className={styles.profileMain}>
        <div className={styles.profileContainer}>
          
          {/* Cabeçalho do Perfil */}
          <div className={styles.profileHeader}>
            <div className={styles.profileButtons}>
              <button
                className={`${styles.btn_tab} ${activeSection === "dados" ? styles.active : ""}`}
                onClick={() => setActiveSection("dados")}
              >
                Meus Dados
              </button>
              <button
                className={`${styles.btn_tab} ${activeSection === "pedidos" ? styles.active : ""}`}
                onClick={() => setActiveSection("pedidos")}
              >
                Meus Pedidos
              </button>
            </div>
            <div className={styles.logout}>
              <button className={styles.btn_logout} onClick={handleLogout}>
                Sair da Conta
              </button>
            </div>
          </div>

          <div className={styles.profileBody}>
            
            {/* --- ABA DADOS --- */}
            <div className={styles.box_section} style={{ display: activeSection === "dados" ? "block" : "none" }}>
              <h3 className={styles.sectionTitle}>Meus Dados</h3>
              <form className={styles.form} onSubmit={handleSave}>
                
                {/* Edição de Nome (Toggle) */}
                <div className={styles.field} onClick={() => !editName && setEditName(true)} style={{ cursor: editName ? "default" : "pointer" }}>
                  {!editName ? (
                    <p title="Clique para editar"><strong>Nome:</strong> {userData.nome} ✎</p>
                  ) : (
                    <div style={{ display: "flex", gap: "10px" }}>
                      <div className={`${styles.field} ${styles.field_half}`}>
                        <label>Nome Completo</label>
                        <input
                          type="text"
                          value={editedData.nome || ""}
                          onChange={(e) => handleChange("nome", e.target.value)}
                          autoFocus
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.field}>
                  <label>Email</label>
                  <input type="email" value={editedData.email || ""} disabled style={{backgroundColor: '#f0f0f0'}} title="Email não pode ser alterado" />
                </div>
                
                <div className={styles.field}>
                   <label>Telefone</label>
                   <input type="text" value={editedData.telefone || ""} onChange={(e) => handleChange("telefone", e.target.value)} placeholder="11999999999" />
                </div>

                <h4 className={styles.subtitle}>Endereços</h4>
                {editedData.enderecos?.map((endereco, index) => (
                  <div key={index} className={styles.enderecoCard}>
                    <div className={styles.field}>
                      <label>Logradouro</label>
                      <input 
                        value={endereco.logradouro || ""} 
                        onChange={(e) => {
                            const novo = [...editedData.enderecos];
                            novo[index] = { ...novo[index], logradouro: e.target.value }; // Cria novo objeto para evitar mutação direta
                            setEditedData({ ...editedData, enderecos: novo });
                        }} 
                      />
                    </div>

                    <div className={styles.enderecoActions} style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
                      <label>
                        <input type="radio" name="principal" checked={endereco.principal} onChange={() => handleSelectPrincipal(index)} />
                        Principal
                      </label>
                      <button type="button" onClick={() => handleRemoveEndereco(index)} className={styles.btn_remove}>
                        Remover
                      </button>
                    </div>
                  </div>
                ))}

                <button type="button" className={styles.btn_addEndereco} onClick={handleAddEndereco}>
                  + Adicionar endereço
                </button>

                <div className={styles.fieldsubmit}>
                  <button className={styles.btn_submit} type="submit" disabled={saving}>
                    {saving ? "Salvando..." : "Salvar Alterações"}
                  </button>
                </div>
              </form>
            </div>

            {/* --- ABA PEDIDOS --- */}
            <div className={styles.box_section} style={{ display: activeSection === "pedidos" ? "block" : "none" }}>
              <h3 className={styles.sectionTitle}>Meus Pedidos</h3>
              {userData.pedidos && userData.pedidos.length > 0 ? (
                userData.pedidos.map((pedido) => (
                  <div key={pedido.id_pedido} className={styles.pedido}>
                    <div className={styles.pedidoInfoContainer}>
                      <div className={styles.pedidoStatus}>
                        <p><strong>Pedido #{pedido.id_pedido}</strong></p>
                        <p>Data: {new Date(pedido.data_pedido).toLocaleDateString()}</p>
                        <p>Status: <strong>{pedido.status}</strong></p>
                      </div>
                      
                      <div className={styles.pedidoProductsContainer}>
                        {pedido.pedidoProdutos?.map((pp, i) => {
                          const quantidade = pp.quantidade ?? 1;
                          const precoUnit = parseFloat(pp.produto?.preco || 0);
                          const subtotal = precoUnit * quantidade;
                          const isWrapNeeded = pedido.pedidoProdutos.length > 3;
                          
                          // Define a URL da imagem (ajuste a porta se necessário)
                          const imgUrl = pp.produto?.imagem 
                            ? `http://localhost:5000${pp.produto.imagem}` 
                            : null;

                          return (
                            <div key={i} className={`${styles.pedidoProductItem} ${isWrapNeeded ? styles.withWrap : styles.noWrap}`}>
                              {imgUrl ? (
                                <img src={imgUrl} alt={pp.produto.nome_produto} className={styles.pedidoImageContainer} />
                              ) : (
                                <div className={styles.pedidoImagemPlaceholder}>Sem Imagem</div>
                              )}
                              <div className={styles.pedidoProductDetails}>
                                <p><strong>{pp.produto?.nome_produto || "Produto"}</strong></p>
                                <p>Qtd: {quantidade} {pp.tamanho && `| Tam: ${pp.tamanho}`}</p>
                                <p>Total: {formatCurrency(subtotal)}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className={styles.pedidoTotalContainer}>
                        <strong>Total: {formatCurrency(parseFloat(pedido.total || 0))}</strong>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p>Você ainda não fez pedidos.</p>
              )}
            </div>

          </div>
        </div>
      </main>
    </section>
  );
}