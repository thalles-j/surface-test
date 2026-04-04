import React, { useState } from 'react';
import { Plus, Trash2, Edit, Shield, Activity, Clock } from 'lucide-react';
import Modal from '../Modal';
import AlertModal from '../AlertModal';

export default function AdminPanel() {
  const [admins, setAdmins] = useState([
    { id: 1, name: 'Admin Master', email: 'admin@surface.com', role: 'Super Admin', status: 'Ativo', lastLogin: '2024-10-26 14:30' },
    { id: 2, name: 'João Manager', email: 'joao.manager@surface.com', role: 'Gerente', status: 'Ativo', lastLogin: '2024-10-25 09:15' },
    { id: 3, name: 'Maria Editor', email: 'maria.editor@surface.com', role: 'Editor', status: 'Ativo', lastLogin: '2024-10-24 16:45' },
  ]);

  const [logs, setLogs] = useState([
    { id: 1, action: 'Produto criado', user: 'João Manager', timestamp: '2024-10-26 14:30', details: 'Camiseta Boxy Logo' },
    { id: 2, action: 'Pedido aprovado', user: 'Maria Editor', timestamp: '2024-10-26 13:20', details: '#1024 - João Silva' },
    { id: 3, action: 'Cupom criado', user: 'Admin Master', timestamp: '2024-10-26 11:00', details: 'BLACK20 - 20%' },
    { id: 4, action: 'Categoria editada', user: 'João Manager', timestamp: '2024-10-25 15:45', details: 'Exclusivo' },
  ]);

  const [showForm, setShowForm] = useState(false);
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
    if (formData.name && formData.email && formData.password) {
      setAdmins([...admins, {
        id: Date.now(),
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: 'Ativo',
        lastLogin: 'Nunca'
      }]);
      setFormData({ name: '', email: '', role: 'Editor', password: '' });
      setShowForm(false);
    }
  };

  const handleDeleteAdmin = (id) => {
    setConfirmDelete({ isOpen: true, id });
  };

  const confirmDeleteAdmin = () => {
    if (!confirmDelete.id) return;
    setAdmins(admins.filter(a => a.id !== confirmDelete.id));
    setConfirmDelete({ isOpen: false, id: null });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* ADMINS */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Shield size={20} /> Controle de Admins
          </h2>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg font-bold hover:bg-zinc-800 transition-colors"
          >
            <Plus size={16} /> Novo Admin
          </button>
        </div>

        <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Criar Novo Admin">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome completo"
                className="p-2 border border-gray-300 rounded-lg outline-none focus:border-black"
              />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Email"
                className="p-2 border border-gray-300 rounded-lg outline-none focus:border-black"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Senha temporária"
                className="p-2 border border-gray-300 rounded-lg outline-none focus:border-black"
              />
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="p-2 border border-gray-300 rounded-lg outline-none focus:border-black bg-white"
              >
                <option>Super Admin</option>
                <option>Gerente</option>
                <option>Editor</option>
                <option>Viewer</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddAdmin}
                className="flex-1 bg-green-600 text-white py-2 font-bold hover:bg-green-700 rounded-lg"
              >
                Criar Admin
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-6 py-2 border border-gray-300 font-bold hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </div>
        </Modal>

        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-gray-100">
              <th className="px-6 py-4">Nome</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Função</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Último Acesso</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {admins.map((admin) => (
              <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-bold text-sm">{admin.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{admin.email}</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-purple-100 text-purple-700">
                    {admin.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-green-100 text-green-700">
                    {admin.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 flex items-center gap-1">
                  <Clock size={14} /> {admin.lastLogin}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button className="p-2 text-gray-400 hover:text-black transition-colors">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDeleteAdmin(admin.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirm Delete Admin */}
      <AlertModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, id: null })}
        title="Confirmar exclusão"
        message="Deseja realmente remover este usuário admin?"
        type="warning"
        actionLabel="Remover"
        actionCallback={confirmDeleteAdmin}
      />

      {/* PERMISSÕES */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold">Níveis de Permissão</h2>
        </div>

        <div className="divide-y divide-gray-100">
          {Object.entries(permissions).map(([role, perms]) => (
            <div key={role} className="p-6">
              <h3 className="font-bold mb-3">{role}</h3>
              <div className="flex flex-wrap gap-2">
                {perms.map((perm, i) => (
                  <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                    ✓ {perm}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LOGS */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-2">
          <Activity size={20} /> <h2 className="text-lg font-bold">Logs de Atividades</h2>
        </div>

        <div className="divide-y divide-gray-100">
          {logs.map((log) => (
            <div key={log.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-sm">{log.action}</p>
                  <p className="text-xs text-gray-500">por {log.user}</p>
                </div>
                <span className="text-xs text-gray-400 font-mono">{log.timestamp}</span>
              </div>
              <p className="text-sm text-gray-600 pl-4 border-l-2 border-gray-200">{log.details}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
