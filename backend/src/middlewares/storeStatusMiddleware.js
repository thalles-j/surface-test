import prisma from '../database/prisma.js';

let cachedConfig = null;
let cacheTime = 0;
const CACHE_TTL = 30_000; // 30 seconds

async function getConfig() {
  const now = Date.now();
  if (cachedConfig === null || now - cacheTime > CACHE_TTL) {
    cachedConfig = await prisma.configuracoes_loja.findFirst({
      select: { loja_ativa: true, data_abertura: true, early_access_ativo: true },
    });
    cacheTime = now;
  }
  return cachedConfig;
}

export const checkStoreActive = async (req, res, next) => {
  try {
    const config = await getConfig();
    const isActive = config ? config.loja_ativa : true;

    if (!isActive) {
      // Check early access via token header
      if (config?.early_access_ativo) {
        const earlyEmail = req.headers['x-early-access-email'];
        if (earlyEmail) {
          const record = await prisma.early_access_emails.findUnique({ where: { email: earlyEmail } });
          if (record?.liberado) {
            return next(); // early access granted
          }
        }
      }

      return res.status(503).json({
        erro: 'Loja em manutenção',
        mensagem: 'A loja está temporariamente desativada. Tente novamente mais tarde.',
        manutencao: true,
        data_abertura: config?.data_abertura || null,
        early_access_ativo: config?.early_access_ativo || false,
      });
    }

    next();
  } catch {
    next();
  }
};

export const invalidateStoreStatusCache = () => {
  cachedConfig = null;
  cacheTime = 0;
};
