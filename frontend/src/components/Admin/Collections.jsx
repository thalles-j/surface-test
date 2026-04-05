import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit, Calendar, Lock, Unlock, Search, CheckSquare, Square } from 'lucide-react';
import Modal from '../Modal';
import AlertModal from '../AlertModal';
import Pagination from './Pagination';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';

const PAGE_SIZE = 12;

const BULK_ACTIONS = [
  { value: 'ativar', label: 'Ativar selecionadas' },
  { value: 'desativar', label: 'Desativar selecionadas' },
  { value: 'travar', label: 'Travar (Coming Soon)' },
  { value: 'destravar', label: 'Destravar' },
];

export default function Collections({ openCreate, onCloseCreate }) {
  const { addToast } = useToast();

  const [collections, setCollections] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [lockedFilter, setLockedFilter] = useState('todos');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [confirmBulk, setConfirmBulk] = useState(false);

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
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, lockedFilter]);

  const loadCollections = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('limit', PAGE_SIZE);
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter !== 'todos') params.set('status', statusFilter);
      if (lockedFilter !== 'todos') params.set('locked', lockedFilter);

      const res = await api.get(`/admin/collections?${params}`);
      if (res.data?.data) {
        setCollections(res.data.data);
        setTotalPages(res.data.totalPages || 1);
        setTotalItems(res.data.total || 0);
      } else {
        setCollections(res.data || []);
      }
    } catch (err) {
      console.error('Erro ao carregar coleções:', err);
      addToast('Erro ao carregar coleções', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, lockedFilter, addToast]);

  const loadProducts = useCallback(async () => {
    try {
      const res = await api.get('/products');
      setProducts((res.data || []).map(p => ({ id: p.id_produto, name: p.nome_produto })));
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
    }
  }, []);

  useEffect(() => { loadCollections(); }, [loadCollections]);
  useEffect(() => { loadProducts(); }, [loadProducts]);

  // Open create from parent
  useEffect(() => {
    if (openCreate) {
      setEditingId(null);
      setFormData({ name: '', launchDate: '', status: 'Planejado', locked: false, description: '' });
      setSelectedProducts([]);
      setShowForm(true);
    }
  }, [openCreate]);

  // Bulk selection helpers
  const toggleSelect = useCallback((id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const handleBulkExecute = useCallback(async () => {
    if (!bulkAction || selectedIds.length === 0) return;
    try {
      await api.patch('/admin/collections/bulk-status', { ids: selectedIds, action: bulkAction });
      addToast(`Ação "${bulkAction}" aplicada a ${selectedIds.length} coleção(ões)`, 'success');
      setSelectedIds([]);
      setBulkAction('');
      setConfirmBulk(false);
      await loadCollections();
    } catch (err) {
      console.error('Erro na ação em massa:', err);
      addToast('Erro ao executar ação em massa', 'error');
      setConfirmBulk(false);
    }
  }, [bulkAction, selectedIds, addToast, loadCollections]);

  const handleAddCollection = useCallback(async () => {
    try {
      if (editingId) {
        await api.patch(`/admin/collections/${editingId}`, { nome: formData.name, descricao: formData.description, status: formData.status, locked: formData.locked, productIds: selectedProducts });
        addToast('Coleção atualizada!', 'success');
      } else {
        await api.post('/admin/collections', { nome: formData.name, descricao: formData.description, status: formData.status, locked: formData.locked, productIds: selectedProducts });
        addToast('Coleção criada!', 'success');
      }
      setFormData({ name: '', launchDate: '', status: 'Planejado', locked: false, description: '' });
      setSelectedProducts([]);
      setShowForm(false);
      setEditingId(null);
      if (onCloseCreate) onCloseCreate();
      await loadCollections();
    } catch (err) {
      console.error('Erro ao salvar coleção:', err);
      addToast('Erro ao salvar coleção', 'error');
    }
  }, [editingId, formData, selectedProducts, addToast, loadCollections, onCloseCreate]);

  const handleToggleLock = useCallback(async (id) => {
    try {
      const target = collections.find(c => (c.id_colecao || c.id) === id);
      await api.patch(`/admin/collections/${id}/lock`, { locked: !target.locked });
      addToast(target.locked ? 'Coleção destravada' : 'Coleção travada', 'success');
      await loadCollections();
    } catch (err) {
      console.error('Erro ao alternar lock:', err);
      addToast('Erro ao alternar lock', 'error');
    }
  }, [collections, addToast, loadCollections]);

  const handleDeleteCollection = useCallback((id) => {
    setConfirmDelete({ isOpen: true, id });
  }, []);

  const confirmDeleteCollection = useCallback(async () => {
    if (!confirmDelete.id) return;
    try {
      await api.delete(`/admin/collections/${confirmDelete.id}`);
      addToast('Coleção excluída', 'success');
      setConfirmDelete({ isOpen: false, id: null });
      await loadCollections();
    } catch (err) {
      console.error('Erro ao deletar coleção:', err);
      addToast('Erro ao deletar coleção', 'error');
    }
  }, [confirmDelete.id, addToast, loadCollections]);

  const openEditForm = useCallback((c) => {
    setFormData({
      name: c.nome || c.name || '',
      launchDate: '',
      status: c.status || 'Planejado',
      locked: c.locked || false,
      description: c.descricao || '',
    });
    setSelectedProducts((c.produtos || []).map(p => p.id_produto || p.id));
    setEditingId(c.id_colecao || c.id);
    setShowForm(true);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* SEARCH + FILTERS */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar coleções..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-black outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-black bg-white"
          >
            <option value="todos">Todos os Status</option>
            <option value="Ativo">Ativo</option>
            <option value="Planejado">Planejado</option>
            <option value="Finalizado">Finalizado</option>
          </select>
          <select
            value={lockedFilter}
            onChange={(e) => setLockedFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-black bg-white"
          >
            <option value="todos">Lock: Todos</option>
            <option value="true">Travadas</option>
            <option value="false">Destravadas</option>
          </select>
        </div>

        {/* Bulk actions */}
        {selectedIds.length > 0 && (
          <div className="mt-4 flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <span className="text-sm font-bold text-blue-700">{selectedIds.length} selecionada(s)</span>
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="px-3 py-1.5 border border-blue-200 rounded-lg text-sm bg-white"
            >
              <option value="">Ação em massa...</option>
              {BULK_ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
            <button
              onClick={() => bulkAction && setConfirmBulk(true)}
              disabled={!bulkAction}
              className="px-4 py-1.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Aplicar
            </button>
            <button
              onClick={() => { setSelectedIds([]); setBulkAction(''); }}
              className="px-3 py-1.5 text-sm text-gray-500 hover:text-black"
            >
              Limpar
            </button>
          </div>
        )}
      </div>

      {loading && <div className="p-4 text-center text-gray-400 text-sm">Carregando...</div>}

      {/* GRID DE COLEÇÕES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((c) => {
          const colId = c.id_colecao || c.id;
          const isSelected = selectedIds.includes(colId);
          return (
            <div key={colId} className={`bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow ${isSelected ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-100'}`}>
              {/* Select checkbox */}
              <div className="px-4 pt-3 flex justify-between items-center">
                <button onClick={() => toggleSelect(colId)} className="text-gray-400 hover:text-black">
                  {isSelected ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} />}
                </button>
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${c.status === 'Ativo' ? 'bg-green-100 text-green-700' : c.status === 'Finalizado' ? 'bg-gray-200 text-gray-600' : 'bg-yellow-100 text-yellow-700'}`}>
                  {c.status}
                </span>
              </div>

              <div className="h-28 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-gray-500 uppercase font-bold">{(c.produtos || c.products || []).length} Produtos</p>
                  {c.metrics && (
                    <>
                      <p className="text-lg font-bold mt-1">R$ {Number(c.metrics.totalVendido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <p className="text-xs text-gray-400">{c.metrics.totalItens || 0} itens vendidos</p>
                    </>
                  )}
                </div>
              </div>

              <div className="p-6">
                <h3 className="font-bold text-lg mb-2">{c.nome || c.name}</h3>

                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <Calendar size={14} />
                  {c.launchDate ? new Date(c.launchDate).toLocaleDateString('pt-BR') : c.criado_em ? new Date(c.criado_em).toLocaleDateString('pt-BR') : ''}
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleToggleLock(colId)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-sm transition-colors ${c.locked
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {c.locked ? <Lock size={14} /> : <Unlock size={14} />}
                    {c.locked ? 'Travada' : 'Liberar'}
                  </button>
                  <button
                    onClick={() => openEditForm(c)}
                    className="p-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteCollection(colId)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* ADD NEW BUTTON */}
        <button
          onClick={() => setShowForm(true)}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex items-center justify-center hover:border-black transition-colors group min-h-[250px]"
        >
          <div className="text-center">
            <Plus size={32} className="mx-auto mb-2 text-gray-400 group-hover:text-black transition-colors" />
            <p className="font-bold text-gray-600 group-hover:text-black transition-colors">Criar Coleção</p>
          </div>
        </button>
      </div>

      <Pagination page={page} totalPages={totalPages} total={totalItems} onPageChange={setPage} limit={PAGE_SIZE} />

      {/* FORM Modal */}
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

      {/* Confirm Bulk Modal */}
      <AlertModal
        isOpen={confirmBulk}
        onClose={() => setConfirmBulk(false)}
        title="Confirmar ação em massa"
        message={`Aplicar "${BULK_ACTIONS.find(a => a.value === bulkAction)?.label || bulkAction}" em ${selectedIds.length} coleção(ões)?`}
        type="warning"
        actionLabel="Confirmar"
        actionCallback={handleBulkExecute}
      />
    </div>
  );
}
