import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Plus, Trash2, Edit, Search, Hash, Star, Loader2, AlertTriangle, Filter, ChevronDown } from 'lucide-react';
import Modal from '../Modal';
import AlertModal from '../AlertModal';
import Pagination from './Pagination';
import { api } from '../../services/api';
import { resolveImageUrl } from '../../utils/resolveImageUrl';
import { useToast } from '../../context/ToastContext';

const AVAILABLE_SIZES = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG'];
const inputCls = 'w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg outline-none focus:border-zinc-500 transition-colors text-white placeholder-zinc-500';
const PAGE_SIZE = 15;

const generateSku = (productName, size) => {
  if (!productName) return '';
  const base = productName.toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join('-');
  return size ? `${base}-${size}` : base;
};

export default function Products() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', price: '', category: '', sku: '', description: '',
    status: 'ativo', featured: false,
  });
  const [variations, setVariations] = useState([{ size: 'M', sku: '', stock: '' }]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [edited, setEdited] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const initialFormRef = useRef(null);

  // Bulk actions
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [confirmBulk, setConfirmBulk] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const mapProduct = useCallback((p) => ({
    id: p.id_produto, name: p.nome_produto, price: Number(p.preco),
    categoryId: p.id_categoria, category: p.categoria?.nome_categoria || '',
    description: p.descricao || '',
    sku: Array.isArray(p.variacoes_estoque) && p.variacoes_estoque[0] ? p.variacoes_estoque[0].sku : '',
    qty: Array.isArray(p.variacoes_estoque) ? p.variacoes_estoque.reduce((s, v) => s + (v.estoque || 0), 0) : 0,
    status: p.status || 'ativo', featured: p.destaque === true,
    fotos: p.fotos || [], variacoes_estoque: p.variacoes_estoque || [],
  }), []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: PAGE_SIZE });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (filterCategory !== 'all') params.set('category', filterCategory);
      if (filterStatus !== 'all') params.set('status', filterStatus);

      const res = await api.get(`/products?${params}`);
      if (res.data?.data) {
        setProducts(res.data.data.map(mapProduct));
        setTotalProducts(res.data.total);
        setTotalPages(res.data.totalPages);
      } else {
        setProducts((res.data || []).map(mapProduct));
      }
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filterCategory, filterStatus, mapProduct, toast]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    api.get('/categories').then(res => {
      setCategories((res.data || []).map(c => ({ id: c.id_categoria, nome: c.nome_categoria })));
    }).catch(() => {
      toast.error('Erro ao carregar categorias');
    });
  }, []);

  // Reset filters
  const handleResetFilters = useCallback(() => {
    setFilterCategory('all');
    setFilterStatus('all');
    setSearchTerm('');
    setPage(1);
  }, []);

  const hasActiveFilters = filterCategory !== 'all' || filterStatus !== 'all' || debouncedSearch;

  const resetForm = useCallback(() => {
    setFormData({ name: '', price: '', category: '', sku: '', description: '', status: 'ativo', featured: false });
    setVariations([{ size: 'M', sku: '', stock: '' }]);
    setUploadFiles([]);
    setExistingPhotos([]);
    setFormErrors({});
    setEdited(false);
    initialFormRef.current = null;
  }, []);

  const markEdited = useCallback(() => { setEdited(true); }, []);

  const handleCloseForm = useCallback(() => {
    if (edited) { setConfirmClose(true); return; }
    setShowForm(false); setEditingId(null); resetForm();
  }, [edited, resetForm]);

  const validateForm = useCallback(() => {
    const e = {};
    if (!formData.name.trim()) e.name = 'Nome é obrigatório';
    if (!formData.price || Number(formData.price) <= 0) e.price = 'Preço deve ser maior que zero';
    if (!formData.category) e.category = 'Selecione uma categoria';
    const sizes = variations.filter(v => v.size).map(v => v.size);
    if (new Set(sizes).size !== sizes.length) e.variations = 'Tamanhos duplicados nas variações';
    if (variations.some(v => !v.size)) e.variations = 'Todas as variações precisam de tamanho';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  }, [formData, variations]);

  const handleAddProduct = useCallback(async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload = {
        nome_produto: formData.name, descricao: formData.description || '',
        preco: Number(formData.price || 0), id_categoria: Number(formData.category),
        tipo: 'Produto', status: formData.status, destaque: formData.featured,
        variacoes_estoque: variations.map(v => ({
          tamanho: v.size, sku: v.sku, estoque: Number(v.stock || 0),
          preco: Number(v.price || formData.price || 0),
        })),
      };

      if (uploadFiles && uploadFiles.length > 0) {
        const fd = new FormData();
        uploadFiles.forEach(f => fd.append('photos', f));
        const up = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        const newFotos = up.data.map(fi => ({ url: fi.url, descricao: fi.descricao }));
        // Combine existing photos with new uploads
        if (editingId) {
          payload.fotos = [
            ...existingPhotos.map(f => ({ id_foto: f.id_foto, url: f.url, descricao: f.descricao, principal: f.principal })),
            ...newFotos,
          ];
        } else {
          payload.fotos = newFotos;
        }
      } else if (editingId) {
        // Always send existing photos to prevent accidental deletion
        payload.fotos = existingPhotos.map(f => ({ id_foto: f.id_foto, url: f.url, descricao: f.descricao, principal: f.principal }));
      }

      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        toast.success('Produto atualizado com sucesso');
      } else {
        await api.post('/products', payload);
        toast.success('Produto criado com sucesso');
      }

      setShowForm(false); setEditingId(null); resetForm();
      loadProducts();
    } catch (err) {
      console.error('Erro ao salvar produto:', err);
      const msg = err.response?.data?.error || 'Erro ao salvar';
      setFormErrors(prev => ({ ...prev, submit: msg }));
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }, [validateForm, formData, variations, uploadFiles, editingId, resetForm, loadProducts, toast]);

  const handleEditProduct = useCallback((p) => {
    const fd = { name: p.name, price: p.price, category: p.categoryId || '', sku: p.sku, description: p.description || '', status: p.status || 'ativo', featured: p.featured || false };
    setFormData(fd);
    const vars = (p.variacoes_estoque || []).map(v => ({
      size: v.tamanho || '', sku: v.sku || '', stock: v.estoque || 0, price: v.preco || '',
    }));
    setVariations(vars.length > 0 ? vars : [{ size: 'M', sku: '', stock: '' }]);
    setExistingPhotos(p.fotos || []);
    setUploadFiles([]);
    setEditingId(p.id);
    setShowForm(true);
    setEdited(false);
    setFormErrors({});
    initialFormRef.current = JSON.stringify(fd);
  }, []);

  const handleDeleteProduct = useCallback(async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/products/${confirmDelete}`);
      toast.success('Produto deletado');
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao deletar produto');
    }
    setConfirmDelete(null);
  }, [confirmDelete, loadProducts, toast]);

  const handleSetPrincipal = useCallback(async (productId, fotoId) => {
    try {
      await api.patch(`/products/${productId}/principal`, { id_foto: fotoId });
      setExistingPhotos(prev => prev.map(f => ({ ...f, principal: f.id_foto === fotoId })));
      toast.success('Foto principal atualizada');
    } catch (err) {
      toast.error('Erro ao definir foto principal');
    }
  }, [toast]);

  const handleAddVariation = useCallback(() => {
    setVariations(prev => [...prev, { size: '', sku: '', stock: '' }]);
    markEdited();
  }, [markEdited]);

  const handleVariationChange = useCallback((index, field, value) => {
    setVariations(prev => {
      const n = [...prev];
      n[index] = { ...n[index], [field]: value };
      if (field === 'size') {
        n[index].sku = generateSku(formData.name, value);
      }
      return n;
    });
    markEdited();
  }, [markEdited, formData.name]);

  const handleRemoveVariation = useCallback((index) => {
    setVariations(prev => prev.filter((_, i) => i !== index));
    markEdited();
  }, [markEdited]);

  // Bulk actions
  const allSelected = products.length > 0 && selectedIds.length === products.length;
  const toggleSelectAll = useCallback(() => {
    setSelectedIds(allSelected ? [] : products.map(p => p.id));
  }, [allSelected, products]);

  const toggleSelect = useCallback((id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const BULK_ACTIONS = useMemo(() => [
    { value: 'ativar', label: 'Ativar selecionados' },
    { value: 'desativar', label: 'Desativar selecionados' },
    { value: 'ocultar', label: 'Ocultar selecionados' },
    { value: 'destacar', label: 'Destacar selecionados' },
    { value: 'remover_destaque', label: 'Remover destaque' },
  ], []);

  const handleBulkAction = useCallback(async () => {
    if (!bulkAction || selectedIds.length === 0) return;
    try {
      const res = await api.patch('/products/bulk-update', { ids: selectedIds, action: bulkAction });
      toast.success(res.data?.message || 'Ação executada');
      setSelectedIds([]);
      setBulkAction('');
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro na ação em lote');
    }
    setConfirmBulk(false);
  }, [bulkAction, selectedIds, loadProducts, toast]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* FORM MODAL */}
      <Modal isOpen={showForm} onClose={handleCloseForm} title={editingId ? 'Editar Produto' : 'Adicionar Novo Produto'} size="lg">
        <div className="space-y-6">
          {formErrors.submit && (
            <div className="bg-red-950 border border-red-800 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <AlertTriangle size={16} /> {formErrors.submit}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block text-zinc-300">Nome do Produto *</label>
              <input type="text" value={formData.name}
                onChange={(e) => {
                  const newName = e.target.value;
                  setFormData(f => ({ ...f, name: newName }));
                  setVariations(prev => prev.map(v => ({ ...v, sku: generateSku(newName, v.size) })));
                  markEdited();
                }}
                placeholder="Ex: Camiseta Boxy Off-White" className={inputCls} />
              {formErrors.name && <p className="text-xs text-red-400 mt-1">{formErrors.name}</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block text-zinc-300">Preço Base (R$) *</label>
              <input type="number" min="0" step="0.01" value={formData.price}
                onChange={(e) => { setFormData({ ...formData, price: e.target.value }); markEdited(); }}
                className={inputCls} />
              {formErrors.price && <p className="text-xs text-red-400 mt-1">{formErrors.price}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block text-zinc-300">Categoria *</label>
              <select value={formData.category}
                onChange={(e) => { setFormData({ ...formData, category: e.target.value }); markEdited(); }}
                className={`${inputCls}`}>
                <option value="">Selecione...</option>
                {categories.map(c => (<option key={c.id} value={c.id}>{c.nome}</option>))}
              </select>
              {formErrors.category && <p className="text-xs text-red-400 mt-1">{formErrors.category}</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block text-zinc-300">Status</label>
              <select value={formData.status}
                onChange={(e) => { setFormData({ ...formData, status: e.target.value }); markEdited(); }}
                className={`${inputCls}`}>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer pb-2">
                <input type="checkbox" checked={formData.featured}
                  onChange={(e) => { setFormData({ ...formData, featured: e.target.checked }); markEdited(); }}
                  className="w-4 h-4" />
                <span className="text-sm font-medium text-zinc-300">Produto Destaque</span>
              </label>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block text-zinc-300">Descrição</label>
            <textarea value={formData.description || ''}
              onChange={(e) => { setFormData({ ...formData, description: e.target.value }); markEdited(); }}
              placeholder="Descrição do produto..." rows={3} className={`${inputCls} resize-none`} />
          </div>

          {/* FOTOS */}
          <div className="border-t border-zinc-800 pt-6">
            <label className="text-sm font-bold mb-3 block text-zinc-300">Fotos do Produto</label>
            {editingId && existingPhotos.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-zinc-500 mb-2">Fotos atuais — clique na ⭐ para definir como principal</p>
                <div className="flex gap-3 flex-wrap">
                  {existingPhotos.map(f => (
                    <div key={f.id_foto} className="relative group">
                      <img src={resolveImageUrl(f.url)} alt={f.descricao || ''} className="w-20 h-20 object-cover rounded-lg border border-zinc-700" />
                      <button type="button" onClick={() => handleSetPrincipal(editingId, f.id_foto)}
                        className={`absolute -top-2 -right-2 p-1 rounded-full border transition-colors ${f.principal ? 'bg-yellow-400 border-yellow-500 text-white' : 'bg-zinc-800 border-zinc-600 text-zinc-400 hover:text-yellow-400 hover:border-yellow-400'}`}
                        title={f.principal ? 'Foto principal' : 'Definir como principal'}>
                        <Star size={12} fill={f.principal ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <input type="file" multiple accept="image/*"
              onChange={(e) => { setUploadFiles(Array.from(e.target.files)); markEdited(); }}
              className="text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700" />
            {uploadFiles.length > 0 && <p className="text-xs text-zinc-500 mt-2">{uploadFiles.length} arquivo(s) selecionado(s)</p>}
          </div>

          {/* VARIAÇÕES */}
          <div className="border-t border-zinc-800 pt-6">
            <label className="text-sm font-bold flex items-center gap-2 mb-4 text-zinc-300">
              <Hash size={16} className="text-zinc-500" /> Variações e SKUs
            </label>
            {formErrors.variations && (
              <p className="text-xs text-red-400 mb-3 flex items-center gap-1"><AlertTriangle size={12} />{formErrors.variations}</p>
            )}
            <div className="space-y-3">
              {variations.map((v, i) => (
                <div key={i} className="flex gap-2 items-end bg-zinc-800 p-3 rounded-lg border border-zinc-700">
                  <div className="w-20">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase mb-1 block">Tamanho</label>
                    <select value={v.size} onChange={(e) => handleVariationChange(i, 'size', e.target.value)}
                      className="w-full p-2 bg-zinc-700 border border-zinc-600 rounded text-center font-bold text-sm text-white">
                      <option value="">—</option>
                      {AVAILABLE_SIZES.map(s => (<option key={s} value={s}>{s}</option>))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase mb-1 block">SKU</label>
                    <input type="text" value={v.sku} onChange={(e) => handleVariationChange(i, 'sku', e.target.value)}
                      placeholder="Ex: SRF-CAM-BOXY-M" className="w-full p-2 bg-zinc-700 border border-zinc-600 rounded font-mono text-sm uppercase text-white" />
                  </div>
                  <div className="w-24">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase mb-1 block">Estoque</label>
                    <input type="number" value={v.stock} onChange={(e) => handleVariationChange(i, 'stock', e.target.value)}
                      className="w-full p-2 bg-zinc-700 border border-zinc-600 rounded text-sm text-white" />
                  </div>
                  {variations.length > 1 && (
                    <button onClick={() => handleRemoveVariation(i)} className="p-2 text-red-400 hover:bg-red-950 rounded transition-colors">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={handleAddVariation}
              className="mt-3 flex items-center gap-2 bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg text-xs font-bold hover:bg-zinc-700 transition-colors border border-zinc-700">
              <Plus size={14} /> Adicionar Variação
            </button>
          </div>

          <div className="flex gap-2 pt-4 border-t border-zinc-800">
            <button onClick={handleAddProduct} disabled={saving}
              className="flex-1 bg-white text-black py-3 font-bold hover:bg-zinc-200 transition-colors rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
              {saving && <Loader2 size={16} className="animate-spin" />}
              {saving ? 'Salvando...' : editingId ? 'Atualizar Produto' : 'Criar Produto'}
            </button>
            <button onClick={handleCloseForm}
              className="px-6 py-3 border border-zinc-700 font-bold text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors rounded-lg">
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

      {/* CONFIRM CLOSE WITH UNSAVED CHANGES */}
      <AlertModal isOpen={confirmClose} onClose={() => setConfirmClose(false)}
        title="Alterações não salvas"
        message="Você tem alterações não salvas. Deseja realmente fechar?"
        type="warning" actionLabel="Fechar sem salvar"
        actionCallback={() => { setConfirmClose(false); setShowForm(false); setEditingId(null); resetForm(); }} />

      {/* CONFIRM DELETE */}
      <AlertModal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)}
        title="Deletar produto"
        message="Tem certeza que deseja deletar este produto? Esta ação não pode ser desfeita."
        type="warning" actionLabel="Deletar"
        actionCallback={handleDeleteProduct} />

      {/* CONFIRM BULK */}
      <AlertModal isOpen={confirmBulk} onClose={() => setConfirmBulk(false)}
        title="Ação em lote"
        message={`Aplicar "${BULK_ACTIONS.find(a => a.value === bulkAction)?.label || bulkAction}" em ${selectedIds.length} produto(s)?`}
        type="warning" actionLabel="Confirmar"
        actionCallback={handleBulkAction} />

      {/* HEADER + FILTERS */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800 space-y-4">
          <div className="flex gap-4 justify-between items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input type="text" placeholder="Buscar por nome..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:border-zinc-500 outline-none text-white placeholder-zinc-500" />
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-bold transition-colors ${hasActiveFilters ? 'border-white bg-white text-black' : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'}`}>
              <Filter size={16} /> Filtros {hasActiveFilters && <span className="bg-black text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">{[filterCategory !== 'all', filterStatus !== 'all'].filter(Boolean).length}</span>}
            </button>
            <button onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-2 bg-white text-black px-6 py-2 rounded-lg font-bold hover:bg-zinc-200 transition-colors">
              <Plus size={18} /> Novo Produto
            </button>
          </div>

          {showFilters && (
            <div className="flex gap-4 items-end flex-wrap pt-2 border-t border-zinc-800">
              <div className="min-w-[160px]">
                <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Categoria</label>
                <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setPage(1); }}
                  className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white">
                  <option value="all">Todas</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div className="min-w-[140px]">
                <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Status</label>
                <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                  className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white">
                  <option value="all">Todos</option>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
              {hasActiveFilters && (
                <button onClick={handleResetFilters} className="text-xs text-zinc-500 hover:text-white underline pb-2">Limpar filtros</button>
              )}
            </div>
          )}

          {/* Bulk Actions Bar */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3 bg-zinc-800 p-3 rounded-lg border border-zinc-700">
              <span className="text-sm font-bold text-zinc-300">{selectedIds.length} selecionado(s)</span>
              <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)}
                className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white">
                <option value="">Ação em lote...</option>
                {BULK_ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
              <button onClick={() => { if (bulkAction) setConfirmBulk(true); }}
                disabled={!bulkAction}
                className="px-4 py-2 bg-white text-black rounded-lg text-sm font-bold disabled:opacity-30 hover:bg-zinc-200 transition-colors">
                Aplicar
              </button>
              <button onClick={() => setSelectedIds([])} className="text-xs text-zinc-500 hover:text-white ml-auto">
                Limpar seleção
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-800/50 text-xs font-bold uppercase text-zinc-500 border-b border-zinc-800">
                <th className="px-4 py-4 w-10">
                  <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="w-4 h-4" />
                </th>
                <th className="px-6 py-4">Produto</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Estoque</th>
                <th className="px-6 py-4">Preço</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Destaque</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                <tr><td colSpan={8} className="py-12 text-center text-zinc-500"><Loader2 size={24} className="animate-spin mx-auto" /></td></tr>
              ) : products.map((p) => (
                <tr key={p.id} className={`hover:bg-zinc-800/50 transition-colors ${selectedIds.includes(p.id) ? 'bg-zinc-800' : ''}`}>
                  <td className="px-4 py-4">
                    <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => toggleSelect(p.id)} className="w-4 h-4" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-sm text-white">{p.name}</div>
                    <div className="text-[10px] text-zinc-500 uppercase font-bold">{p.category}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono bg-zinc-800 px-2 py-1 rounded text-xs text-zinc-400 font-semibold border border-zinc-700">
                      {p.sku}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-medium text-sm ${p.qty === 0 ? 'text-red-600' : p.qty < 20 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {p.qty} un
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-white">R$ {String(p.price).replace('.', ',')}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${p.status === 'ativo' ? 'bg-emerald-950 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{p.featured ? '⭐' : '-'}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleEditProduct(p)} className="p-2 text-zinc-500 hover:text-white transition-colors">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => setConfirmDelete(p.id)} className="p-2 text-zinc-500 hover:text-red-400 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && products.length === 0 && (
          <div className="p-12 text-center text-zinc-500"><p>Nenhum produto encontrado.</p></div>
        )}

        <div className="px-6 pb-4">
          <Pagination page={page} totalPages={totalPages} total={totalProducts} limit={PAGE_SIZE} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
