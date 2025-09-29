import bcrypt from "bcryptjs";

// Cria registro (opcionalmente aplica hash em campos sensíveis)
export const createEntity = async (model, data, hashFields = []) => {
  const dataToSave = { ...data };
  for (const field of hashFields) {
    if (dataToSave[field]) {
      const salt = await bcrypt.genSalt(10);
      dataToSave[field] = await bcrypt.hash(dataToSave[field], salt);
    }
  }
  return model.create({ data: dataToSave });
};

// Lista todos registros (suporta include do Prisma)
export const getAllEntities = async (model, include = {}) => {
  return model.findMany({ include });
};

// Pega registro por ID (suporta include)
export const getEntityById = async (model, idField, idValue, include = {}) => {
  return model.findUnique({
    where: { [idField]: idValue },
    include,
  });
};

// Atualiza registro por ID
export const updateEntity = async (model, idField, idValue, data) => {
  return model.update({
    where: { [idField]: idValue },
    data,
  });
};

// Deleta registro por ID
export const deleteEntity = async (model, idField, idValue) => {
  return model.delete({
    where: { [idField]: idValue },
  });
};
