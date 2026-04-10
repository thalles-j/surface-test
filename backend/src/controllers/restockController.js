import prisma from '../database/prisma.js';
import { registerRestockInterest, listRestockInterests } from '../services/restockService.js';

export async function notifyMeController(req, res) {
  try {
    const idProduto = Number(req.body?.id_produto);
    const tamanho = req.body?.tamanho ? String(req.body.tamanho).trim() : null;
    const emailBody = req.body?.email ? String(req.body.email).trim().toLowerCase() : null;
    const idUsuario = req.user?.id ? Number(req.user.id) : null;

    if (!idProduto) {
      return res.status(400).json({ message: 'id_produto é obrigatório.' });
    }

    const produto = await prisma.produtos.findUnique({
      where: { id_produto: idProduto },
      select: { id_produto: true, nome_produto: true },
    });

    if (!produto) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }

    if (!idUsuario && !emailBody) {
      return res.status(400).json({ message: 'Informe email ou faça login para registrar interesse.' });
    }

    const result = await registerRestockInterest({
      idProduto,
      tamanho,
      idUsuario,
      email: emailBody,
    });

    return res.status(result.created ? 201 : 200).json({
      message: result.created
        ? 'Interesse registrado com sucesso.'
        : 'Interesse já estava registrado para este produto/variação.',
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Erro ao registrar interesse.' });
  }
}

export async function listRestockInterestsController(req, res) {
  try {
    const data = await listRestockInterests();
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Erro ao listar interesses.' });
  }
}

