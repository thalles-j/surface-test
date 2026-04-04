import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Calendar, Lock, Unlock } from 'lucide-react';
import Modal from '../Modal';
import AlertModal from '../AlertModal';
import { api } from '../../services/api';

export default function Collections({ openCreate, onCloseCreate }) {
  const [collections, setCollections] = useState([
    ]);

  const [products, setProducts] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    launchDate: '',
    status: 'Planejado',
    locked: false,
    description: '',
  });

  const [selectedProducts, setSelectedProducts] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [colsRes, prodsRes] = await Promise.all([api.get('/admin/collections'), api.get('/products')]);
        setCollections(colsRes.data || []);
        setProducts((prodsRes.data || []).map(p => ({ id: p.id_produto, name: p.nome_produto })));
      } catch (err) {
        console.error('Erro ao carregar coleções/produtos:', err);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (openCreate) {
      setEditingId(null);
      setFormData({ name: '', launchDate: '', status: 'Planejado', locked: false, description: '' });
      setSelectedProducts([]);
      setShowForm(true);
    }
  }, [openCreate]);

  const handleAddCollection = () => {
    const submit = async () => {
      try {
        if (editingId) {
          await api.patch(`/admin/collections/${editingId}`, { nome: formData.name, descricao: formData.description, status: formData.status, locked: formData.locked, productIds: selectedProducts });
        } else {
          await api.post('/admin/collections', { nome: formData.name, descricao: formData.description, status: formData.status, locked: formData.locked, productIds: selectedProducts });
        }
        const res = await api.get('/admin/collections');
        setCollections(res.data || []);
        setFormData({ name: '', launchDate: '', status: 'Planejado', locked: false, description: '' });
        setSelectedProducts([]);
        setShowForm(false);
        setEditingId(null);
      } catch (err) {
        console.error('Erro ao salvar coleção:', err);
      }
    };
    submit();
  };

  const handleToggleLock = (id) => {
    const toggle = async () => {
      try {
        const target = collections.find(c => c.id === id);
        await api.patch(`/admin/collections/${id}/lock`, { locked: !target.locked });
        const res = await api.get('/admin/collections');
        setCollections(res.data || []);
      } catch (err) {
        console.error('Erro ao alternar lock:', err);
      }
    };
    toggle();
  };

  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });

  const handleDeleteCollection = (id) => {
    setConfirmDelete({ isOpen: true, id });
  };

  const confirmDeleteCollection = () => {
    const doDelete = async () => {
      try {
        if (!confirmDelete.id) return;
        await api.delete(`/admin/collections/${confirmDelete.id}`);
        const res = await api.get('/admin/collections');
        setCollections(res.data || []);
        setConfirmDelete({ isOpen: false, id: null });
      } catch (err) {
        console.error('Erro ao deletar coleção:', err);
      }
    };
    doDelete();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* FORM (Modal) */}
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditingId(null); if (onCloseCreate) onCloseCreate(); }} title={editingId ? 'Editar Coleção' : 'Criar Nova Coleção'}>
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

          {/* PRODUCTS MULTISELECT */}
          <div>
            <label className="text-sm font-medium mb-2 block">Produtos na Coleção</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded p-2">
              {products.map(prod => (
                <label key={prod.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={selectedProducts.includes(prod.id)} onChange={(e) => {
                    if (e.target.checked) setSelectedProducts(prev => [...prev, prod.id]);
                    else setSelectedProducts(prev => prev.filter(x => x !== prod.id));
                  }} />
                  <span>{prod.name}</span>
                </label>
              ))}
            </div>
          </div>

            <div className="flex gap-2 pt-4 border-t border-gray-200">
              <button
                onClick={handleAddCollection}
                className="flex-1 bg-black text-white py-3 font-bold hover:bg-zinc-800 transition-colors rounded-lg"
              >
                {editingId ? 'Atualizar Coleção' : 'Criar Coleção'}
              </button>
              <button
                onClick={() => { setShowForm(false); setEditingId(null); if (onCloseCreate) onCloseCreate(); }}
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
                <p className="text-sm text-gray-500 uppercase font-bold">{(c.produtos || c.products || []).length} Produtos</p>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-lg">{c.nome || c.name}</h3>
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${c.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {c.status}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <Calendar size={14} />
                {c.launchDate ? new Date(c.launchDate).toLocaleDateString('pt-BR') : c.criado_em ? new Date(c.criado_em).toLocaleDateString('pt-BR') : ''}
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
                  onClick={() => { setFormData({ name: c.nome, launchDate: '', status: c.status || 'Planejado', locked: c.locked || false, description: c.descricao || '' }); setSelectedProducts((c.produtos || []).map(p => p.id_produto || p.id)); setEditingId(c.id_colecao || c.id); setShowForm(true); }}
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
