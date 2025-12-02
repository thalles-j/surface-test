import { useEffect, useState } from "react";
import styles from "./style.module.css";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { api } from "../../services/api";
import PageLoader from "../../components/PageLoader";

export default function Profile() {
  const [activeSection, setActiveSection] = useState("dados");
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  // Estados locais
  const [userData, setUserData] = useState(user);
  const [editedData, setEditedData] = useState(user);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState(false);

  // Estados de Pedidos
  const [pedidos, setPedidos] = useState([]);
  const [loadingPedidos, setLoadingPedidos] = useState(false);
  const [errorPedidos, setErrorPedidos] = useState(null);

  // Estados de Senha
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Estado de Mensagens (Feedback)
  const [message, setMessage] = useState({ text: null, type: null });

  // Helper para exibir mensagens temporárias
  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: null, type: null }), 4000);
  };

  // Limpa mensagens ao trocar de aba
  useEffect(() => {
    setMessage({ text: null, type: null });
  }, [activeSection]);

  // Proteção de rota e sincronização
  useEffect(() => {
    if (!loading && !user) navigate("/entrar");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      setUserData(user);
      setEditedData(user);
    }
  }, [user]);

  // Busca de Pedidos
  useEffect(() => {
    if (activeSection !== "pedidos" || !user || loadingPedidos) return;

    setLoadingPedidos(true);
    setErrorPedidos(null);

    const userId = user.id || user._id || user.id_usuario;

    api.get(`/pedidos/${userId}`)
      .then((response) => {
        const lista = response.data.pedidos || response.data || [];
        setPedidos(Array.isArray(lista) ? lista : []);
      })
      .catch((err) => {
        console.error(err);
        setErrorPedidos("Não foi possível carregar seus pedidos.");
      })
      .finally(() => setLoadingPedidos(false));
  }, [activeSection, user]);

  // Handlers de Formulário
  const handleChange = (field, value) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  const updateEnderecoField = (index, field, value) => {
    setEditedData((prev) => {
      const novoEnderecos = [...(prev.enderecos || [])];
      novoEnderecos[index] = { ...novoEnderecos[index], [field]: value };
      return { ...prev, enderecos: novoEnderecos };
    });
  };

  const handleSaveData = async (e) => {
    e.preventDefault();
    setSaving(true);
    showMessage(null);

    const hasPrincipal = editedData.enderecos?.some((e) => e.principal);
    if (!hasPrincipal && editedData.enderecos?.length > 0) {
      showMessage("Selecione um endereço como principal.", "error");
      setSaving(false);
      return;
    }

    try {
      const userId = user.id || user._id || user.id_usuario;
      const response = await api.put(`/users/${userId}`, editedData);

      const updatedUser = response.data.user || response.data.usuario || response.data;
      setUserData(updatedUser);
      setEditName(false);
      showMessage("Perfil atualizado com sucesso!", "success");
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.mensagem || err.response?.data?.error || "Erro ao salvar alterações.";
      showMessage(errorMsg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordSaving(true);
    showMessage(null);

    if (newPassword !== confirmNewPassword) {
      showMessage("A nova senha e a confirmação não coincidem.", "error");
      setPasswordSaving(false);
      return;
    }
    if (newPassword.length < 6) {
      showMessage("A nova senha deve ter pelo menos 6 caracteres.", "error");
      setPasswordSaving(false);
      return;
    }

    try {
      const userId = user.id || user._id || user.id_usuario;
      await api.put("/conta/senha", {
        id: userId,
        current_password: currentPassword,
        new_password: newPassword,
      });

      showMessage("Senha atualizada com sucesso!", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.mensagem || "Erro ao atualizar a senha.";
      showMessage(errorMsg, "error");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/entrar");
    } catch {
      showMessage("Erro ao sair da conta", "error");
    }
  };

  // Gerenciamento de Endereços
  const handleAddEndereco = () => {
    if (editedData.enderecos?.length >= 5) {
      showMessage("Você atingiu o limite de 5 endereços.", "error");
      return;
    }
    const isFirst = !editedData.enderecos || editedData.enderecos.length === 0;
    const novo = { logradouro: "", numero: "", cidade: "", estado: "", cep: "", principal: isFirst };
    const currentEnderecos = (editedData.enderecos || []).map((e) => ({ ...e, principal: isFirst ? true : e.principal }));

    setEditedData((prev) => ({ ...prev, enderecos: [...currentEnderecos, novo] }));
  };

  const handleRemoveEndereco = (index) => {
    const remaining = editedData.enderecos.filter((_, i) => i !== index);
    if (editedData.enderecos[index].principal && remaining.length > 0) {
      remaining[0].principal = true;
    }
    setEditedData((prev) => ({ ...prev, enderecos: remaining }));
  };

  const handleSelectPrincipal = (index) => {
    setEditedData((prev) => ({
      ...prev,
      enderecos: prev.enderecos.map((end, i) => ({ ...end, principal: i === index })),
    }));
  };

  const formatCurrency = (value) => `R$ ${(Number(value) || 0).toFixed(2).replace(".", ",")}`;

  if (loading) return <PageLoader />;
  if (!userData) return null;

  return (
    <section>
      <main className={styles.profileMain}>
        <div className={styles.profileContainer}>
          
          {/* Header */}
          <div className={styles.profileHeader}>
            <div className={styles.profileButtons}>
              <button className={`${styles.btn_tab} ${activeSection === "dados" ? styles.active : ""}`} onClick={() => setActiveSection("dados")}>
                Meus Dados
              </button>
              <button className={`${styles.btn_tab} ${activeSection === "pedidos" ? styles.active : ""}`} onClick={() => setActiveSection("pedidos")}>
                Meus Pedidos
              </button>
              <button className={`${styles.btn_tab} ${activeSection === "senha" ? styles.active : ""}`} onClick={() => setActiveSection("senha")}>
                Nova Senha
              </button>
            </div>
            <div className={styles.logout}>
              <button className={styles.btn_logout} onClick={handleLogout}>Sair da Conta</button>
            </div>
          </div>

          <div className={styles.profileBody}>
            
            {/* --- ABA DADOS --- */}
            <div className={styles.box_section} style={{ display: activeSection === "dados" ? "block" : "none" }}>
              <h3 className={styles.sectionTitle}>Meus Dados</h3>
              <form className={styles.form} onSubmit={handleSaveData}>
                
                <div className={styles.field} onClick={() => !editName && setEditName(true)} style={{ cursor: editName ? "default" : "pointer" }}>
                  {!editName ? (
                    <p title="Clique para editar"><strong>Nome:</strong> {userData.nome} ✎</p>
                  ) : (
                    <div className={styles.field_full}>
                      <label>Nome Completo</label>
                      <input type="text" value={editedData.nome || ""} onChange={(e) => handleChange("nome", e.target.value)} autoFocus />
                    </div>
                  )}
                </div>

                <div className={styles.field}>
                  <label>Email</label>
                  <input type="email" value={editedData.email || ""} disabled style={{ backgroundColor: "#f0f0f0" }} />
                </div>

                <div className={styles.field}>
                  <label>Telefone</label>
                  <input type="text" value={editedData.telefone || ""} onChange={(e) => handleChange("telefone", e.target.value)} placeholder="(11) 99999-9999" />
                </div>

                <h4 className={styles.subtitle}>Endereços ({editedData.enderecos?.length || 0}/5)</h4>
                
                {editedData.enderecos?.length === 0 && <p style={{marginBottom: '1rem', color:'#666'}}>Nenhum endereço cadastrado.</p>}

                {editedData.enderecos?.map((endereco, index) => (
                  <div key={index} className={`${styles.enderecoCard} ${endereco.principal ? styles.enderecoPrincipal : ""}`}>
                    <div className={styles.fieldRow}>
                      <div className={`${styles.field} ${styles.field_70}`}>
                        <label>Logradouro</label>
                        <input value={endereco.logradouro || ""} onChange={(e) => updateEnderecoField(index, "logradouro", e.target.value)} required placeholder="Rua..." />
                      </div>
                      <div className={`${styles.field} ${styles.field_30}`}>
                        <label>Número</label>
                        <input value={endereco.numero || ""} onChange={(e) => updateEnderecoField(index, "numero", e.target.value)} required placeholder="123" />
                      </div>
                    </div>
                    <div className={styles.fieldRow}>
                      <div className={`${styles.field} ${styles.field_half}`}>
                        <label>Cidade</label>
                        <input value={endereco.cidade || ""} onChange={(e) => updateEnderecoField(index, "cidade", e.target.value)} required />
                      </div>
                      <div className={`${styles.field} ${styles.field_20}`}>
                        <label>UF</label>
                        <input value={endereco.estado || ""} maxLength={2} onChange={(e) => updateEnderecoField(index, "estado", e.target.value.toUpperCase())} required placeholder="SP" />
                      </div>
                      <div className={`${styles.field} ${styles.field_30}`}>
                        <label>CEP</label>
                        <input value={endereco.cep || ""} onChange={(e) => updateEnderecoField(index, "cep", e.target.value)} required placeholder="00000-000" />
                      </div>
                    </div>
                    <div className={styles.enderecoActions}>
                      <label className={styles.label_principal}>
                        <input type="radio" name={`principal-${index}`} checked={endereco.principal} onChange={() => handleSelectPrincipal(index)} />
                        Endereço Principal {endereco.principal && <span className={styles.badge}>Atual</span>}
                      </label>
                      <button type="button" onClick={() => handleRemoveEndereco(index)} className={styles.btn_remove}>Remover</button>
                    </div>
                  </div>
                ))}

                <button type="button" className={styles.btn_addEndereco} onClick={handleAddEndereco} disabled={editedData.enderecos?.length >= 5}>
                  + Adicionar novo endereço
                </button>

                {/* MENSAGEM DE FEEDBACK AQUI */}
                {message.text && (
                  <div className={`${styles.msg_retorno} ${message.type === "error" ? styles.error : styles.success}`}>
                    {message.text}
                  </div>
                )}

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
              {loadingPedidos && <PageLoader />}
              {!loadingPedidos && (
                errorPedidos ? <p className={`${styles.msg_retorno} ${styles.error}`}>{errorPedidos}</p> :
                pedidos.length > 0 ? pedidos.map((pedido) => (
                  <div key={pedido.id_pedido || pedido._id} className={styles.pedido}>
                    <div className={styles.pedidoInfoContainer}>
                      <div className={styles.pedidoStatus}>
                        <p><strong>Pedido #{pedido.id_pedido || pedido._id}</strong></p>
                        <p>Data: {new Date(pedido.data_pedido || pedido.createdAt).toLocaleDateString("pt-BR")}</p>
                        <p>Status: <strong className={pedido.status === 'Entregue' ? styles.statusSuccess : styles.statusWarning}>{pedido.status}</strong></p>
                      </div>
                      <div className={styles.pedidoProductsContainer}>
                        {pedido.pedidoProdutos?.map((pp, i) => {
                          const imgUrl = pp.produto?.imagem ? (pp.produto.imagem.startsWith('http') ? pp.produto.imagem : `http://localhost:5000${pp.produto.imagem}`) : null;
                          return (
                            <div key={i} className={styles.pedidoProductItem}>
                              {imgUrl ? <img src={imgUrl} alt={pp.produto?.nome} className={styles.pedidoImageContainer} /> : <div className={styles.pedidoImagemPlaceholder}>Sem Imagem</div>}
                              <div className={styles.pedidoProductDetails}>
                                <p><strong>{pp.produto?.nome_produto || "Produto"}</strong></p>
                                <p>Qtd: {pp.quantidade || 1} {pp.tamanho && `| Tam: ${pp.tamanho}`}</p>
                                <p>Total: {formatCurrency((parseFloat(pp.produto?.preco) || 0) * (pp.quantidade || 1))}</p>
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
                )) : <p style={{color: '#666'}}>Você ainda não fez pedidos.</p>
              )}
            </div>

            {/* --- ABA SENHA --- */}
            <div className={styles.box_section} style={{ display: activeSection === "senha" ? "block" : "none" }}>
              <h3 className={styles.sectionTitle}>Alterar Senha</h3>
              <p className={styles.sectionDescription}>Confirme a senha atual para definir uma nova.</p>
              <form className={styles.form} onSubmit={handleChangePassword}>
                <div className={styles.field}>
                  <label>Senha Atual</label>
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                </div>
                <div className={styles.field}>
                  <label>Nova Senha</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
                </div>
                <div className={styles.field}>
                  <label>Confirmar Nova Senha</label>
                  <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required minLength={6} />
                </div>

                {/* MENSAGEM DE FEEDBACK AQUI */}
                {message.text && (
                  <div className={`${styles.msg_retorno} ${message.type === "error" ? styles.error : styles.success}`}>
                    {message.text}
                  </div>
                )}

                <div className={styles.fieldsubmit}>
                  <button className={styles.btn_submit} type="submit" disabled={passwordSaving}>
                    {passwordSaving ? "Atualizando..." : "Alterar Senha"}
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      </main>
    </section>
  );
}