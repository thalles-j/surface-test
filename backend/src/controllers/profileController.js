import prisma from "../database/prisma.js";
import bcrypt from "bcryptjs";
import ErroBase from "../errors/ErroBase.js";

/* ============================================
    GET /me → retorna perfil do usuário logado
============================================ */
export const getMeController = async (req, res, next) => {
    try {
        const usuario = await prisma.usuarios.findUnique({
            where: { id_usuario: req.user.id },
            include: {
                enderecos: true,
                pedidos: true,
                role: true, // pega id_role e nome se quiser
            },
        });

        if (!usuario) throw new ErroBase("Usuário não encontrado", 404);

        res.json({
            id: usuario.id_usuario,
            nome: usuario.nome,
            email: usuario.email,
            telefone: usuario.telefone,
            id_role: usuario.id_role,
            enderecos: usuario.enderecos,
            pedidos: usuario.pedidos,
        });
    } catch (error) {
        next(error);
    }
};

/* ============================================
    PUT /me → atualizar dados do próprio usuário
============================================ */
const validateAndCleanPhone = (telefone) => {
    const cleanDigits = telefone.replace(/\D/g, "");

    if (cleanDigits.length === 11) {
        return cleanDigits;
    }

    if (cleanDigits.length === 10) {
        return 'ERR_8_DIGITS';
    }
    
    return null;
};

export const updateMeController = async (req, res, next) => {
    try {
        const { nome, telefone, senhaAtual, novaSenha } = req.body;

        const dataToUpdate = {};

        if (nome) dataToUpdate.nome = nome;
        
        if (telefone) {
            const cleanPhone = validateAndCleanPhone(telefone);
            
            if (!cleanPhone) {
                return res.status(400).json({ mensagem: "Telefone inválido ou incompleto." });
            }

            if (cleanPhone === 'ERR_8_DIGITS') {
                return res.status(400).json({ mensagem: "Aceitamos apenas números de telefone celular (9 dígitos)." });
            }

            dataToUpdate.telefone = cleanPhone;
        }

        if (novaSenha) {
            if (!senhaAtual) {
                return res.status(400).json({ mensagem: "Informe a senha atual para alterar a senha." });
            }

            const user = await prisma.usuarios.findUnique({
                where: { id_usuario: req.user.id },
                select: { senha: true }
            });

            if (!user) {
                return res.status(404).json({ mensagem: "Usuário não encontrado." });
            }

            const isPasswordValid = await bcrypt.compare(senhaAtual, user.senha);
            
            if (!isPasswordValid) {
                return res.status(401).json({ mensagem: "Senha atual incorreta." });
            }

            const hashed = await bcrypt.hash(novaSenha, 10);
            dataToUpdate.senha = hashed;
        }

        const updatedUser = await prisma.usuarios.update({
            where: { id_usuario: req.user.id },
            data: dataToUpdate,
        });

        delete updatedUser.senha; 

        res.json({
            mensagem: "Perfil atualizado com sucesso",
            usuario: updatedUser,
        });
    } catch (error) {
        next(error);
    }
};