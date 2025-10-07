import prisma from "../database/prisma.js";
import * as crudService from "../services/crudServices.js";
import * as crudController from "./crudController.js";

// Controllers específicos para Usuário (com hash na criação)
export const createUserController = crudController.createController(crudService, prisma.usuarios, ["senha"]);

export const listUserController = crudController.getAllController(
  crudService,
  prisma.usuarios,
  { role: true, enderecos: true, pedidos: true }
);

export const getUserController = crudController.getByIdController(
  crudService,
  prisma.usuarios,
  "id_usuario",
  { role: true, enderecos: true, pedidos: true }
);

export const updateUserController = crudController.updateController(
  crudService,
  prisma.usuarios,
  "id_usuario"
);

export const deleteUserController = crudController.deleteController(
  crudService,
  prisma.usuarios,
  "id_usuario"
);
