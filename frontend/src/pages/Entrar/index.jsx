import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import styles from "./style.module.css";
import useAuth from "../../hooks/useAuth";
import { apiRegister } from "../../services/auth"; 

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Estados login
  const [loginData, setLoginData] = useState({ email: "", senha: "" });
  const [loginMsg, setLoginMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Estados registro
  const [registerData, setRegisterData] = useState({
    nome: "",
    sobrenome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
  });
  const [registerMsg, setRegisterMsg] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [senhaConfere, setSenhaConfere] = useState(true);

  // Funções de validação
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (senha) => senha.trim().length >= 7;

  // --- FUNÇÃO DE LOGIN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginMsg("");

    if (!validateEmail(loginData.email)) {
      setLoginMsg("Email inválido.");
      return;
    }

    if (!validatePassword(loginData.senha)) {
      setLoginMsg("Senha deve ter no mínimo 7 caracteres.");
      return;
    }

    try {
      const user = await login(loginData);

      // Força conversão para número para garantir
      const roleId = Number(user.role);

      setLoginMsg("Login realizado com sucesso!");

      if (roleId === 1) {
        navigate("/admin");
      } else {
        navigate("/conta"); // ou "/" se preferir
      }

    } catch (error) {
      // Axios geralmente retorna a mensagem em error.response.data.mensagem
      const msg = error.response?.data?.mensagem || error.message || "Email ou senha inválidos.";
      setLoginMsg(msg);
    }
  };

  // --- FUNÇÃO DE REGISTRO (COM AXIOS) ---
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterMsg("");

    // Validações locais
    if (!registerData.nome.trim()) {
      setRegisterMsg("Nome obrigatório.");
      return;
    }
    if (!registerData.sobrenome.trim()) {
      setRegisterMsg("Sobrenome obrigatório.");
      return;
    }
    if (!validateEmail(registerData.email)) {
      setRegisterMsg("Email inválido.");
      return;
    }
    if (!validatePassword(registerData.senha)) {
      setRegisterMsg("Senha deve ter no mínimo 7 caracteres.");
      return;
    }
    if (!senhaConfere) {
      setRegisterMsg("As senhas não conferem.");
      return;
    }

    const nomeCompleto = `${registerData.nome.trim()} ${registerData.sobrenome.trim()}`.trim();

    try {
      // Substituímos o fetch pelo apiRegister (que usa o Axios configurado)
      await apiRegister({
        nome: nomeCompleto,
        email: registerData.email.trim(),
        senha: registerData.senha,
        telefone: "11999999999", // Placeholder (ajuste se tiver campo de telefone no form)
      });

      setRegisterMsg("Cadastro realizado com sucesso! Faça login.");
      
      // Limpa o formulário
      setRegisterData({
        nome: "",
        sobrenome: "",
        email: "",
        senha: "",
        confirmarSenha: "",
      });
      setSenhaConfere(true);

    } catch (error) {
      // Tratamento de erro do Axios
      const errorMsg = error.response?.data?.mensagem || "Erro ao realizar cadastro.";
      setRegisterMsg(errorMsg);
    }
  };

  return (
    <section>
      <main className={styles.loginMain}>
        <div className={styles.loginHeader}>
          <h1 className={styles.loginTitle}>Conecte-se aqui</h1>
        </div>

        <div className={styles.loginBody}>
          {/* Login Form */}
          <div className={styles.box_login}>
            <h4 className={styles.title_form}>Faça Login</h4>
            <form onSubmit={handleLogin} className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="login-email">Email</label>
                <input
                  type="email"
                  id="login-email"
                  placeholder="Digite aqui"
                  value={loginData.email}
                  onChange={(e) =>
                    setLoginData({ ...loginData, email: e.target.value })
                  }
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="login-senha">Senha</label>
                <div className={styles.passwordField}>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="login-senha"
                    placeholder="Digite aqui"
                    value={loginData.senha}
                    onChange={(e) =>
                      setLoginData({ ...loginData, senha: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.eyeButton}
                  >
                    {showPassword ? <FaEye /> : <FaEyeSlash />}
                  </button>
                </div>
              </div>

              {loginMsg && (
                <div
                  className={styles.msg_retorno}
                  data-msg={loginMsg.includes("sucesso") ? "success" : "error"}
                >
                  {loginMsg}
                </div>
              )}

              <div className={`${styles.field} ${styles.fieldsubmit}`}>
                <button className={styles.btn_submit} type="submit">
                  Entrar
                </button>
              </div>
            </form>
          </div>

          {/* Register Form */}
          <div className={styles.box_register}>
            <h4 className={styles.title_form}>Criar Conta</h4>
            <form onSubmit={handleRegister} className={styles.form}>
              <div className={`${styles.field} ${styles.field_half}`}>
                <label htmlFor="register-first-name">Nome</label>
                <input
                  type="text"
                  id="register-first-name"
                  placeholder="Digite aqui"
                  value={registerData.nome}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, nome: e.target.value })
                  }
                />
              </div>

              <div className={`${styles.field} ${styles.field_half}`}>
                <label htmlFor="register-last-name">Sobrenome</label>
                <input
                  type="text"
                  id="register-last-name"
                  placeholder="Digite aqui"
                  value={registerData.sobrenome}
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      sobrenome: e.target.value,
                    })
                  }
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="register-email">Email</label>
                <input
                  type="email"
                  id="register-email"
                  placeholder="Digite aqui"
                  value={registerData.email}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, email: e.target.value })
                  }
                />
              </div>

              <div className={`${styles.field} ${styles.field_half}`}>
                <label htmlFor="register-password">Senha</label>
                <div className={styles.passwordField}>
                  <input
                    type={showRegisterPassword ? "text" : "password"}
                    id="register-password"
                    placeholder="Digite aqui"
                    value={registerData.senha}
                    onChange={(e) => {
                      const novaSenha = e.target.value;
                      setRegisterData({ ...registerData, senha: novaSenha });
                      setSenhaConfere(novaSenha === registerData.confirmarSenha);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    className={styles.eyeButton}
                  >
                    {showRegisterPassword ? <FaEye /> : <FaEyeSlash />}
                  </button>
                </div>
              </div>

              <div className={`${styles.field} ${styles.field_half}`}>
                <label htmlFor="register-password-confirm">Confirmar Senha</label>
                <input
                  type={showRegisterPassword ? "text" : "password"}
                  id="register-password-confirm"
                  placeholder="Digite aqui"
                  value={registerData.confirmarSenha}
                  onChange={(e) => {
                    const confirmar = e.target.value;
                    setRegisterData({
                      ...registerData,
                      confirmarSenha: confirmar,
                    });
                    setSenhaConfere(registerData.senha === confirmar);
                  }}
                />
              </div>

              {!senhaConfere && (
                <p className={styles.msg_retorno} data-msg="error">
                  As senhas não conferem.
                </p>
              )}

              {registerMsg && (
                <div
                  className={styles.msg_retorno}
                  data-msg={
                    registerMsg.includes("sucesso") ? "success" : "error"
                  }
                >
                  {registerMsg}
                </div>
              )}

              <div className={`${styles.field} ${styles.fieldsubmit}`}>
                <button
                  className={styles.btn_submit}
                  type="submit"
                >
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </section>
  );
}