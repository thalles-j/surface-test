import prisma from '../../database/prisma.js';
import { erro } from '../../helpers/apiResponse.js';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ACTIVITY_LOGS_FILE = join(__dirname, '../../../activity_logs.json');

async function appendActivityLog(action, user, details) {
  try {
    let logs = [];
    try {
      const content = await fs.readFile(ACTIVITY_LOGS_FILE, 'utf8');
      logs = JSON.parse(content || '[]');
    } catch (err) {
      logs = [];
    }

    const entry = {
      id: Date.now(),
      action,
      user: user || 'Unknown',
      timestamp: new Date().toISOString(),
      details: details || ''
    };

    logs.unshift(entry);
    await fs.writeFile(ACTIVITY_LOGS_FILE, JSON.stringify(logs.slice(0, 1000), null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to append activity log', err);
  }
}

export const getAdminUsers = async (req, res) => {
  try {
    const admins = await prisma.usuarios.findMany({ where: { id_role: 1 } });
    return res.json(admins);
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const createAdminUser = async (req, res) => {
  try {
    const { nome, email, senha, id_role, performedBy } = req.body;
    const hash = await bcrypt.hash(senha || 'changeme', 10);
    const user = await prisma.usuarios.create({ data: { nome, email, senha: hash, id_role: id_role || 1 } });
    try { await appendActivityLog('Admin criado', performedBy || (req.user && req.user.nome), `Criado: ${user.nome} (${user.email})`); } catch(e){}
    return res.status(201).json(user);
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const updateAdminUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const performedBy = updates.performedBy || (req.user && req.user.nome);
    if (updates.senha) updates.senha = await bcrypt.hash(updates.senha, 10);
    if (updates.performedBy) delete updates.performedBy;
    const user = await prisma.usuarios.update({ where: { id_usuario: parseInt(id) }, data: updates });
    try { await appendActivityLog('Admin atualizado', performedBy, `Atualizado id:${id} - ${user.nome || updates.nome || ''}`); } catch(e){}
    return res.json(user);
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const deleteAdminUser = async (req, res) => {
  try {
    const { id } = req.params;
    const adminToDelete = await prisma.usuarios.findUnique({ where: { id_usuario: parseInt(id) } });
    await prisma.usuarios.delete({ where: { id_usuario: parseInt(id) } });
    const performedBy = req.body && req.body.performedBy ? req.body.performedBy : (req.user && req.user.nome);
    try { await appendActivityLog('Admin removido', performedBy, `Removido: ${adminToDelete ? adminToDelete.nome + ' (' + adminToDelete.email + ')' : 'id:'+id}`); } catch(e){}
    return res.json({ mensagem: 'Admin deletado' });
  } catch (error) {
    return erro(res, error.message, 500);
  }
};

export const getActivityLogs = async (req, res) => {
  try {
    try {
      const content = await fs.readFile(ACTIVITY_LOGS_FILE, 'utf8');
      const logs = JSON.parse(content || '[]');
      return res.json(logs);
    } catch (err) {
      return res.json([]);
    }
  } catch (error) {
    return erro(res, error.message, 500);
  }
};
