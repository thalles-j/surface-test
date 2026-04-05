import prisma from '../database/prisma.js';

let cachedStatus = null;
let cacheTime = 0;
const CACHE_TTL = 30_000; // 30 seconds

export const checkStoreActive = async (req, res, next) => {
  try {
    const now = Date.now();
    if (cachedStatus === null || now - cacheTime > CACHE_TTL) {
      const config = await prisma.configuracoes_loja.findFirst({ select: { loja_ativa: true } });
      cachedStatus = config ? config.loja_ativa : true;
      cacheTime = now;
    }

    if (!cachedStatus) {
      return res.status(503).json({
        erro: 'Loja em manutenção',
        mensagem: 'A loja está temporariamente desativada. Tente novamente mais tarde.',
        manutencao: true,
      });
    }

    next();
  } catch {
    next();
  }
};

export const invalidateStoreStatusCache = () => {
  cachedStatus = null;
  cacheTime = 0;
};
