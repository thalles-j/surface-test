import React, { useState, useEffect, useContext } from 'react';
import { Plus, Trash2, Edit, Shield, Activity, Clock } from 'lucide-react';
import Modal from '../../Modal';
import AlertModal from '../../AlertModal';
import { api } from '../../../services/api';
import { AuthContext } from '../../../context/AuthContext';

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
    selectedUserId: '',
  });
  const [allUsers, setAllUsers] = useState([]);

  const permissions = {
    'Super Admin': ['Visualizar', 'Criar', 'Editar', 'Deletar', 'Gerenciar Admins'],
    'Gerente': ['Visualizar', 'Criar', 'Editar', 'Deletar'],
    'Editor': ['Visualizar', 'Criar', 'Editar'],
    'Viewer': ['Visualizar'],
  };

  const handleAddAdmin = async () => {
    setEditingId(null);
    setFormData({ name: '', email: '', role: 'Editor', password: '', selectedUserId: '' });
    setShowForm(true);
    try {
      const res = await api.get('/admin/customers?limit=1000');
      const list = res.data?.data || res.data || [];
      setAllUsers(list.filter(u => u.id_role !== 1));
    } catch (err) {
      console.error('Erro carregando usuarios', err);
      setAllUsers([]);
    }
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
    setFormData({ name: admin.name, email: admin.email, role: admin.role, password: '', selectedUserId: '' });
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
        const selected = allUsers.find(u => String(u.id_usuario) === String(formData.selectedUserId));
        if (!selected) return;
        const payload = { email: selected.email, id_role: roleMap[formData.role] || 1, performedBy: user?.nome };
        const res = await api.post('/admin/admins', payload);
        const u = res.data;
        const mapped = { id: u.id_usuario, name: u.nome, email: u.email, role: roleLabel[u.id_role] || formData.role, status: 'Ativo', lastLogin: u.data_cadastro ? new Date(u.data_cadastro).toLocaleString() : 'Nunca' };
        setAdmins(prev => [mapped, ...prev]);
      }
      setFormData({ name: '', email: '', role: 'Editor', password: '', selectedUserId: '' });
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

  const sectionStyle = {
    background: 'var(--app-surface)',
    border: '1px solid var(--app-border)',
    color: 'var(--app-text)',
  };

  const mutedSurfaceStyle = {
    background: 'var(--app-surface-muted)',
    borderColor: 'var(--app-border)',
  };

  const subtleTextStyle = { color: 'var(--app-muted-text)' };
  const secondaryTextStyle = { color: 'var(--app-text-secondary)' };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* ADMINS */}
      <div className="rounded-xl overflow-hidden" style={sectionStyle}>
        <div className="p-6 flex justify-between items-center" style={{ borderBottom: '1px solid var(--app-border)' }}>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Shield size={20} /> Controle de Admins
          </h2>
          <button
            onClick={() => setShowForm(true)}
            className="admin-btn-primary flex items-center gap-2 px-4 py-2 rounded-lg font-bold"
          >
            <Plus size={16} /> Novo Admin
          </button>
        </div>

        <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Editar Admin' : 'Atribuir Cargo'}>
          <div className="space-y-4">
            {editingId ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome completo"
                  className="admin-input p-2 rounded-lg"
                />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Email"
                  className="admin-input p-2 rounded-lg"
                />
              </div>
            ) : (
              <div>
                <select
                  value={formData.selectedUserId}
                  onChange={(e) => setFormData({ ...formData, selectedUserId: e.target.value })}
                  className="admin-select p-2 rounded-lg w-full"
                >
                  <option value="">Selecione um usuário...</option>
                  {allUsers.map(u => (
                    <option key={u.id_usuario} value={u.id_usuario}>{u.nome} ({u.email})</option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {editingId && (
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Nova senha (opcional)"
                  className="admin-input p-2 rounded-lg"
                />
              )}
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="admin-select p-2 rounded-lg"
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
                className="admin-btn-primary flex-1 py-2 font-bold rounded-lg"
              >
                {editingId ? 'Salvar' : 'Atribuir Cargo'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="admin-btn-secondary px-6 py-2 font-bold rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </div>
        </Modal>

        <div className="hidden md:block">
          <table className="w-full">
          <thead>
            <tr className="text-xs font-bold uppercase" style={{ ...mutedSurfaceStyle, ...subtleTextStyle, borderBottom: '1px solid var(--app-border)' }}>
              <th className="px-6 py-4">Nome</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Função</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Último Acesso</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--app-border)' }}>
            {admins.map((admin) => (
              <tr key={admin.id} className="transition-colors hover:bg-[var(--app-surface-muted)]">
                <td className="px-6 py-4 font-bold text-sm">{admin.name}</td>
                <td className="px-6 py-4 text-sm" style={secondaryTextStyle}>{admin.email}</td>
                <td className="px-6 py-4">
                  <span className="admin-badge admin-badge-info px-3 py-1 text-[10px] font-bold uppercase">
                    {admin.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="admin-badge admin-badge-success px-3 py-1 text-[10px] font-bold uppercase">
                    {admin.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm flex items-center gap-1" style={subtleTextStyle}>
                  <Clock size={14} /> {admin.lastLogin}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => openEditAdmin(admin)} className="p-2 transition-colors" style={subtleTextStyle}>
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDeleteAdmin(admin.id)} className="p-2 transition-colors" style={subtleTextStyle}>
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
            <div key={admin.id} className="p-4 rounded-lg border" style={mutedSurfaceStyle}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold">{admin.name}</div>
                  <div className="text-xs" style={subtleTextStyle}>{admin.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEditAdmin(admin)} className="p-2" style={subtleTextStyle}><Edit size={14} /></button>
                  <button onClick={() => handleDeleteAdmin(admin.id)} className="p-2" style={subtleTextStyle}><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="admin-badge admin-badge-info px-2 py-1">{admin.role}</span>
                <span style={subtleTextStyle}>{admin.lastLogin}</span>
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
      <div className="rounded-xl overflow-hidden" style={sectionStyle}>
        <div className="p-6" style={{ borderBottom: '1px solid var(--app-border)' }}>
          <h2 className="text-lg font-bold">Níveis de Permissão</h2>
        </div>

        <div className="divide-y" style={{ borderColor: 'var(--app-border)' }}>
          {Object.entries(permissions).map(([role, perms]) => (
            <div key={role} className="p-6">
              <h3 className="font-bold mb-3">{role}</h3>
              <div className="flex flex-wrap gap-2">
                {perms.map((perm, i) => (
                  <span key={i} className="admin-badge admin-badge-neutral px-3 py-1 text-xs font-semibold">
                    ✓ {perm}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LOGS */}
      <div className="rounded-xl overflow-hidden" style={sectionStyle}>
        <div className="p-6 flex items-center gap-2" style={{ borderBottom: '1px solid var(--app-border)' }}>
          <Activity size={20} /> <h2 className="text-lg font-bold">Logs de Atividades</h2>
        </div>

        <div className="divide-y" style={{ borderColor: 'var(--app-border)' }}>
          {logs.map((log) => (
            <div key={log.id} className="p-6 transition-colors hover:bg-[var(--app-surface-muted)]">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-sm">{log.action}</p>
                  <p className="text-xs" style={subtleTextStyle}>por {log.user}</p>
                </div>
                <span className="text-xs font-mono" style={secondaryTextStyle}>{log.timestamp}</span>
              </div>
              <p className="text-sm pl-4 border-l-2" style={{ ...secondaryTextStyle, borderColor: 'var(--app-border)' }}>{log.details}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
