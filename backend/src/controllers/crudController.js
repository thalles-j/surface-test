// controllers/crudController.js
export const createController = (service, model, hashFields) => async (req, res) => {
    try {
        const entity = await service.createEntity(model, req.body, hashFields);
        res.status(201).json(entity);
    } catch (err) {
        res.status(400).json({ error: err });
    }
};

export const getAllController = (service, model, include) => async (req, res) => {
    try {
        const entities = await service.getAllEntities(model, include);
        res.json(entities);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getByIdController = (service, model, idField, include) => async (req, res) => {
    try {
        const entity = await service.getEntityById(model, idField, Number(req.params.id), include);
        if (!entity) return res.status(404).json({ error: "Not found" });
        res.json(entity);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateController = (service, model, idField) => async (req, res) => {
    try {
        const entity = await service.updateEntity(model, idField, Number(req.params.id), req.body);
        res.json(entity);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteController = (service, model, idField) => async (req, res) => {
    try {
        await service.deleteEntity(model, idField, Number(req.params.id));
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
