import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import styles from "./style.module.css";
import { useAuth } from "../../context/AuthContext";


export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();


  // Estados login
  const [loginData, setLoginData] = useState({ email: "", senha: "" });
  const [loginMsg, setLoginMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Estados registro (não alterado)
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

  // Funções de validação (não alterado)
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (senha) => senha.trim().length >= 7;

  // Função de login
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

    console.log("Role:", user.role);

    setLoginMsg("Login realizado com sucesso!");

    if (user.role === 1) {
      navigate("/admin");   // <-- admin
    } else {
      navigate("/conta"); // <-- usuário comum
    }

  } catch (error) {
    setLoginMsg(error?.message || "Email ou senha inválidos.");
  }
};

  // Função de registro (não alterado)
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterMsg("");

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
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nomeCompleto,
          email: registerData.email.trim(),
          senha: registerData.senha,
          telefone: "00000000000",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setRegisterMsg(result.mensagem || "Erro ao cadastrar");
        return;
      }

      setRegisterMsg("Cadastro realizado com sucesso!");
      setRegisterData({
        nome: "",
        sobrenome: "",
        email: "",
        senha: "",
        confirmarSenha: "",
      });
      setSenhaConfere(true);
    } catch (error) {
      setRegisterMsg("Erro de conexão com o servidor.");
    }
  };

  // Validação do formulário de registro (não alterado)
  const registroValido = registerData.nome.trim() &&
    registerData.sobrenome.trim() &&
    validateEmail(registerData.email) &&
    validatePassword(registerData.senha) &&
    senhaConfere;

  return (
    <section>
      <main className={styles.loginMain}>
        <div className={styles.loginHeader}>
          <h1 className={styles.loginTitle}>Conecte-se aqui</h1>
        </div>

        <div className={styles.loginBody}>
          {/* Login */}
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

          {/* Registro */}
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
