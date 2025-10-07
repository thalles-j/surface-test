export function validateBody(req, res, next) {
    const body = req.body;

    if (!body || !Array.isArray(body)) {
    return res.status(400).json({ error: "O body precisa ser um array de produtos" });
    }

    for (const produto of body) {
        if (!produto.id_categoria) {
            return res.status(400).json({ error: "O campo id_categoria é obrigatório em todos os produtos" });
        }
    }
    next();
    
}
