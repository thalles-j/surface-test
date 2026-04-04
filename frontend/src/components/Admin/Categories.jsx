import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Search } from 'lucide-react';
import Modal from '../Modal';
import AlertModal from '../AlertModal';
import { api } from '../../services/api';

export default function Categories() {
  const [categories, setCategories] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    featured: false,
  });

  const handleAddCategory = () => {
    const submit = async () => {
      try {
        if (editingId) {
          await api.patch(`/admin/categories/${editingId}`, { name: formData.name, description: formData.description });
        } else {
          await api.post('/admin/categories', { name: formData.name, description: formData.description });
        }
        const res = await api.get('/admin/categories');
        setCategories((res.data || []).map(c => ({ id: c.id_categoria, name: c.nome_categoria, description: c.descricao, productCount: c._count?.produtos || 0 })));
        setFormData({ name: '', description: '', featured: false });
        setShowForm(false);
        setEditingId(null);
      } catch (err) {
        console.error('Erro ao salvar categoria:', err);
      }
    };
    submit();
  };

  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });

  const handleDeleteCategory = (id) => {
    setConfirmDelete({ isOpen: true, id });
  };

  const confirmDeleteCategory = () => {
    const doDelete = async () => {
      try {
        if (!confirmDelete.id) return;
        await api.delete(`/admin/categories/${confirmDelete.id}`);
        const res = await api.get('/admin/categories');
        setCategories((res.data || []).map(c => ({ id: c.id_categoria, name: c.nome_categoria, description: c.descricao, productCount: c._count?.produtos || 0 })));
        setConfirmDelete({ isOpen: false, id: null });
      } catch (err) {
        console.error('Erro ao deletar categoria:', err);
      }
    };
    doDelete();
  };

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/admin/categories');
        setCategories((res.data || []).map(c => ({ id: c.id_categoria, name: c.nome_categoria, description: c.descricao, productCount: c._count?.produtos || 0 })));
      } catch (err) {
        console.error('Erro ao carregar categorias:', err);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* FORM (Modal) */}
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditingId(null); }} title={editingId ? 'Editar Categoria' : 'Criar Nova Categoria'}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Nome da Categoria</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Essentials"
              className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva a categoria..."
              rows="3"
              className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-black"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.featured}
              onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
              id="featuredCategory"
              className="w-4 h-4"
            />
            <label htmlFor="featuredCategory" className="text-sm font-medium">Destacar na Home</label>
          </div>

          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <button
              onClick={handleAddCategory}
              className="flex-1 bg-black text-white py-3 font-bold hover:bg-zinc-800 transition-colors rounded-lg"
            >
              {editingId ? 'Atualizar Categoria' : 'Criar Categoria'}
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

      {/* LISTA */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex gap-4 justify-between items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar categorias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-black outline-none"
            />
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-zinc-800 transition-colors"
          >
            <Plus size={18} /> Nova Categoria
          </button>
        </div>

        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-gray-100">
              <th className="px-6 py-4">Categoria</th>
              <th className="px-6 py-4">Descrição</th>
              <th className="px-6 py-4">Produtos</th>
              <th className="px-6 py-4">Destaque</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredCategories.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-bold text-sm">{c.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{c.description}</td>
                <td className="px-6 py-4 text-sm font-semibold">{c.productCount}</td>
                <td className="px-6 py-4">{c.featured ? '⭐ Sim' : '-'}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button
                    onClick={() => { setFormData(c); setEditingId(c.id); setShowForm(true); }}
                    className="p-2 text-gray-400 hover:text-black transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(c.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Confirm Delete Modal */}
      <AlertModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, id: null })}
        title="Confirmar exclusão"
        message="Tem certeza que deseja deletar esta categoria?"
        type="warning"
        actionLabel="Deletar"
        actionCallback={confirmDeleteCategory}
      />
    </div>
  );
}
