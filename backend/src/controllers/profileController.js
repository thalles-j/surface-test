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
        pedidos: {
          include: {
            pedidoProdutos: {
              include: {
                produto: {
                  select: {
                    id_produto: true,
                    nome_produto: true,
                    preco: true,
                    fotos: {
                      select: { url: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!usuario) throw new ErroBase("Usuário não encontrado", 404);


    const resposta = {
      id_usuario: usuario.id_usuario,
      nome: usuario.nome,
      email: usuario.email,
      telefone: usuario.telefone,
      
      role: usuario.id_role, 
      
      enderecos: usuario.enderecos,
      pedidos: usuario.pedidos.map((pedido) => ({
        id_pedido: pedido.id_pedido,
        status: pedido.status,
        total: pedido.total,
        data_pedido: pedido.data_pedido,
        pedidoProdutos: pedido.pedidoProdutos.map((pp) => ({
          produto: {
            id_produto: pp.produto.id_produto,
            nome_produto: pp.produto.nome_produto,
            preco: pp.produto.preco,
            imagem: pp.produto.fotos.length > 0 ? pp.produto.fotos[0].url : null,
          },
          quantidade: pp.quantidade,
          sku_variacao: pp.sku_variacao || null,
          tamanho: pp.sku_variacao
            ? String(pp.sku_variacao).split("-").slice(-1)[0]
            : null,
        })),
      })),
    };

    res.json({ usuario: resposta });
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
    return "ERR_8_DIGITS";
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
        return res
          .status(400)
          .json({ mensagem: "Telefone inválido ou incompleto." });
      }

      if (cleanPhone === "ERR_8_DIGITS") {
        return res
          .status(400)
          .json({ mensagem: "Aceitamos apenas números de celular (9 dígitos)." });
      }

      dataToUpdate.telefone = cleanPhone;
    }

    if (novaSenha) {
      if (!senhaAtual) {
        return res
          .status(400)
          .json({ mensagem: "Informe a senha atual para alterar a senha." });
      }

      const user = await prisma.usuarios.findUnique({
        where: { id_usuario: req.user.id },
        select: { senha: true },
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
