import * as userService from "../services/userService.js";

export const userRegistration = async (req, res) => {
  try {
    const usuario = await userService.createUser(req.body);
    res.status(201).json(usuario);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const userList = async (req, res) => {
  try {
    const usuarios = await userService.listUser();
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
