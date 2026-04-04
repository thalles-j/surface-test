import React, { useState } from 'react';
import { Plus, Trash2, Edit, Calendar, Lock, Unlock } from 'lucide-react';
import Modal from '../Modal';
import AlertModal from '../AlertModal';

export default function Collections() {
  const [collections, setCollections] = useState([
    { id: 1, name: 'Drop 01 - Void Series', launchDate: '2024-11-15', status: 'Planejado', locked: false, products: 8 },
    { id: 2, name: 'Essentials Winter', launchDate: '2024-12-01', status: 'Ativo', locked: false, products: 12 },
    { id: 3, name: 'Black Friday 2024', launchDate: '2024-11-29', status: 'Planejado', locked: true, products: 25 },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    launchDate: '',
    status: 'Planejado',
    locked: false,
    description: '',
  });

  const handleAddCollection = () => {
    if (editingId) {
      setCollections(collections.map(c => c.id === editingId ? { ...formData, id: editingId, products: c.products } : c));
      setEditingId(null);
    } else {
      setCollections([...collections, { ...formData, id: Date.now(), products: 0 }]);
    }
    setFormData({ name: '', launchDate: '', status: 'Planejado', locked: false, description: '' });
    setShowForm(false);
  };

  const handleToggleLock = (id) => {
    setCollections(collections.map(c => c.id === id ? { ...c, locked: !c.locked } : c));
  };

  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });

  const handleDeleteCollection = (id) => {
    setConfirmDelete({ isOpen: true, id });
  };

  const confirmDeleteCollection = () => {
    if (!confirmDelete.id) return;
    setCollections(collections.filter(c => c.id !== confirmDelete.id));
    setConfirmDelete({ isOpen: false, id: null });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* FORM (Modal) */}
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditingId(null); }} title={editingId ? 'Editar Coleção' : 'Criar Nova Coleção'}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Nome da Coleção</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Drop 01 - Void Series"
              className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva a coleção..."
              rows="4"
              className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-black"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Data de Lançamento</label>
              <input
                type="date"
                value={formData.launchDate}
                onChange={(e) => setFormData({ ...formData, launchDate: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-black bg-white"
              >
                <option>Planejado</option>
                <option>Ativo</option>
                <option>Finalizado</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.locked}
              onChange={(e) => setFormData({ ...formData, locked: e.target.checked })}
              id="lockCollection"
              className="w-4 h-4"
            />
            <label htmlFor="lockCollection" className="text-sm font-medium">Ativar Coming Soon (Site Travado)</label>
          </div>

          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <button
              onClick={handleAddCollection}
              className="flex-1 bg-black text-white py-3 font-bold hover:bg-zinc-800 transition-colors rounded-lg"
            >
              {editingId ? 'Atualizar Coleção' : 'Criar Coleção'}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditingId(null); }}
              className="px-6 py-3 border border-gray-300 font-bold hover:bg-gray-50 transition-colors rounded-lg"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

      {/* GRID DE COLEÇÕES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((c) => (
          <div key={c.id} className="bg-white border border-gray-100 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
            <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-gray-500 uppercase font-bold">{c.products} Produtos</p>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-lg">{c.name}</h3>
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${c.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {c.status}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <Calendar size={14} />
                {new Date(c.launchDate).toLocaleDateString('pt-BR')}
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleToggleLock(c.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-sm transition-colors ${c.locked
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {c.locked ? <Lock size={14} /> : <Unlock size={14} />}
                  {c.locked ? 'Travada' : 'Liberar'}
                </button>
                <button
                  onClick={() => { setFormData({ ...c, products: undefined }); setEditingId(c.id); setShowForm(true); }}
                  className="p-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDeleteCollection(c.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* ADD NEW BUTTON */}
        <button
          onClick={() => setShowForm(true)}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex items-center justify-center hover:border-black transition-colors group"
        >
          <div className="text-center">
            <Plus size={32} className="mx-auto mb-2 text-gray-400 group-hover:text-black transition-colors" />
            <p className="font-bold text-gray-600 group-hover:text-black transition-colors">Criar Coleção</p>
          </div>
        </button>
      </div>
      
      {/* Confirm Delete Modal */}
      <AlertModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, id: null })}
        title="Confirmar exclusão"
        message="Tem certeza que deseja deletar esta coleção? Esta ação não pode ser desfeita."
        type="warning"
        actionLabel="Deletar"
        actionCallback={confirmDeleteCollection}
      />
    </div>
  );
}
