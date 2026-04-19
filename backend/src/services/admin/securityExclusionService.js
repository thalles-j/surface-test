import prisma from '../../database/prisma.js';
import { erro } from '../../helpers/apiResponse.js';

const HASH_ALGORITHMS = {
  md5: 32,
  sha1: 40,
  sha256: 64,
  sha512: 128,
};

const HASH_ONLY_REGEX = /^[a-fA-F0-9]+$/;
const TRUST_PRIORITY = {
  hash: 2,
  path: 1,
};

function normalizeTipo(tipo) {
  return String(tipo || '').trim().toLowerCase();
}

function normalizeAlgorithm(algorithm) {
  return String(algorithm || '').trim().toLowerCase();
}

function normalizeValor(tipo, valor) {
  const raw = String(valor || '').trim();
  return tipo === 'hash' ? raw.toUpperCase() : raw;
}

function isAbsolutePath(pathValue) {
  const value = String(pathValue || '').trim();
  if (!value || value.includes('..')) return false;

  const isWindowsDrivePath = /^[a-zA-Z]:\\/.test(value);
  const isUncPath = /^\\\\[^\\]+\\[^\\]+/.test(value);
  const isUnixAbsolute = value.startsWith('/');

  return isWindowsDrivePath || isUncPath || isUnixAbsolute;
}

function validateInput(payload = {}) {
  const tipo = normalizeTipo(payload.tipo);
  const valor = normalizeValor(tipo, payload.valor);
  const descricao = String(payload.descricao || '').trim() || null;
  const algoritmo_hash = tipo === 'hash' ? normalizeAlgorithm(payload.algoritmo_hash) : null;
  const escopo_ml = tipo === 'path' ? Boolean(payload.escopo_ml) : false;

  if (tipo !== 'hash' && tipo !== 'path') {
    throw new Error('Tipo de exclusao invalido. Use "hash" ou "path".');
  }

  if (!valor) {
    throw new Error('Valor da exclusao e obrigatorio.');
  }

  if (tipo === 'hash') {
    if (!algoritmo_hash || !Object.prototype.hasOwnProperty.call(HASH_ALGORITHMS, algoritmo_hash)) {
      throw new Error('Algoritmo do hash obrigatorio. Use: md5, sha1, sha256 ou sha512.');
    }

    if (!HASH_ONLY_REGEX.test(valor)) {
      throw new Error('Hash invalido. Use apenas caracteres hexadecimais.');
    }

    if (valor.length !== HASH_ALGORITHMS[algoritmo_hash]) {
      throw new Error(`Hash invalido para ${algoritmo_hash}. Tamanho esperado: ${HASH_ALGORITHMS[algoritmo_hash]} caracteres.`);
    }
  }

  if (tipo === 'path') {
    if (!descricao) {
      throw new Error('Justificativa obrigatoria para exclusao do tipo PATH.');
    }

    if (!isAbsolutePath(valor)) {
      throw new Error('Path invalido. Informe um caminho absoluto valido.');
    }
  }

  return { tipo, valor, descricao, algoritmo_hash, escopo_ml };
}

function sortByTrustPriority(a, b) {
  const activeDiff = Number(b.ativo) - Number(a.ativo);
  if (activeDiff !== 0) return activeDiff;

  const trustDiff = (TRUST_PRIORITY[b.tipo] || 0) - (TRUST_PRIORITY[a.tipo] || 0);
  if (trustDiff !== 0) return trustDiff;

  const dateA = a.criado_em ? new Date(a.criado_em).getTime() : 0;
  const dateB = b.criado_em ? new Date(b.criado_em).getTime() : 0;
  return dateB - dateA;
}

function enrichWithPriority(entry) {
  return {
    ...entry,
    prioridade_confianca: TRUST_PRIORITY[entry.tipo] || 0,
  };
}

export const listSecurityExclusions = async (req, res) => {
  try {
    const exclusions = await prisma.exclusoes_seguranca.findMany();
    return res.json(exclusions.sort(sortByTrustPriority).map(enrichWithPriority));
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const createSecurityExclusion = async (req, res) => {
  try {
    const data = validateInput(req.body);
    const created = await prisma.exclusoes_seguranca.create({
      data: {
        ...data,
        ativo: req.body?.ativo !== false,
      },
    });
    return res.status(201).json(enrichWithPriority(created));
  } catch (error) {
    if (String(error.message).includes('Unique constraint failed')) {
      return erro(res, 'Exclusao ja cadastrada para esse tipo e valor.', 409);
    }
    return erro(res, error.message, 400);
  }
};

export const updateSecurityExclusion = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return erro(res, 'ID invalido.', 400);
    }

    const existing = await prisma.exclusoes_seguranca.findUnique({
      where: { id_exclusao: id },
    });

    if (!existing) {
      return erro(res, 'Exclusao nao encontrada.', 404);
    }

    const parsed = validateInput({
      tipo: req.body?.tipo ?? existing.tipo,
      valor: req.body?.valor ?? existing.valor,
      descricao: req.body?.descricao ?? existing.descricao,
      algoritmo_hash: req.body?.algoritmo_hash ?? existing.algoritmo_hash,
      escopo_ml: req.body?.escopo_ml ?? existing.escopo_ml,
    });

    const updated = await prisma.exclusoes_seguranca.update({
      where: { id_exclusao: id },
      data: {
        ...parsed,
        ativo: req.body?.ativo === undefined ? existing.ativo : Boolean(req.body.ativo),
      },
    });

    return res.json(enrichWithPriority(updated));
  } catch (error) {
    if (String(error.message).includes('Unique constraint failed')) {
      return erro(res, 'Exclusao ja cadastrada para esse tipo e valor.', 409);
    }
    return erro(res, error.message, 400);
  }
};

export const deleteSecurityExclusion = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return erro(res, 'ID invalido.', 400);
    }

    await prisma.exclusoes_seguranca.delete({
      where: { id_exclusao: id },
    });

    return res.json({ mensagem: 'Exclusao removida com sucesso.' });
  } catch (error) {
    return erro(res, error.message, 400);
  }
};
