import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import {
    ErroTokenInvalido,
    ErroTokenExpirado,
    ErroSemToken,
} from "../errors/ErroAuth.js";

dotenv.config();

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET não definido nas variáveis de ambiente");
}

export const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader?.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : authHeader;

        if (!token) throw new ErroSemToken();

        jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
            if (err) {
                if (err.name === "TokenExpiredError") throw new ErroTokenExpirado();
                throw new ErroTokenInvalido();
            }

            req.user = {
                id: payload.id,
                email: payload.email,
                id_role: payload.id_role,
            };

            next();
        });
    } catch (error) {
        if (error.status) return error.enviarResposta(res);
        return res.status(500).json({ message: "Erro interno do servidor." });
    }
};

export const adminMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
    }

    // ✅ apenas ID
    if (req.user.id_role === 1) {
        return next();
    }

    return res.status(403).json({
        message: "Acesso negado. Apenas administradores podem acessar.",
    });
};
export function isOwnerOrAdmin(req, res, next) {
    const userId = req.user.id;
    const targetId = Number(req.params.id);

    // ✅ admin é quem tem id_role === 1
    if (req.user.id_role === 1) return next();
    if (userId === targetId) return next();

    return res.status(403).json({
        mensagem: "Acesso negado: você não pode alterar outro usuário.",
    });
}
