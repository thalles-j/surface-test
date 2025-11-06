import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./style.module.css";

export default function Login() {
  const navigate = useNavigate();

  // Estados de login
  const [loginData, setLoginData] = useState({ email: "", senha: "" });
  const [loginMsg, setLoginMsg] = useState("");

  // Estados de cadastro
  const [registerData, setRegisterData] = useState({
    nome: "",
    sobrenome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
  });
  const [registerMsg, setRegisterMsg] = useState("");

  // Função para login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginMsg("");

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });

      const result = await response.json();

      if (!response.ok) {
        setLoginMsg(result.mensagem || "Erro ao fazer login");
        return;
      }

      // Salva token e redireciona
      localStorage.setItem("token", result.token);
      setLoginMsg("Login realizado com sucesso!");
      navigate("/home"); // muda conforme sua rota

    } catch (error) {
      console.error("Erro no login:", error);
      setLoginMsg("Erro de conexão com o servidor.");
    }
  };

  // Função para cadastro
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterMsg("");

    if (registerData.senha !== registerData.confirmarSenha) {
      setRegisterMsg("As senhas não conferem.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerData),
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

    } catch (error) {
      console.error("Erro no cadastro:", error);
      setRegisterMsg("Erro de conexão com o servidor.");
    }
  };

  return (
    <section>
      <main className={styles.loginMain}>
        <div className={styles.loginHeader}>
          <h1 className={styles.loginTitle}>Conecte-se aqui</h1>
        </div>

        <div className={styles.loginBody}>
          {/* BOX LOGIN */}
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
                <input
                  type="password"
                  id="login-senha"
                  placeholder="Digite aqui"
                  value={loginData.senha}
                  onChange={(e) =>
                    setLoginData({ ...loginData, senha: e.target.value })
                  }
                />
              </div>

              <div className={styles.field}>
                {loginMsg && (
                  <div
                    className={styles.msg_retorno}
                    data-msg={
                      loginMsg.includes("sucesso") ? "success" : "error"
                    }
                  >
                    {loginMsg}
                  </div>
                )}
              </div>

              <div className={`${styles.field} ${styles.fieldsubmit}`}>
                <button className={styles.btn_submit} type="submit">
                  Entrar
                </button>
              </div>
            </form>
          </div>

          {/* BOX REGISTRO */}
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
                    setRegisterData({
                      ...registerData,
                      email: e.target.value,
                    })
                  }
                />
              </div>

              <div className={`${styles.field} ${styles.field_half}`}>
                <label htmlFor="register-password">Senha</label>
                <input
                  type="password"
                  id="register-password"
                  placeholder="Digite aqui"
                  value={registerData.senha}
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      senha: e.target.value,
                    })
                  }
                />
              </div>

              <div className={`${styles.field} ${styles.field_half}`}>
                <label htmlFor="register-password-confirm">
                  Confirmar Senha
                </label>
                <input
                  type="password"
                  id="register-password-confirm"
                  placeholder="Digite aqui"
                  value={registerData.confirmarSenha}
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      confirmarSenha: e.target.value,
                    })
                  }
                />
              </div>

              <div className={styles.field}>
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
              </div>

              <div className={`${styles.field} ${styles.fieldsubmit}`}>
                <button className={styles.btn_submit} type="submit">
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