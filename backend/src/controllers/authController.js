import {
  loginService,
  registerService,
  requestPasswordResetService,
  resetPasswordService,
  getFirstAccessStatusService,
} from "../services/authService.js";

export const loginController = async (req, res, next) => {
  try {
    const { email, senha } = req.body;
    const { token, usuario } = await loginService(email, senha);

    res.status(200).json({
      mensagem: "Login realizado com sucesso",
      token,
      usuario: {
        id: usuario.id_usuario,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.id_role,
      },
    });

  } catch (error) {
    next(error);
  }
};

export const registerController = async (req, res, next) => {
  try {
    const { usuario, token } = await registerService(req.body);

    res.status(201).json({
      mensagem: "Usuário registrado com sucesso",
      token,
      usuario: {
        id: usuario.id_usuario,
        nome: usuario.nome,
        email: usuario.email,
      },
    });

  } catch (error) {
    next(error);
  }
};

export const requestPasswordResetController = async (req, res, next) => {
  try {
    const { email } = req.body;
    await requestPasswordResetService(email);
    res.status(200).json({
      mensagem: "Se o email existir, enviaremos as instrucoes para redefinicao.",
    });
  } catch (error) {
    next(error);
  }
};

export const resetPasswordController = async (req, res, next) => {
  try {
    const { token, novaSenha } = req.body;
    await resetPasswordService(token, novaSenha);
    res.status(200).json({ mensagem: "Senha atualizada com sucesso." });
  } catch (error) {
    next(error);
  }
};

export const firstAccessStatusController = async (req, res, next) => {
  try {
    const { email } = req.body;
    const data = await getFirstAccessStatusService(email);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};


