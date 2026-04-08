import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import {
    ErroTokenInvalido,
    ErroTokenExpirado,
    ErroSemToken,
} from "../errors/ErroAuth.js";

dotenv.config();

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET nao definido nas variaveis de ambiente");
}

export const authMiddleware = (req, res, next) => {
    try {
        const payload = getTokenPayload(req);
        if (!payload) throw new ErroSemToken();

        req.user = mapPayloadToUser(payload);
        next();
    } catch (error) {
        if (error.status) return error.enviarResposta(res);
        return res.status(500).json({ message: "Erro interno do servidor." });
    }
};

export const optionalAuthMiddleware = (req, _res, next) => {
    try {
        const payload = getTokenPayload(req);
        if (payload) {
            req.user = mapPayloadToUser(payload);
        }
    } catch (_error) {
        // Ignore invalid/expired token in optional-auth routes.
    }

    return next();
};

export const adminMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Usuario nao autenticado" });
    }

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

    if (req.user.id_role === 1) return next();
    if (userId === targetId) return next();

    return res.status(403).json({
        mensagem: "Acesso negado: voce nao pode alterar outro usuario.",
    });
}

function getTokenPayload(req) {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : authHeader;

    if (!token) return null;

    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        if (err.name === "TokenExpiredError") throw new ErroTokenExpirado();
        throw new ErroTokenInvalido();
    }
}

function mapPayloadToUser(payload) {
    return {
        id: payload.id,
        email: payload.email,
        id_role: payload.id_role,
    };
}
