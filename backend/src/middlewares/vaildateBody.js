export function validateBody(req, res, next) {
    const body = req.body;

    const produtos = Array.isArray(body) ? body : (body ? [body] : []);

    if (produtos.length === 0) {
        return res.status(400).json({ error: "O body precisa conter pelo menos um produto" });
    }

    for (const produto of produtos) {
        if (!produto.id_categoria) {
            return res.status(400).json({ error: "O campo id_categoria é obrigatório em todos os produtos" });
        }
    }
    req.body = produtos;
    next();
}
