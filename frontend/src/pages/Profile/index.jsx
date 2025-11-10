import { useEffect, useState } from "react";
import styles from "./style.module.css";
import { apiMe, apiUpdateMe } from "../../services/auth.js";
import { maskPhone } from "../../utils/masks.js";
import { phoneMin9Digits, passwordMin7 } from "../../utils/validation.js";

export default function Profile() {
    const [user, setUser] = useState(null);
    const [msg, setMsg] = useState({ type: "", text: "" });

    const [editData, setEditData] = useState({
        telefone: "",
        senhaAtual: "",
        novaSenha: "",
    });

    useEffect(() => {
        (async () => {
            try {
                const usuario = await apiMe();   
                setUser(usuario);

                setEditData({
                    telefone: usuario.telefone || "",
                    senhaAtual: "",
                    novaSenha: "",
                });
            } catch (e) {
                setMsg({ type: "error", text: e.message || "Erro ao carregar perfil." });
            }
        })();
    }, []);

    const setField = (field, value) =>
        setEditData(prev => ({ ...prev, [field]: value }));

    const validate = () => {
        if (editData.telefone && !phoneMin9Digits(editData.telefone)) {
            return "Telefone inválido. Informe pelo menos 9 dígitos.";
        }

        if (editData.novaSenha) {
            if (!passwordMin7(editData.novaSenha)) {
                return "Nova senha deve ter pelo menos 7 caracteres.";
            }
            if (!editData.senhaAtual) {
                return "Informe a senha atual para alterar a senha.";
            }
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMsg({ type: "", text: "" });

        const err = validate();
        if (err) {
            setMsg({ type: "error", text: err });
            return;
        }

        try {
            const payload = {
                telefone: editData.telefone || null,
                senhaAtual: editData.senhaAtual || undefined,
                novaSenha: editData.novaSenha || undefined,
            };

            const r = await apiUpdateMe(payload);

            setMsg({ type: "success", text: r.mensagem || "Dados atualizados!" });

            const me = await apiMe();   
            setUser(me);

            setEditData(s => ({ ...s, senhaAtual: "", novaSenha: "" }));
        } catch (e) {
            setMsg({ type: "error", text: e.message || "Erro ao atualizar." });
        }
    };

    if (!user) return <p className={styles.loading}>Carregando...</p>;

    const handlePhoneChange = (e) => {
    const input = e.target;
    const selectionStart = input.selectionStart;

    // Só números
    let onlyNumbers = input.value.replace(/\D/g, "");

    // Atualiza o estado
    setField("telefone", onlyNumbers);

    // Atualiza o cursor para a posição correta
    setTimeout(() => {
        const formatted = maskPhone(onlyNumbers);
        const newPosition = selectionStart + (formatted.length - input.value.length);
        input.setSelectionRange(newPosition, newPosition);
    }, 0);
    };

    return (
        <section className={styles.profile}>
            <h1 className={styles.title}>Meu Perfil</h1>

            <div className={styles.box}>
                <h2>Informações da Conta</h2>
                <p><strong>Nome:</strong> {user.nome}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p>
                <strong>Telefone:</strong> {user.telefone ? maskPhone(user.telefone) : "Não informado"}
                </p>
                <p><strong>Data de cadastro:</strong> {new Date(user.data_cadastro).toLocaleDateString()}</p>
                <p><strong>Role (ID):</strong> {user.id_role}</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                <h2>Atualizar Dados</h2>

                <label htmlFor="tel">Telefone</label>
                <input
                id="tel"
                type="text"
                value={maskPhone(editData.telefone)}
                onChange={handlePhoneChange}
                placeholder="(11) 99999-9999"
                />

                <div className={styles.hr} />

                <label htmlFor="curr">Senha atual</label>
                <input
                    id="curr"
                    type="password"
                    value={editData.senhaAtual}
                    onChange={(e) => setField("senhaAtual", e.target.value)}
                    placeholder="Informe para alterar senha"
                />

                <label htmlFor="new">Nova senha</label>
                <input
                    id="new"
                    type="password"
                    value={editData.novaSenha}
                    onChange={(e) => setField("novaSenha", e.target.value)}
                    placeholder="Mínimo 7 caracteres"
                />

                {msg.text && (
                    <p className={msg.type === "error" ? styles.msgError : styles.msgSuccess}>
                        {msg.text}
                    </p>
                )}

                <button type="submit" className={styles.btn}>Salvar Alterações</button>
            </form>
        </section>
    );
}
