export const createEntity = async (model, data) => {
  return model.create({ data });
};

export const getAllEntities = async (model, options = {}) => {
  return model.findMany(options);
};

export const getEntityById = async (model, idField, idValue, options = {}) => {
  return model.findUnique({ where: { [idField]: idValue }, ...options });
};

export const updateEntity = async (model, idField, idValue, data) => {
  return model.update({ where: { [idField]: idValue }, data });
};

export const deleteEntity = async (model, idField, idValue) => {
  return model.delete({ where: { [idField]: idValue } });
};
