import prisma from '../../database/prisma.js';
import { erro } from '../../helpers/apiResponse.js';
import { invalidateStoreStatusCache } from '../../middlewares/storeStatusMiddleware.js';

export const getStoreSettings = async (req, res) => {
  try {
    const settings = await prisma.configuracoes_loja.findFirst();
    return res.json(settings || {});
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const updateStoreSettings = async (req, res) => {
  try {
    const data = req.body;
    const existing = await prisma.configuracoes_loja.findFirst();
    const upserted = await prisma.configuracoes_loja.upsert({ where: { id_config: existing ? existing.id_config : 0 }, create: { ...data }, update: { ...data } });
    invalidateStoreStatusCache();
    return res.json({ mensagem: 'Configurações atualizadas', settings: upserted });
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const toggleStoreStatus = async (req, res) => {
  try {
    const { loja_ativa } = req.body;
    const existing = await prisma.configuracoes_loja.findFirst();
    if (!existing) {
      return erro(res, 'Configurações não encontradas', 404);
    }
    const updated = await prisma.configuracoes_loja.update({
      where: { id_config: existing.id_config },
      data: { loja_ativa: Boolean(loja_ativa) },
    });
    invalidateStoreStatusCache();
    return res.json({ mensagem: loja_ativa ? 'Loja ativada' : 'Loja desativada', loja_ativa: updated.loja_ativa });
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const getCustomizationSettings = async (req, res) => {
  try {
    const settings = await prisma.configuracoes_loja.findFirst();
    return res.json(settings || {});
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const updateCustomization = async (req, res) => {
  try {
    const data = req.body;
    const existing = await prisma.configuracoes_loja.findFirst();
    const upserted = await prisma.configuracoes_loja.upsert({ where: { id_config: existing ? existing.id_config : 0 }, create: { ...data }, update: { ...data } });
    return res.json({ mensagem: 'Customizações atualizadas', customization: upserted });
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const uploadBanner = async (req, res) => {
  try {
    const { bannerUrl } = req.body;
    const existing = await prisma.configuracoes_loja.findFirst();
    const upserted = await prisma.configuracoes_loja.upsert({ where: { id_config: existing ? existing.id_config : 0 }, create: { banner_url: bannerUrl }, update: { banner_url: bannerUrl } });
    return res.json({ bannerUrl: upserted.banner_url });
  } catch (error) {
    return erro(res, error.message, 500);
  }
};
