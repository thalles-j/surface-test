import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { ErroTokenInvalido, ErroTokenExpirado, ErroSemToken } from "../errors/ErroAuth.js";

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

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                if (err.name === "TokenExpiredError") throw new ErroTokenExpirado();
                throw new ErroTokenInvalido();
            }

            req.user = {
                id: user.id,
                email: user.email,
                role: user.id_role,
            };

            next();
        });
    } catch (error) {
        if (error.status) error.enviarResposta(res);
        else res.status(500).json({ message: "Erro interno do servidor." });
    }
};

export const adminMiddleware = (req, res, next) => {
    if (!req.user || !req.user.role) {
        return res.status(401).json({ message: "Usuário não autenticado" });
    }

    if (req.user.role.toLowerCase() === "admin") {
        return next();
    }

    return res.status(403).json({ message: "Acesso negado. Apenas administradores podem acessar." });
};

export const isOwnerOrAdmin = (req, res, next) => {
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado. Requer ser proprietário ou administrador.' });
    }
    next();
};