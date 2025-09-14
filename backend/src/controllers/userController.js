import * as usuariosService from "../services/userService.js";

export const cadastrarUsuario = async (req, res) => {
  try {
    const usuario = await usuariosService.criarUsuario(req.body);
    res.status(201).json(usuario);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const listarUsuarios = async (req, res) => {
  try {
    const usuarios = await usuariosService.listarUsuarios();
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
