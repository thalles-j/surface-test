import { useEffect, useState } from "react";
import styles from "./style.module.css";

export default function Profile() {
  const [activeSection, setActiveSection] = useState("dados");
  const [userData, setUserData] = useState(null);
  const [editName, setEditName] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // 🧠 Buscar dados do usuário logado
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/conta", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Falha ao carregar perfil");
        const data = await res.json();
        setUserData(data);
        setEditedData(data);
      } catch (err) {
        console.error(err);
        setError("Erro ao carregar dados do usuário");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // ✏️ Alterar campos de edição
  const handleChange = (field, value) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  // 💾 Salvar alterações (PUT /api/conta)
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
      const updated = await res.json();
      setUserData(updated);
      setEditedData(updated);
      setEditName(false);
      alert("Perfil atualizado com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar alterações.");
    } finally {
      setSaving(false);
    }
  };

  // 🏠 Adicionar novo endereço
  const handleAddEndereco = () => {
    if (editedData.enderecos?.length >= 5) {
      alert("Limite máximo de 5 endereços atingido!");
      return;
    }
    const novo = {
      logradouro: "",
      numero: "",
      cidade: "",
      estado: "",
      cep: "",
      principal: false,
    };
    setEditedData((prev) => ({
      ...prev,
      enderecos: [...(prev.enderecos || []), novo],
    }));
  };

  // ❌ Excluir endereço
  const handleRemoveEndereco = (index) => {
    setEditedData((prev) => ({
      ...prev,
      enderecos: prev.enderecos.filter((_, i) => i !== index),
    }));
  };

  // ⭐ Marcar endereço principal
  const handleSelectPrincipal = (index) => {
    setEditedData((prev) => ({
      ...prev,
      enderecos: prev.enderecos.map((end, i) => ({
        ...end,
        principal: i === index,
      })),
    }));
  };

  const formatCurrency = (value) => {
    const n = Number(value || 0);
    return `R$ ${n.toFixed(2)}`;
  };

  if (loading) return <p>Carregando...</p>;
  if (error) return <p>{error}</p>;
  if (!userData) return null;

  return (
    <section>
      <main className={styles.profileMain}>
        <div className={styles.profileContainer}>
          <div className={styles.profileHeader}>
            <div className={styles.profileButtons}>
              <button
                className={`${styles.btn_tab} ${
                  activeSection === "dados" ? styles.active : ""
                }`}
                onClick={() => setActiveSection("dados")}
              >
                Meus Dados
              </button>
              <button
                className={`${styles.btn_tab} ${
                  activeSection === "pedidos" ? styles.active : ""
                }`}
                onClick={() => setActiveSection("pedidos")}
              >
                Meus Pedidos
              </button>
            </div>
          </div>

          <div className={styles.profileBody}>
            {/* SEÇÃO DADOS */}
            <div
              className={styles.box_section}
              style={{ display: activeSection === "dados" ? "block" : "none" }}
            >
              <h3 className={styles.sectionTitle}>Meus Dados</h3>

              <form className={styles.form} onSubmit={handleSave}>
                {/* Nome e sobrenome */}
                <div
                  className={styles.field}
                  onClick={() => setEditName(true)}
                  style={{ cursor: "pointer" }}
                >
                  {!editName ? (
                    <p>
                      <strong>Nome:</strong> {userData.nome}
                    </p>
                  ) : (
                    <div style={{ display: "flex", gap: "10px" }}>
                      <div className={`${styles.field} ${styles.field_half}`}>
                        <label>Nome</label>
                        <input
                          type="text"
                          value={editedData.nome?.split(" ")[0] || ""}
                          onChange={(e) =>
                            handleChange(
                              "nome",
                              e.target.value +
                                " " +
                                (editedData.nome?.split(" ")[1] || "")
                            )
                          }
                        />
                      </div>
                      <div className={`${styles.field} ${styles.field_half}`}>
                        <label>Sobrenome</label>
                        <input
                          type="text"
                          value={editedData.nome?.split(" ")[1] || ""}
                          onChange={(e) =>
                            handleChange(
                              "nome",
                              (editedData.nome?.split(" ")[0] || "") +
                                " " +
                                e.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.field}>
                  <label>Email</label>
                  <input
                    type="email"
                    value={editedData.email || ""}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>

                {/* Endereços */}
                <h4 className={styles.subtitle}>Endereços</h4>
                {editedData.enderecos?.map((endereco, index) => (
                  <div key={index} className={styles.enderecoCard}>
                    <div className={styles.field}>
                      <label>Logradouro</label>
                      <input
                        value={endereco.logradouro || ""}
                        onChange={(e) => {
                          const novo = [...editedData.enderecos];
                          novo[index].logradouro = e.target.value;
                          setEditedData({ ...editedData, enderecos: novo });
                        }}
                      />
                    </div>

                    <div
                      className={styles.enderecoActions}
                      style={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <label>
                        <input
                          type="radio"
                          name="principal"
                          checked={endereco.principal}
                          onChange={() => handleSelectPrincipal(index)}
                        />
                        Endereço principal
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveEndereco(index)}
                        className={styles.btn_remove}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  className={styles.btn_addEndereco}
                  onClick={handleAddEndereco}
                >
                  + Adicionar outro endereço
                </button>

                <div className={styles.fieldsubmit}>
                  <button
                    className={styles.btn_submit}
                    type="submit"
                    disabled={saving}
                  >
                    {saving ? "Salvando..." : "Salvar Alterações"}
                  </button>
                </div>
              </form>
            </div>

            {/* SEÇÃO PEDIDOS */}
            <div
              className={styles.box_section}
              style={{ display: activeSection === "pedidos" ? "block" : "none" }}
            >
              <h3 className={styles.sectionTitle}>Meus Pedidos</h3>

              {userData.pedidos && userData.pedidos.length > 0 ? (
                userData.pedidos.map((pedido) => (
                  <div key={pedido.id_pedido} className={styles.pedido}>
                    <div className={styles.pedidoInfoContainer}>
                        <div className={styles.pedidoStatus}>
                             <p>
                      <strong>Número do Pedido:</strong> #{pedido.id_pedido}
                    </p>
                    <p>
                      <strong>Status:</strong> {pedido.status}
                    </p>
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
                            <img
                              src={`http://localhost:5000${pp.produto.imagem}`}
                              alt={pp.produto.nome_produto}
                              className={styles.pedidoImageContainer}
                            />
                          ) : (
                            <div className={styles.pedidoImagemPlaceholder} />
                          )}

                          <div className={styles.pedidoProductDetails}>
                            <p><strong>{pp.produto?.nome_produto || 'Produto'}</strong></p>
                            <p>Unidades: {quantidade}</p>
                            {pp.tamanho && <p>Tamanho: {pp.tamanho}</p>}
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
