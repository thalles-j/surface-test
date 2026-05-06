import { z } from 'zod';

export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Dados inválidos',
        erros: result.error.flatten().fieldErrors,
      });
    }
    req.body = result.data;
    next();
  };
}

// Schemas comuns
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(1, 'Senha é obrigatória'),
});

export const registerSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  senha: z.string().min(7, 'Senha deve ter no mínimo 7 caracteres'),
  telefone: z.string().min(1, 'Telefone é obrigatório'),
});

export const passwordResetSchema = z.object({
  email: z.string().email('Email inválido'),
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  novaSenha: z.string().min(7, 'Senha deve ter no mínimo 7 caracteres'),
});
