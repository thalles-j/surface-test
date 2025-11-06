import { ErroBase } from "../errors/index.js";

export const erroMiddleware = (erro, req, res, next) => {
    if (erro instanceof ErroBase) {
    return erro.enviarResposta(res);
    }

    console.error("Erro não tratado:", erro);
    res.status(500).json({ mensagem: "Erro interno do servidor." });
};
