import prisma from '../../database/prisma.js';
import { erro } from '../../helpers/apiResponse.js';
import { normalizeCouponData } from '../couponService.js';

export const getCategories = async (req, res) => {
  try {
    const categories = await prisma.categorias.findMany({ include: { _count: { select: { produtos: true } } } });
    return res.json(categories);
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = await prisma.categorias.create({ data: { nome_categoria: name, descricao: description || '' } });
    return res.status(201).json(category);
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const category = await prisma.categorias.update({ where: { id_categoria: parseInt(id) }, data: { nome_categoria: name, descricao: description } });
    return res.json(category);
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.categorias.delete({ where: { id_categoria: parseInt(id) } });
    return res.json({ mensagem: 'Categoria deletada' });
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const getCoupons = async (req, res) => {
  try {
    const coupons = await prisma.cupons.findMany();
    return res.json(coupons);
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const createCoupon = async (req, res) => {
  try {
    const { codigo, desconto, tipo, validade, limite_usos } = req.body;
    const couponData = normalizeCouponData({
      codigo,
      desconto,
      tipo,
      validade,
      limite_usos,
      ativo: req.body?.ativo,
    });

    const coupon = await prisma.cupons.create({
      data: couponData,
    });
    return res.status(201).json(coupon);
  } catch (error) {
    return erro(res, error.message, Number(error?.status) || 500);
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.cupons.delete({ where: { id_cupom: parseInt(id) } });
    return res.json({ mensagem: 'Cupom deletado' });
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const getCampaigns = async (req, res) => {
  try {
    const campaigns = await prisma.campanhas.findMany();
    return res.json(campaigns);
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const createCampaign = async (req, res) => {
  try {
    const { nome, data_inicio, data_fim, orcamento } = req.body;
    const campaign = await prisma.campanhas.create({ data: { nome, data_inicio: data_inicio ? new Date(data_inicio) : null, data_fim: data_fim ? new Date(data_fim) : null, orcamento: orcamento ? parseFloat(orcamento) : null } });
    return res.status(201).json(campaign);
  } catch (error) {
    return erro(res, error.message, 500);
  }
};
