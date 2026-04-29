import prisma from "../database/prisma.js";
import bcrypt from "bcryptjs";
import ErroBase from "../errors/ErroBase.js";

/* ============================================
    GET /me → retorna perfil do usuário logado
============================================ */
export const getMeController = async (req, res, next) => {
  try {
    // Se ?light=true, retorna apenas dados básicos (usado pelo AuthContext)
    if (req.query.light === 'true') {
      const usuario = await prisma.usuarios.findUnique({
        where: { id_usuario: req.user.id },
        include: { enderecos: { orderBy: { id_endereco: 'asc' }, take: 1 } },
      });
      if (!usuario) throw new ErroBase("Usuário não encontrado", 404);
      const { id_usuario, nome, email, telefone, id_role, enderecos } = usuario;
      return res.json({
        usuario: {
          id_usuario,
          nome,
          email,
          telefone,
          role: id_role,
          endereco: enderecos?.[0] || null,
        },
      });
    }

    const usuario = await prisma.usuarios.findUnique({
      where: { id_usuario: req.user.id },
      include: {
        enderecos: true,
        pedidos: {
          orderBy: { data_pedido: 'desc' },
          take: 20,
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
                      take: 1,
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

function validateAddress(address) {
  if (!address || typeof address !== 'object') return null;
  const logradouro = String(address.logradouro || '').trim();
  const numero = String(address.numero || '').trim();
  const cidade = String(address.cidade || '').trim();
  const estado = String(address.estado || '').trim().toUpperCase();
  const cep = String(address.cep || '').replace(/\D/g, '');

  if (!logradouro || !numero || !cidade || !estado || cep.length !== 8) {
    return null;
  }

  return {
    logradouro,
    numero,
    complemento: String(address.complemento || '').trim() || null,
    bairro: String(address.bairro || '').trim() || null,
    cidade,
    estado,
    cep,
  };
}

export const updateMeController = async (req, res, next) => {
  try {
    const { nome, telefone, senhaAtual, novaSenha, enderecos } = req.body;

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

    // Processa endereços dentro de uma transação
    const updatedUser = await prisma.$transaction(async (tx) => {
      // 1. Atualiza dados básicos do usuário
      const user = await tx.usuarios.update({
        where: { id_usuario: req.user.id },
        data: dataToUpdate,
      });

      // 2. Se endereços foram enviados, substitui todos
      if (Array.isArray(enderecos)) {
        // Deleta endereços antigos
        await tx.enderecos.deleteMany({
          where: { id_usuario: req.user.id },
        });

        // Cria novos endereços válidos
        const validAddresses = enderecos
          .map(validateAddress)
          .filter(Boolean);

        if (validAddresses.length > 0) {
          await tx.enderecos.createMany({
            data: validAddresses.map((addr) => ({
              ...addr,
              id_usuario: req.user.id,
            })),
          });
        }
      }

      return user;
    });

    // Busca usuário atualizado com endereços para retornar
    const userWithAddresses = await prisma.usuarios.findUnique({
      where: { id_usuario: req.user.id },
      include: { enderecos: true },
    });

    delete userWithAddresses.senha;

    res.json({
      mensagem: "Perfil atualizado com sucesso",
      usuario: userWithAddresses,
    });
  } catch (error) {
    next(error);
  }
};

/* ============================================
    PUT /conta/senha → alterar senha
============================================ */
export const changePasswordController = async (req, res, next) => {
  try {
    const { current_password, new_password, senhaAtual, novaSenha } = req.body;

    const currentPwd = current_password || senhaAtual;
    const newPwd = new_password || novaSenha;

    if (!currentPwd) {
      return res.status(400).json({ mensagem: "Informe a senha atual." });
    }
    if (!newPwd || newPwd.length < 6) {
      return res.status(400).json({ mensagem: "A nova senha deve ter pelo menos 6 caracteres." });
    }

    const user = await prisma.usuarios.findUnique({
      where: { id_usuario: req.user.id },
      select: { senha: true },
    });

    if (!user) {
      return res.status(404).json({ mensagem: "Usuario nao encontrado." });
    }

    const isPasswordValid = await bcrypt.compare(currentPwd, user.senha);
    if (!isPasswordValid) {
      return res.status(401).json({ mensagem: "Senha atual incorreta." });
    }

    const hashed = await bcrypt.hash(newPwd, 10);
    await prisma.usuarios.update({
      where: { id_usuario: req.user.id },
      data: { senha: hashed },
    });

    res.json({ mensagem: "Senha atualizada com sucesso." });
  } catch (error) {
    next(error);
  }
};
