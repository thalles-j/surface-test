import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import styles from "./style.module.css";
import useAuth from "../../hooks/useAuth";
import {
  apiRegister,
  apiForgotPassword,
  apiResetPassword,
  apiFirstAccessStatus,
} from "../../services/auth";

const MODES = {
  LOGIN: "login",
  FORGOT: "forgot",
  FIRST_ACCESS: "first-access",
  RESET: "reset",
};

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialMode = useMemo(() => {
    const modeParam = searchParams.get("modo");
    const token = searchParams.get("token");
    if (modeParam === "reset" && token) return MODES.RESET;
    if (modeParam === "forgot") return MODES.FORGOT;
    return MODES.LOGIN;
  }, [searchParams]);

  const resetToken = searchParams.get("token") || "";
  const emailFromQuery = searchParams.get("email") || "";

  const [mode, setMode] = useState(initialMode);

  const [loginData, setLoginData] = useState({ email: "", senha: "" });
  const [loginMsg, setLoginMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [registerData, setRegisterData] = useState({
    nome: "",
    sobrenome: "",
    email: "",
    telefone: "",
    senha: "",
    confirmarSenha: "",
  });
  const [registerMsg, setRegisterMsg] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [senhaConfere, setSenhaConfere] = useState(true);

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");

  const [resetData, setResetData] = useState({ novaSenha: "", confirmarSenha: "" });
  const [resetMsg, setResetMsg] = useState("");

  const [firstAccessStatus, setFirstAccessStatus] = useState(null);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (!emailFromQuery) return;
    setRegisterData((prev) => ({ ...prev, email: emailFromQuery }));
    setLoginData((prev) => ({ ...prev, email: emailFromQuery }));
    setForgotEmail(emailFromQuery);
  }, [emailFromQuery]);

  const setPageMode = (nextMode) => {
    setMode(nextMode);
    setLoginMsg("");
    setRegisterMsg("");
    setForgotMsg("");
    setResetMsg("");
    setFirstAccessStatus(null);

    const nextParams = new URLSearchParams(searchParams);

    if (nextMode === MODES.LOGIN) {
      nextParams.delete("modo");
      nextParams.delete("token");
    } else if (nextMode === MODES.RESET) {
      nextParams.set("modo", "reset");
      if (resetToken) nextParams.set("token", resetToken);
    } else {
      nextParams.set("modo", nextMode);
      if (nextMode !== MODES.RESET) nextParams.delete("token");
    }

    setSearchParams(nextParams, { replace: true });
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (senha) => senha.trim().length >= 7;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginMsg("");

    if (!validateEmail(loginData.email)) {
      setLoginMsg("Email invalido.");
      return;
    }

    if (!validatePassword(loginData.senha)) {
      setLoginMsg("Senha deve ter no minimo 7 caracteres.");
      return;
    }

    try {
      const user = await login({
        email: loginData.email.trim().toLowerCase(),
        senha: loginData.senha,
      });

      const roleId = Number(user.role);

      if (roleId === 1) {
        navigate("/admin");
      } else {
        navigate("/account");
      }
    } catch (error) {
      const msg = error.response?.data?.mensagem || error.message || "Email ou senha invalidos.";
      setLoginMsg(msg);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterMsg("");

    if (!registerData.nome.trim()) {
      setRegisterMsg("Nome obrigatorio.");
      return;
    }
    if (!registerData.sobrenome.trim()) {
      setRegisterMsg("Sobrenome obrigatorio.");
      return;
    }
    if (!validateEmail(registerData.email)) {
      setRegisterMsg("Email invalido.");
      return;
    }
    if (!registerData.telefone || registerData.telefone.replace(/\D/g, "").length < 10) {
      setRegisterMsg("Telefone invalido.");
      return;
    }
    if (!validatePassword(registerData.senha)) {
      setRegisterMsg("Senha deve ter no minimo 7 caracteres.");
      return;
    }
    if (!senhaConfere) {
      setRegisterMsg("As senhas nao conferem.");
      return;
    }

    const nomeCompleto = `${registerData.nome.trim()} ${registerData.sobrenome.trim()}`.trim();

    try {
      await apiRegister({
        nome: nomeCompleto,
        email: registerData.email.trim().toLowerCase(),
        senha: registerData.senha,
        telefone: registerData.telefone,
      });

      const normalizedEmail = registerData.email.trim().toLowerCase();
      setLoginData((prev) => ({ ...prev, email: normalizedEmail }));
      setForgotEmail(normalizedEmail);
      setPageMode(MODES.LOGIN);
      setLoginMsg(
        mode === MODES.FIRST_ACCESS
          ? "Conta criada com sucesso. Entre para vincular seus pedidos automaticamente."
          : "Conta criada com sucesso. Agora faca login."
      );
    } catch (error) {
      const errorMsg = error.response?.data?.mensagem || "Erro ao realizar cadastro.";
      setRegisterMsg(errorMsg);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotMsg("");

    if (!validateEmail(forgotEmail)) {
      setForgotMsg("Email invalido.");
      return;
    }

    try {
      await apiForgotPassword({ email: forgotEmail.trim().toLowerCase() });
      setForgotMsg("Se o email existir, voce recebera as instrucoes de redefinicao.");
    } catch (error) {
      setForgotMsg(error.response?.data?.mensagem || "Nao foi possivel solicitar recuperacao.");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetMsg("");

    if (!resetToken) {
      setResetMsg("Token de recuperacao ausente.");
      return;
    }

    if (!validatePassword(resetData.novaSenha)) {
      setResetMsg("A nova senha deve ter no minimo 7 caracteres.");
      return;
    }

    if (resetData.novaSenha !== resetData.confirmarSenha) {
      setResetMsg("As senhas nao conferem.");
      return;
    }

    try {
      await apiResetPassword({ token: resetToken, novaSenha: resetData.novaSenha });
      setResetMsg("Senha redefinida com sucesso. Voce ja pode entrar.");
      setMode(MODES.LOGIN);
    } catch (error) {
      setResetMsg(error.response?.data?.mensagem || "Nao foi possivel redefinir a senha.");
    }
  };

  const handleCheckFirstAccess = async () => {
    setRegisterMsg("");
    setFirstAccessStatus(null);

    if (!validateEmail(registerData.email)) {
      setRegisterMsg("Informe um email valido para primeiro acesso.");
      return;
    }

    try {
      const normalizedEmail = registerData.email.trim().toLowerCase();
      const status = await apiFirstAccessStatus({ email: normalizedEmail });
      setFirstAccessStatus(status);
      setLoginData((prev) => ({ ...prev, email: normalizedEmail }));
      setForgotEmail(normalizedEmail);

      if (status.hasConta) {
        setRegisterMsg(
          status.temPedidosPorEmail
            ? "Ja existe conta para este email. Faca login para vincular os pedidos pendentes ou recupere sua senha."
            : "Ja existe conta para este email. Use o login normal ou recupere sua senha."
        );
      } else if (status.temPedidosPorEmail) {
        setRegisterMsg("Pedido encontrado. Finalize seu primeiro acesso criando a conta.");
      } else {
        setRegisterMsg("Nenhum pedido encontrado para este email. Este fluxo e apenas para primeiro acesso apos compra.");
      }
    } catch (error) {
      setRegisterMsg(error.response?.data?.mensagem || "Nao foi possivel verificar primeiro acesso.");
    }
  };

  const canSubmitFirstAccessRegister =
    mode !== MODES.FIRST_ACCESS ||
    (firstAccessStatus && !firstAccessStatus.hasConta && firstAccessStatus.temPedidosPorEmail);

  const renderModeTabs = () => (
    <div className={styles.abasModo}>
      <button
        type="button"
        className={`${styles.abaModo} ${mode === MODES.LOGIN ? styles.abaModoAtiva : ""}`}
        onClick={() => setPageMode(MODES.LOGIN)}
      >
        Login
      </button>
      <button
        type="button"
        className={`${styles.abaModo} ${mode === MODES.FORGOT ? styles.abaModoAtiva : ""}`}
        onClick={() => setPageMode(MODES.FORGOT)}
      >
        Recuperar senha
      </button>
    </div>
  );

  return (
    <section>
      <main className={styles.paginaEntrar}>
        <div className={styles.cabecalho}>
          <h1 className={styles.titulo}>Conecte-se aqui</h1>
        </div>

        <div className={styles.corpo}>
          <div className={styles.caixaLogin}>
            <h4 className={styles.tituloFormulario}>Entrar na conta</h4>

            {mode === MODES.LOGIN && (
              <form onSubmit={handleLogin} className={styles.formulario}>
                <div className={styles.campo}>
                  <label htmlFor="login-email">Email</label>
                  <input
                    type="email"
                    id="login-email"
                    placeholder="Digite aqui"
                    value={loginData.email || ""}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  />
                </div>

                <div className={styles.campo}>
                  <label htmlFor="login-senha">Senha</label>
                  <div className={styles.campoSenha}>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="login-senha"
                      placeholder="Digite aqui"
                      value={loginData.senha || ""}
                      onChange={(e) => setLoginData({ ...loginData, senha: e.target.value })}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className={styles.botaoOlho}>
                      {showPassword ? <FaEye /> : <FaEyeSlash />}
                    </button>
                  </div>
                </div>

                {loginMsg && <div className={styles.mensagemRetorno}>{loginMsg}</div>}

                <div className={styles.acoesInline}>
                  <button type="button" className={styles.acaoTexto} onClick={() => setPageMode(MODES.FORGOT)}>
                    Esqueci minha senha
                  </button>
                </div>

                <div className={`${styles.campo} ${styles.campoEnviar}`}>
                  <button className={styles.botaoEnviar} type="submit">Entrar</button>
                </div>
              </form>
            )}

            {mode === MODES.FORGOT && (
              <form onSubmit={handleForgotPassword} className={styles.formulario}>
                <div className={styles.campo}>
                  <label htmlFor="forgot-email">Email da conta</label>
                  <input className={styles.campoClick}
                    type="email"
                    id="forgot-email"
                    placeholder="Digite aqui"
                    value={forgotEmail || ""}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                    <button type="button" className={`${styles.acaoTexto} ${mode === MODES.LOGIN ? styles.abaModoAtiva : ""}`} onClick={() => setPageMode(MODES.LOGIN)}>
                    Voltar para o login
                  </button>
                </div>

                {forgotMsg && <div className={styles.mensagemRetorno}>{forgotMsg}</div>}

               

                <div className={`${styles.campo} ${styles.campoEnviar}`}>
                  <button className={styles.botaoEnviar} type="submit">Enviar link</button>
                </div>

              </form>
            )}

            {mode === MODES.RESET && (
              <form onSubmit={handleResetPassword} className={styles.formulario}>
                <div className={styles.campo}>
                  <label htmlFor="reset-password">Nova senha</label>
                  <input
                    type="password"
                    id="reset-password"
                    placeholder="Digite aqui"
                    value={resetData.novaSenha || ""}
                    onChange={(e) => setResetData((prev) => ({ ...prev, novaSenha: e.target.value }))}
                  />
                </div>

                <div className={styles.campo}>
                  <label htmlFor="reset-password-confirm">Confirmar nova senha</label>
                  <input
                    type="password"
                    id="reset-password-confirm"
                    placeholder="Digite aqui"
                    value={resetData.confirmarSenha || ""}
                    onChange={(e) => setResetData((prev) => ({ ...prev, confirmarSenha: e.target.value }))}
                  />
                </div>

                {resetMsg && <div className={styles.mensagemRetorno}>{resetMsg}</div>}

                <div className={`${styles.campo} ${styles.campoEnviar}`}>
                  <button className={styles.botaoEnviar} type="submit">Redefinir senha</button>
                </div>
              </form>
            )}
          </div>

          <div className={styles.caixaCadastro}>
            <h4 className={styles.tituloFormulario}>
              {mode === MODES.FIRST_ACCESS ? "Primeiro acesso apos compra" : "Criar Conta"}
            </h4>

            <form onSubmit={handleRegister} className={styles.formulario}>
              <div className={styles.campo}>
                <label htmlFor="register-email">Email</label>
                <input
                  type="email"
                  id="register-email"
                  placeholder="Digite aqui"
                  value={registerData.email || ""}
                  onChange={(e) => {
                    setRegisterData({ ...registerData, email: e.target.value });
                    if (mode === MODES.FIRST_ACCESS) {
                      setFirstAccessStatus(null);
                    }
                  }}
                />
              </div>

              {mode === MODES.FIRST_ACCESS && (
                <>
                  <div className={styles.caixaInfo}>
                    Primeiro acesso e exclusivo para quem comprou antes de criar conta. Verifique o email usado no pedido.
                  </div>

                  <div className={`${styles.campo} ${styles.campoEnviar}`}>
                    <button className={styles.botaoEnviar} type="button" onClick={handleCheckFirstAccess}>
                      Verificar email do pedido
                    </button>
                  </div>
                </>
              )}

              {registerMsg && <div className={styles.mensagemRetorno}>{registerMsg}</div>}

              {mode === MODES.FIRST_ACCESS && firstAccessStatus?.hasConta && (
                <div className={styles.grupoAcaoModo}>
                  <button className={styles.botaoEnviar} type="button" onClick={() => setPageMode(MODES.LOGIN)}>
                    Ir para login
                  </button>
                  <button className={styles.botaoEnviar} type="button" onClick={() => setPageMode(MODES.FORGOT)}>
                    Recuperar senha
                  </button>
                </div>
              )}

              {(mode !== MODES.FIRST_ACCESS || canSubmitFirstAccessRegister) && (
                <>
                  <div className={`${styles.campo} ${styles.campoMetade}`}>
                    <label htmlFor="register-first-name">Nome</label>
                    <input
                      type="text"
                      id="register-first-name"
                      placeholder="Digite aqui"
                      value={registerData.nome || ""}
                      onChange={(e) => setRegisterData({ ...registerData, nome: e.target.value })}
                    />
                  </div>

                  <div className={`${styles.campo} ${styles.campoMetade}`}>
                    <label htmlFor="register-last-name">Sobrenome</label>
                    <input
                      type="text"
                      id="register-last-name"
                      placeholder="Digite aqui"
                      value={registerData.sobrenome || ""}
                      onChange={(e) => setRegisterData({ ...registerData, sobrenome: e.target.value })}
                    />
                  </div>

                  <div className={styles.campo}>
                    <label htmlFor="register-phone">Telefone</label>
                    <input
                      type="tel"
                      id="register-phone"
                      placeholder="Digite aqui"
                      value={registerData.telefone || ""}
                      onChange={(e) => setRegisterData({ ...registerData, telefone: e.target.value })}
                    />
                  </div>

                  <div className={`${styles.campo} ${styles.campoMetade}`}>
                    <label htmlFor="register-password">Senha</label>
                    <div className={styles.campoSenha}>
                      <input
                        type={showRegisterPassword ? "text" : "password"}
                        id="register-password"
                        placeholder="Digite aqui"
                        value={registerData.senha || ""}
                        onChange={(e) => {
                          const novaSenha = e.target.value;
                          setRegisterData({ ...registerData, senha: novaSenha });
                          setSenhaConfere(novaSenha === registerData.confirmarSenha);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className={styles.botaoOlho}
                      >
                        {showRegisterPassword ? <FaEye /> : <FaEyeSlash />}
                      </button>
                    </div>
                  </div>

                  <div className={`${styles.campo} ${styles.campoMetade}`}>
                    <label htmlFor="register-password-confirm">Confirmar Senha</label>
                    <input
                      type={showRegisterPassword ? "text" : "password"}
                      id="register-password-confirm"
                      placeholder="Digite aqui"
                      value={registerData.confirmarSenha || ""}
                      onChange={(e) => {
                        const confirmar = e.target.value;
                        setRegisterData({ ...registerData, confirmarSenha: confirmar });
                        setSenhaConfere(registerData.senha === confirmar);
                      }}
                    />
                  </div>

                  {!senhaConfere && <p className={styles.mensagemRetorno}>As senhas nao conferem.</p>}

                  {mode === MODES.FIRST_ACCESS && firstAccessStatus && (
                    <div className={styles.caixaInfo}>
                      Pedidos desse email serao vinculados automaticamente quando a conta for criada e nos proximos logins.
                    </div>
                  )}

                  <div className={`${styles.campo} ${styles.campoEnviar}`}>
                    <button className={styles.botaoEnviar} type="submit">
                      {mode === MODES.FIRST_ACCESS ? "Concluir primeiro acesso" : "Cadastrar"}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      </main>
    </section>
  );
}
