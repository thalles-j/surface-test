import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config(); // garante que process.env.JWT_SECRET esteja carregado

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET não definido nas variáveis de ambiente");
}

/**
 * Middleware para verificar se o usuário está logado (token válido)
 */
export const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Acesso negado. Nenhum token fornecido.' });
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.status(401).json({ message: 'Token expirado. Faça login novamente.' });
                }
                return res.status(403).json({ message: 'Token inválido ou mal formado.' });
            }

            req.user = {
                id: user.id,
                email: user.email,
                role: user.role
            };

            next();
        });
    } catch (error) {
        console.error("Erro no authMiddleware:", error);
        res.status(500).json({ message: "Erro interno do servidor." });
    }
};

/**
 * Middleware para verificar se o usuário é admin
 * Deve ser usado após o authMiddleware
 */
export const adminMiddleware = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Acesso negado. Requer permissão de administrador.' });
    }
};
