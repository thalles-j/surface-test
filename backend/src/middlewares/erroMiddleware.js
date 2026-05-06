import { ErroBase } from "../errors/index.js";

export const erroMiddleware = (erro, req, res, next) => {
    if (erro instanceof ErroBase) {
      return erro.enviarResposta(res);
    }

    // Trata erros do body-parser / express (JSON malformado, etc.)
    const status = erro.statusCode || erro.status || 500;
    if (status !== 500) {
      return res.status(status).json({ mensagem: erro.message || "Requisição inválida." });
    }

    console.error("Erro não tratado:", erro);
    res.status(500).json({ mensagem: "Erro interno do servidor." });
};
