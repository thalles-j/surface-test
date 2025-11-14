import { useEffect, useState } from "react";
import styles from "./style.module.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
// Não precisamos mais do apiMe aqui

export default function Profile() {
  const [activeSection, setActiveSection] = useState("dados");
  // Pegue 'refreshMe' do contexto também
  const { user, loading, logout, refreshMe } = useAuth(); 
  const navigate = useNavigate();

  // Use o 'user' do contexto para iniciar seus estados locais
  const [userData, setUserData] = useState(user);
  const [editedData, setEditedData] = useState(user);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editName, setEditName] = useState(false); // Adicionado 'editName' que faltava

  // Este useEffect de proteção agora vai funcionar,
  // pois ele vai esperar o 'loading' do login (da Correção 1) ficar 'false'
  useEffect(() => {
    if (!loading && !user) navigate("/entrar");
  }, [user, loading, navigate]);

  // Este useEffect sincroniza o estado local se o 'user' do contexto mudar
  // (Isso substitui seu antigo useEffect que chamava apiMe)
  useEffect(() => {
    if (user) {
      setUserData(user);
      setEditedData(user);
    }
  }, [user]);

  const handleChange = (field, value) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/conta", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editedData),
      });
      if (!res.ok) throw new Error("Falha ao atualizar perfil");
      
      // Em vez de atualizar o estado local,
      // peça ao contexto para atualizar o estado global
      await refreshMe(); 
      
      setEditName(false);
      alert("Perfil atualizado com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar alterações.");
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

  // Esta lógica agora funciona:
  // 1. 'loading' será true durante o login
  if (loading) return <p>Carregando...</p>;
  
  if (error) return <p>{error}</p>;
  
  // 2. Quando 'loading' ficar false, 'user' já estará definido,
  //    e 'userData' também será definido pelo useEffect.
  if (!userData) return null;

  // O JSX restante é o mesmo
  return (
    <section>
      <main className={styles.profileMain}>
        <div className={styles.profileContainer}>
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
            <div className={styles.box_section} style={{ display: activeSection === "dados" ? "block" : "none" }}>
              <h3 className={styles.sectionTitle}>Meus Dados</h3>
              <form className={styles.form} onSubmit={handleSave}>
                <div className={styles.field} onClick={() => setEditName(true)} style={{ cursor: "pointer" }}>
                  {!editName ? (
                    <p><strong>Nome:</strong> {userData.nome}</p>
                  ) : (
                    <div style={{ display: "flex", gap: "10px" }}>
                      <div className={`${styles.field} ${styles.field_half}`}>
                        <label>Nome</label>
                        <input
                          type="text"
                          value={editedData.nome?.split(" ")[0] || ""}
                          onChange={(e) => handleChange("nome", e.target.value + " " + (editedData.nome?.split(" ")[1] || ""))}
                        />
                      </div>
                      <div className={`${styles.field} ${styles.field_half}`}>
                        <label>Sobrenome</label>
                        <input
                          type="text"
                          value={editedData.nome?.split(" ")[1] || ""}
                          onChange={(e) => handleChange("nome", (editedData.nome?.split(" ")[0] || "") + " " + e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.field}>
                  <label>Email</label>
                  <input type="email" value={editedData.email || ""} onChange={(e) => handleChange("email", e.target.value)} />
                </div>

                <h4 className={styles.subtitle}>Endereços</h4>
                {editedData.enderecos?.map((endereco, index) => (
                  <div key={index} className={styles.enderecoCard}>
                    <div className={styles.field}>
                      <label>Logradouro</label>
                      <input value={endereco.logradouro || ""} onChange={(e) => {
                        const novo = [...editedData.enderecos];
                        novo[index].logradouro = e.target.value;
                        setEditedData({ ...editedData, enderecos: novo });
                      }} />
                    </div>

                    <div className={styles.enderecoActions} style={{ display: "flex", justifyContent: "space-between" }}>
                      <label>
                        <input type="radio" name="principal" checked={endereco.principal} onChange={() => handleSelectPrincipal(index)} />
                        Endereço principal
                      </label>
                      <button type="button" onClick={() => handleRemoveEndereco(index)} className={styles.btn_remove}>
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}

                <button type="button" className={styles.btn_addEndereco} onClick={handleAddEndereco}>
                  + Adicionar outro endereço
                </button>

                <div className={styles.fieldsubmit}>
                  <button className={styles.btn_submit} type="submit" disabled={saving}>
                    {saving ? "Salvando..." : "Salvar Alterações"}
                  </button>
                </div>
              </form>
            </div>

            <div className={styles.box_section} style={{ display: activeSection === "pedidos" ? "block" : "none" }}>
              <h3 className={styles.sectionTitle}>Meus Pedidos</h3>
              {userData.pedidos && userData.pedidos.length > 0 ? (
                userData.pedidos.map((pedido) => (
                  <div key={pedido.id_pedido} className={styles.pedido}>
                    <div className={styles.pedidoInfoContainer}>
                      <div className={styles.pedidoStatus}>
                        <p><strong>Número do Pedido:</strong> #{pedido.id_pedido}</p>
                        <p><strong>Status:</strong> {pedido.status}</p>
                      </div>
                      <div className={styles.pedidoProductsContainer}>
                        {pedido.pedidoProdutos?.map((pp, i) => {
                          const quantidade = pp.quantidade ?? 1;
                          const precoUnit = parseFloat(pp.produto?.preco || 0);
                          const subtotal = precoUnit * quantidade;
                          const isWrapNeeded = pedido.pedidoProdutos.length > 3;
                          return (
                            <div key={i} className={`${styles.pedidoProductItem} ${isWrapNeeded ? styles.withWrap : styles.noWrap}`}>
                              {pp.produto?.imagem ? (
                                <img src={`http://localhost:5000${pp.produto.imagem}`} alt={pp.produto.nome_produto} className={styles.pedidoImageContainer} />
                              ) : (
                                <div className={styles.pedidoImagemPlaceholder} />
                              )}
                              <div className={styles.pedidoProductDetails}>
                                <p><strong>{pp.produto?.nome_produto || "Produto"}</strong></p>
                                <p>Uni: {quantidade}</p>
                                {pp.tamanho && <p>Tam: {pp.tamanho}</p>}
                                <p><strong>Subtotal: {formatCurrency(subtotal)}</strong></p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className={styles.pedidoTotalContainer}>
                        <strong>Total do pedido: {formatCurrency(parseFloat(pedido.total || 0))}</strong>
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