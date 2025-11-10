import { loginService, registerService } from "../services/authService.js";

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
