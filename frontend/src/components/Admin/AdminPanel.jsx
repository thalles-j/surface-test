import React, { useState, useEffect, useContext } from 'react';
import { Plus, Trash2, Edit, Shield, Activity, Clock } from 'lucide-react';
import Modal from '../Modal';
import AlertModal from '../AlertModal';
import { api } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

export default function AdminPanel() {
  const [admins, setAdmins] = useState([]);
  const [logs, setLogs] = useState([]);
  const { user } = useContext(AuthContext);

  const roleMap = { 'Super Admin': 1, 'Gerente': 2, 'Editor': 3, 'Viewer': 4 };
  const roleLabel = { 1: 'Super Admin', 2: 'Gerente', 3: 'Editor', 4: 'Viewer' };

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Editor',
    password: '',
  });

  const permissions = {
    'Super Admin': ['Visualizar', 'Criar', 'Editar', 'Deletar', 'Gerenciar Admins'],
    'Gerente': ['Visualizar', 'Criar', 'Editar', 'Deletar'],
    'Editor': ['Visualizar', 'Criar', 'Editar'],
    'Viewer': ['Visualizar'],
  };

  const handleAddAdmin = () => {
    // handled by submitAdmin
    setShowForm(true);
  };

  const handleDeleteAdmin = (id) => {
    setConfirmDelete({ isOpen: true, id });
  };

  const confirmDeleteAdmin = () => {
    // handled by api call
    setConfirmDelete({ isOpen: false, id: null });
  };

  // Load admins and logs
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [adminsRes, logsRes] = await Promise.all([
          api.get('/admin/admins'),
          api.get('/admin/admins/logs')
        ]);
        if (!mounted) return;
        const mapped = (adminsRes.data || []).map(u => ({
          id: u.id_usuario,
          name: u.nome,
          email: u.email,
          role: roleLabel[u.id_role] || 'Admin',
          status: 'Ativo',
          lastLogin: u.data_cadastro ? new Date(u.data_cadastro).toLocaleString() : 'Nunca'
        }));
        setAdmins(mapped);
        setLogs(logsRes.data || []);
      } catch (err) {
        console.error('Erro carregando admins/logs', err);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const openEditAdmin = (admin) => {
    setEditingId(admin.id);
    setFormData({ name: admin.name, email: admin.email, role: admin.role, password: '' });
    setShowForm(true);
  };

  const submitAdmin = async () => {
    try {
      if (editingId) {
        const payload = { nome: formData.name, email: formData.email };
        if (formData.password) payload.senha = formData.password;
        payload.id_role = roleMap[formData.role] || 1;
        payload.performedBy = user?.nome;
        const res = await api.patch(`/admin/admins/${editingId}`, payload);
        setAdmins(prev => prev.map(a => a.id === editingId ? { ...a, name: res.data.nome || formData.name, email: res.data.email || formData.email, role: formData.role } : a));
      } else {
        const payload = { nome: formData.name, email: formData.email, senha: formData.password || 'changeme', id_role: roleMap[formData.role] || 1, performedBy: user?.nome };
        const res = await api.post('/admin/admins', payload);
        const u = res.data;
        const mapped = { id: u.id_usuario, name: u.nome, email: u.email, role: roleLabel[u.id_role] || formData.role, status: 'Ativo', lastLogin: u.data_cadastro ? new Date(u.data_cadastro).toLocaleString() : 'Nunca' };
        setAdmins(prev => [mapped, ...prev]);
      }
      setFormData({ name: '', email: '', role: 'Editor', password: '' });
      setEditingId(null);
      setShowForm(false);
      // refresh logs
      try { const logsRes = await api.get('/admin/admins/logs'); setLogs(logsRes.data || []); } catch(e){}
    } catch (err) {
      console.error('Erro ao salvar admin', err);
    }
  };

  const doDeleteAdmin = async (id) => {
    try {
      await api.delete(`/admin/admins/${id}`, { data: { performedBy: user?.nome } });
      setAdmins(prev => prev.filter(a => a.id !== id));
      setConfirmDelete({ isOpen: false, id: null });
      try { const logsRes = await api.get('/admin/admins/logs'); setLogs(logsRes.data || []); } catch(e){}
    } catch (err) {
      console.error('Erro removendo admin', err);
      setConfirmDelete({ isOpen: false, id: null });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* ADMINS */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Shield size={20} /> Controle de Admins
          </h2>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-bold hover:bg-zinc-200 transition-colors"
          >
            <Plus size={16} /> Novo Admin
          </button>
        </div>

        <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Editar Admin' : 'Criar Novo Admin'}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome completo"
                className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg outline-none focus:border-zinc-500 text-white placeholder-zinc-500"
              />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Email"
                className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg outline-none focus:border-zinc-500 text-white placeholder-zinc-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Senha temporária"
                className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg outline-none focus:border-zinc-500 text-white placeholder-zinc-500"
              />
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg outline-none focus:border-zinc-500 text-white"
              >
                <option>Super Admin</option>
                <option>Gerente</option>
                <option>Editor</option>
                <option>Viewer</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={submitAdmin}
                className="flex-1 bg-emerald-600 text-white py-2 font-bold hover:bg-emerald-700 rounded-lg"
              >
                {editingId ? 'Salvar' : 'Criar Admin'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-6 py-2 border border-zinc-700 text-zinc-400 font-bold hover:text-white hover:border-zinc-500 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </div>
        </Modal>

        <div className="hidden md:block">
          <table className="w-full">
          <thead>
            <tr className="bg-zinc-800/50 text-xs font-bold uppercase text-zinc-500 border-b border-zinc-800">
              <th className="px-6 py-4">Nome</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Função</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Último Acesso</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {admins.map((admin) => (
              <tr key={admin.id} className="hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4 font-bold text-sm">{admin.name}</td>
                <td className="px-6 py-4 text-sm text-zinc-400">{admin.email}</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-purple-950 text-purple-400">
                    {admin.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400">
                    {admin.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-zinc-500 flex items-center gap-1">
                  <Clock size={14} /> {admin.lastLogin}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => openEditAdmin(admin)} className="p-2 text-zinc-500 hover:text-white transition-colors">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDeleteAdmin(admin.id)} className="p-2 text-zinc-500 hover:text-red-400 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>

        {/* mobile list */}
        <div className="md:hidden space-y-3 p-4">
          {admins.map(admin => (
            <div key={admin.id} className="bg-zinc-800 p-4 rounded-lg border border-zinc-700">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold">{admin.name}</div>
                  <div className="text-xs text-zinc-500">{admin.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEditAdmin(admin)} className="p-2 text-zinc-500 hover:text-white"><Edit size={14} /></button>
                  <button onClick={() => handleDeleteAdmin(admin.id)} className="p-2 text-zinc-500 hover:text-red-400"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="px-2 py-1 rounded-full bg-zinc-700">{admin.role}</span>
                <span className="text-zinc-500">{admin.lastLogin}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirm Delete Admin */}
      <AlertModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, id: null })}
        title="Confirmar exclusão"
        message="Deseja realmente remover este usuário admin?"
        type="warning"
        actionLabel="Remover"
        actionCallback={() => doDeleteAdmin(confirmDelete.id)}
      />

      {/* PERMISSÕES */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-lg font-bold">Níveis de Permissão</h2>
        </div>

        <div className="divide-y divide-zinc-800">
          {Object.entries(permissions).map(([role, perms]) => (
            <div key={role} className="p-6">
              <h3 className="font-bold mb-3">{role}</h3>
              <div className="flex flex-wrap gap-2">
                {perms.map((perm, i) => (
                  <span key={i} className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded-full text-xs font-semibold">
                    ✓ {perm}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LOGS */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800 flex items-center gap-2">
          <Activity size={20} /> <h2 className="text-lg font-bold">Logs de Atividades</h2>
        </div>

        <div className="divide-y divide-zinc-800">
          {logs.map((log) => (
            <div key={log.id} className="p-6 hover:bg-zinc-800/50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-sm">{log.action}</p>
                  <p className="text-xs text-zinc-500">por {log.user}</p>
                </div>
                <span className="text-xs text-zinc-600 font-mono">{log.timestamp}</span>
              </div>
              <p className="text-sm text-zinc-400 pl-4 border-l-2 border-zinc-700">{log.details}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
