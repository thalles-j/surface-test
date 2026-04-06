import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search, Plus, Filter, Edit2, Trash2, Image as ImageIcon, 
  ExternalLink, Save, X, Upload, ArrowUpAz, ArrowDownZa, 
  LayoutGrid, Info, Globe, Scale, Maximize, Loader2, Star
} from 'lucide-react';

// Assumindo que essas importações existem no seu projeto
import { api } from '../../services/api'; 
import { resolveImageUrl } from '../../utils/resolveImageUrl';
import { useToast } from '../../context/ToastContext';
import Pagination from './Pagination';

const AVAILABLE_SIZES = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG'];
const PAGE_SIZE = 15;

const generateSku = (productName, size) => {
  if (!productName) return '';
  const base = productName.toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9\s]/g, '')
    .trim().split(/\s+/).slice(0, 4).join('-');
  return size ? `${base}-${size}` : base;
};

export default function Catalog() {
  const toast = useToast();
  const fileInputRef = useRef(null);

  // --- ESTADOS DA API E DADOS ---
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // --- ESTADOS DE FILTROS ---
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("A-Z");
  
  // --- ESTADOS DE SELEÇÃO E MODAIS ---
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeModal, setActiveModal] = useState(null); 
  const [activeTab, setActiveTab] = useState('geral');
  const [targetId, setTargetId] = useState(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // --- ESTADOS DO FORMULÁRIO ---
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nome_produto: "", descricao: "", preco: "", id_categoria: "", status: "ativo", 
    oculto: false, destaque: false, sku: "", tags: "",
    peso: "", dimensoes: "", ficha_tecnica: "", seo_titulo: "", seo_descricao: ""
  });
  const [variations, setVariations] = useState([{ tamanho: 'M', sku: '', estoque: '' }]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  
  // Estado para controlar qual foto é a capa (isNew = se é upload novo ou existente, index = posição)
  const [coverData, setCoverData] = useState({ isNew: false, index: 0 });

  // --- LÓGICA DE BUSCA E API ---
  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data || []);
    } catch (err) {
      toast.error('Erro ao carregar categorias');
    }
  };

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: PAGE_SIZE });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (filterCategory !== 'all') params.set('category', filterCategory);
      if (filterStatus !== 'all') params.set('status', filterStatus);

      const res = await api.get(`/products?${params}`);
      
      let fetchedProducts = res.data?.data || res.data || [];
      fetchedProducts.sort((a, b) => {
        if (sortOrder === "A-Z") return a.nome_produto.localeCompare(b.nome_produto);
        if (sortOrder === "Z-A") return b.nome_produto.localeCompare(a.nome_produto);
        return 0;
      });

      setProducts(fetchedProducts);
      setTotalProducts(res.data?.total || fetchedProducts.length);
      setTotalPages(res.data?.totalPages || 1);
    } catch (err) {
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filterCategory, filterStatus, sortOrder, toast]);

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, [loadProducts]);

  // --- LÓGICA DO FORMULÁRIO ---
  const resetForm = () => {
    setFormData({
      nome_produto: "", descricao: "", preco: "", id_categoria: "", status: "ativo", 
      oculto: false, destaque: false, sku: "", tags: "",
      peso: "", dimensoes: "", ficha_tecnica: "", seo_titulo: "", seo_descricao: ""
    });
    setVariations([{ tamanho: 'M', sku: '', estoque: '' }]);
    setExistingPhotos([]);
    setUploadFiles([]);
    setPreviewUrls([]);
    setCoverData({ isNew: false, index: 0 });
    setEditingId(null);
    setActiveTab('geral');
  };

  const handleOpenEdit = (product = null) => {
    resetForm();
    if (product) {
      setEditingId(product.id_produto);
      setFormData({
        nome_produto: product.nome_produto,
        descricao: product.descricao || "",
        preco: product.preco,
        id_categoria: product.id_categoria,
        status: product.status,
        oculto: product.oculto || false,
        destaque: product.destaque || false,
        tags: product.tags || "",
        peso: product.peso || "",
        dimensoes: product.dimensoes || "",
        ficha_tecnica: product.ficha_tecnica || "",
        seo_titulo: product.seo_titulo || "",
        seo_descricao: product.seo_descricao || "",
        sku: Array.isArray(product.variacoes_estoque) && product.variacoes_estoque[0] ? product.variacoes_estoque[0].sku : ''
      });
      
      if (product.variacoes_estoque && product.variacoes_estoque.length > 0) {
        setVariations(product.variacoes_estoque.map(v => ({
          tamanho: v.tamanho || '', sku: v.sku || '', estoque: v.estoque || 0
        })));
      }
      setExistingPhotos(product.fotos || []);
    }
    setActiveModal('edit');
  };

  // --- GERENCIAMENTO DE FOTOS NO MODAL ---
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setUploadFiles(prev => [...prev, ...files]);
    
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => {
      const nextPreviews = [...prev, ...newPreviews];
      // Se não havia fotos antes, define a primeira enviada como capa
      if (existingPhotos.length === 0 && prev.length === 0) {
        setCoverData({ isNew: true, index: 0 });
      }
      return nextPreviews;
    });
  };

  const removeUploadFile = (index) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });

    // Ajusta o ponteiro da foto de capa se a foto deletada era a capa
    if (coverData.isNew) {
      if (coverData.index === index) {
        setCoverData({ isNew: false, index: 0 }); // Retorna para a primeira existente (fallback)
      } else if (coverData.index > index) {
        setCoverData({ isNew: true, index: coverData.index - 1 });
      }
    }
  };

  const handleRemoveExistingPhoto = (index) => {
    setExistingPhotos(prev => prev.filter((_, i) => i !== index));
    
    // Ajusta o ponteiro da foto de capa
    if (!coverData.isNew) {
      if (coverData.index === index) {
        setCoverData({ isNew: false, index: 0 }); // Define a próxima como capa
      } else if (coverData.index > index) {
        setCoverData({ isNew: false, index: coverData.index - 1 });
      }
    }
  };

  // --- SALVAR PRODUTO ---
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.nome_produto || !formData.preco || !formData.id_categoria) {
      toast.error("Preencha os campos obrigatórios (Nome, Preço, Categoria)");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        preco: Number(formData.preco),
        id_categoria: Number(formData.id_categoria),
        peso: formData.peso ? Number(formData.peso) : null,
        tipo: 'Produto',
        variacoes_estoque: variations.map(v => ({
          tamanho: v.tamanho, sku: v.sku, estoque: Number(v.estoque || 0), preco: Number(formData.preco)
        }))
      };

      // 1. Fazer upload das novas fotos (se houver)
      let newFotosMapped = [];
      if (uploadFiles && uploadFiles.length > 0) {
        const fd = new FormData();
        uploadFiles.forEach(f => fd.append('photos', f));
        const up = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        newFotosMapped = up.data.map(fi => ({ url: fi.url, descricao: fi.descricao }));
      }

      // 2. Juntar fotos existentes e novas
      let finalFotos = editingId ? [...existingPhotos] : [];
      finalFotos = [...finalFotos, ...newFotosMapped];

      // 3. Organizar o Array para colocar a Capa na primeira posição (índice 0)
      let coverElementIndex = coverData.isNew ? existingPhotos.length + coverData.index : coverData.index;
      
      if (coverElementIndex >= 0 && coverElementIndex < finalFotos.length) {
        const [coverEl] = finalFotos.splice(coverElementIndex, 1);
        finalFotos.unshift(coverEl); // Coloca no topo
      }

      // Opcional: Garante que a propriedade 'principal' esteja setada na primeira foto
      finalFotos = finalFotos.map((f, i) => ({ ...f, principal: i === 0 }));
      
      payload.fotos = finalFotos;

      // 4. Salvar
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        toast.success('Produto atualizado com sucesso');
      } else {
        await api.post('/products', payload);
        toast.success('Produto criado com sucesso');
      }

      setActiveModal(null);
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar produto');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/products/${targetId}`);
      toast.success('Produto removido com sucesso');
      setActiveModal(null);
      loadProducts();
    } catch (err) {
      toast.error('Erro ao deletar produto');
    }
  };

  const handleBulkAction = async (action) => {
    try {
      await api.patch('/products/bulk-update', { ids: selectedIds, action });
      toast.success('Ação em lote aplicada');
      setSelectedIds([]);
      loadProducts();
    } catch (err) {
      toast.error('Erro na ação em lote');
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/products/${id}`)));
      toast.success('Produtos removidos com sucesso');
      setSelectedIds([]);
      setIsBulkDeleteModalOpen(false);
      loadProducts();
    } catch (err) {
      toast.error('Erro ao deletar alguns produtos');
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-8 font-sans selection:bg-black selection:text-white">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-10">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase text-black">Catálogo de Produtos</h1>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Gestão de Inventário e Catálogo</p>
          </div>
          <div className="flex items-center gap-4 bg-white p-2 pr-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
               <div className="bg-black/5 w-full h-full" />
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-black uppercase leading-tight text-black">Admin System</p>
              <p className="text-[9px] text-gray-500 font-bold uppercase">Gerente</p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-grow shadow-sm rounded-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text"
              placeholder="Pesquisar por nome ou SKU..."
              className="w-full bg-white border border-gray-200 text-gray-900 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-black transition-all text-sm font-bold placeholder-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => setActiveModal('filters')}
              className={`flex items-center gap-2 px-6 py-4 bg-white border rounded-2xl hover:bg-gray-50 transition-all font-bold uppercase text-[10px] tracking-widest shadow-sm ${(filterCategory !== 'all' || filterStatus !== 'all') ? 'border-black text-black' : 'border-gray-200 text-gray-500'}`}
            >
              <Filter size={16} />
              Filtros
            </button>
            <button 
              onClick={() => handleOpenEdit()}
              className="flex items-center gap-2 px-8 py-4 bg-black text-white rounded-2xl hover:bg-gray-800 transition-all font-black uppercase text-[10px] tracking-widest shadow-lg shadow-black/5"
            >
              <Plus size={18} /> Novo Produto
            </button>
          </div>
        </div>

        {/* Tabela de Produtos */}
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
          
          {/* BARRA DE AÇÕES EM MASSA (No topo da tabela) */}
          {selectedIds.length > 0 && (
            <div className="bg-blue-50/60 border-b border-gray-200 px-6 py-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-4">
                <span className="font-black text-sm uppercase tracking-tighter text-blue-900">
                  {selectedIds.length} selecionados
                </span>
                <div className="h-4 w-px bg-blue-200" />
                <div className="flex items-center gap-2">
                  <button onClick={() => handleBulkAction('ativar')} className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase hover:bg-gray-50 transition-colors shadow-sm">Ativar</button>
                  <button onClick={() => handleBulkAction('desativar')} className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase hover:bg-gray-50 transition-colors shadow-sm">Inativar</button>
                  <button onClick={() => handleBulkAction('mostrar')} className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase hover:bg-gray-50 transition-colors shadow-sm">Mostrar</button>
                  <button onClick={() => handleBulkAction('ocultar')} className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase hover:bg-gray-50 transition-colors shadow-sm">Ocultar</button>
                  <button onClick={() => setSelectedIds([])} className="text-gray-400 hover:text-gray-700 ml-2 transition-colors" title="Limpar seleção"><X size={16}/></button>
                </div>
              </div>
              <div>
                <button onClick={() => setIsBulkDeleteModalOpen(true)} className="flex items-center justify-center p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Excluir selecionados">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 text-[10px] uppercase tracking-[0.2em] font-black bg-gray-50/50">
                  <th className="p-6 w-12 text-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer transition-colors"
                      checked={products.length > 0 && selectedIds.length === products.length}
                      onChange={(e) => setSelectedIds(e.target.checked ? products.map(p => p.id_produto) : [])}
                    />
                  </th>
                  <th className="p-6">Produto / ID</th>
                  <th className="p-6">SKU Principal</th>
                  <th className="p-6 text-center">Link Estoque</th>
                  <th className="p-6 text-center">Preço (R$)</th>
                  <th className="p-6 text-center">Status</th>
                  <th className="p-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={7} className="p-12 text-center"><Loader2 className="animate-spin text-gray-400 mx-auto" size={24}/></td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan={7} className="p-12 text-center text-gray-400 font-bold text-sm uppercase tracking-widest">Nenhum produto encontrado</td></tr>
                ) : products.map(product => {
                  const sku = Array.isArray(product.variacoes_estoque) && product.variacoes_estoque[0] ? product.variacoes_estoque[0].sku : product.sku || '-';
                  const isSelected = selectedIds.includes(product.id_produto);
                  
                  return (
                  <tr 
                    key={product.id_produto} 
                    className={`transition-colors group ${
                      isSelected 
                        ? 'bg-blue-50/30' 
                        : product.oculto 
                          ? 'bg-gray-100 opacity-60 hover:opacity-100 hover:bg-gray-200/50' 
                          : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="p-6 text-center">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleSelection(product.id_produto)}
                        className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer transition-colors"
                      />
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 group-hover:border-gray-300 transition-all relative">
                          {product.fotos?.[0] ? (
                            <img src={resolveImageUrl(product.fotos[0].url || product.fotos[0])} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon size={20} /></div>
                          )}
                        </div>
                        <div>
                          <p className="flex items-center gap-2 text-gray-500 text-[9px] font-mono font-bold">
                            #{product.id_produto} 
                            {product.destaque && <span className="text-yellow-500 text-xs">★</span>}
                            {product.oculto && <span className="bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded text-[8px] uppercase font-black tracking-widest">Oculto</span>}
                          </p>
                          <p className="text-gray-900 font-black text-sm uppercase tracking-tight line-clamp-1">{product.nome_produto}</p>
                          <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">{product.categoria?.nome_categoria || 'Sem categoria'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 font-mono text-[10px] text-gray-500 font-bold">{sku}</td>
                    <td className="p-6 text-center">
                      <a 
                        href={`/estoque?produto=${product.id_produto}`} 
                        className="inline-flex items-center gap-2 text-blue-600 font-black text-xs hover:text-blue-500 hover:underline transition-all uppercase tracking-widest"
                      >
                        Estoque <ExternalLink size={12} />
                      </a>
                    </td>
                    <td className="p-6 text-center font-black text-sm tabular-nums text-gray-900">
                      {Number(product.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-6 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        product.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenEdit(product)} className="p-2 bg-white text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-all border border-gray-200">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => {setTargetId(product.id_produto); setActiveModal('delete');}} className="p-2 bg-white text-gray-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 rounded-lg transition-all border border-gray-200">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
          
          {/* Paginação */}
          {totalPages > 1 && (
            <div className="p-6 border-t border-gray-200 bg-gray-50/50">
              <Pagination page={page} totalPages={totalPages} total={totalProducts} limit={PAGE_SIZE} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>

      {/* Modal de Filtros */}
      {activeModal === 'filters' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-gray-200 rounded-[2rem] w-full max-w-md p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black uppercase tracking-tighter text-gray-900">Filtros</h3>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-black transition-colors"><X size={24} /></button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Categoria</label>
                <select className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs outline-none font-bold text-gray-900 focus:border-black transition-colors" value={filterCategory} onChange={(e)=>setFilterCategory(e.target.value)}>
                  <option value="all">Todas</option>
                  {categories.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nome_categoria}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {['all', 'ativo', 'inativo'].map(s => (
                    <button key={s} onClick={()=>setFilterStatus(s)} className={`p-3 rounded-xl text-[10px] font-black border uppercase transition-colors ${filterStatus===s?'bg-black text-white border-black':'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}>{s === 'all' ? 'Todos' : s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Ordem</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={()=>setSortOrder('A-Z')} className={`flex items-center justify-center gap-2 p-3 rounded-xl text-[10px] font-black border uppercase transition-colors ${sortOrder==='A-Z'?'bg-black text-white border-black':'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}><ArrowUpAz size={16}/> A-Z</button>
                  <button onClick={()=>setSortOrder('Z-A')} className={`flex items-center justify-center gap-2 p-3 rounded-xl text-[10px] font-black border uppercase transition-colors ${sortOrder==='Z-A'?'bg-black text-white border-black':'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}><ArrowDownZa size={16}/> Z-A</button>
                </div>
              </div>
            </div>
            <button onClick={() => { setPage(1); setActiveModal(null); loadProducts(); }} className="w-full mt-10 py-4 bg-black text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-800 transition-colors shadow-lg">Aplicar</button>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {activeModal === 'edit' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in zoom-in-95">
          <div className="bg-white border border-gray-200 rounded-[2rem] w-full max-w-4xl my-auto shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-white text-black">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                  {editingId ? 'Configurar Produto' : 'Novo Produto'}
                  {editingId && formData.destaque && <Star className="text-yellow-500" fill="currentColor" size={20}/>}
                </h2>
                <p className="text-[10px] text-gray-500 font-mono font-bold mt-1 uppercase">Sincronização com Prisma BD</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-black"><X size={24} /></button>
            </div>

            <div className="flex gap-2 px-6 pt-2 bg-gray-50 border-b border-gray-200 overflow-x-auto custom-scrollbar">
              {[
                {id: 'geral', icon: <LayoutGrid size={14}/>, label: 'Geral & Variáveis'},
                {id: 'tecnico', icon: <Scale size={14}/>, label: 'Ficha Técnica'},
                {id: 'seo', icon: <Globe size={14}/>, label: 'Marketing / SEO'}
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-3 px-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${
                    activeTab === tab.id ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-700'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
            
            <form id="productForm" onSubmit={handleSave} className="flex-grow overflow-y-auto p-6 md:p-8 custom-scrollbar bg-white">
              
              {/* ABA: GERAL */}
              {activeTab === 'geral' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nome do Produto *</label>
                      <input required type="text" className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-2xl p-3 focus:border-black outline-none text-sm font-bold transition-colors" 
                        value={formData.nome_produto} 
                        onChange={(e)=>{
                          const val = e.target.value;
                          setFormData({...formData, nome_produto: val});
                          setVariations(prev => prev.map(v => ({...v, sku: generateSku(val, v.tamanho)})));
                        }} 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Preço (R$) *</label>
                        <input required type="number" step="0.01" className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-2xl p-3 focus:border-black outline-none font-black text-base transition-colors" value={formData.preco} onChange={(e)=>setFormData({...formData, preco: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Categoria *</label>
                         <select required className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-2xl p-3 focus:border-black outline-none font-bold text-sm transition-colors" value={formData.id_categoria} onChange={(e)=>setFormData({...formData, id_categoria: e.target.value})}>
                          <option value="">Selecione...</option>
                          {categories.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nome_categoria}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest font-mono">Descrição Curta</label>
                      <textarea rows="2" className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-2xl p-3 focus:border-black outline-none resize-none text-sm transition-colors" value={formData.descricao} onChange={(e)=>setFormData({...formData, descricao: e.target.value})} />
                    </div>

                    <div className="space-y-3 p-5 bg-gray-50 rounded-3xl border border-gray-200">
                      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-900">Grade & SKUs</p>
                          <p className="text-[9px] text-gray-500 font-bold uppercase">Gerencie os tamanhos</p>
                        </div>
                        <button type="button" onClick={() => setVariations([...variations, { tamanho: '', sku: '', estoque: 0 }])} className="flex items-center gap-1 bg-black text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase hover:bg-gray-800 transition-colors">
                          <Plus size={12}/> Add
                        </button>
                      </div>
                      
                      <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-2">
                        {variations.map((v, i) => (
                          <div key={i} className="flex gap-2 items-center bg-white p-2.5 rounded-2xl border border-gray-200 shadow-sm">
                            <div className="w-20">
                              <select className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-2 text-xs font-bold outline-none text-center transition-colors focus:border-black"
                                value={v.tamanho} onChange={(e) => {
                                  const newSize = e.target.value;
                                  const newVars = [...variations];
                                  newVars[i] = { ...newVars[i], tamanho: newSize, sku: generateSku(formData.nome_produto, newSize) };
                                  setVariations(newVars);
                                }}
                              >
                                <option value="">—</option>
                                {AVAILABLE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                            <div className="flex-1">
                              <input type="text" placeholder="SKU" className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-2 font-mono text-[10px] uppercase outline-none transition-colors focus:border-black" 
                                value={v.sku} onChange={(e) => {
                                  const newVars = [...variations];
                                  newVars[i].sku = e.target.value;
                                  setVariations(newVars);
                                }} 
                              />
                            </div>
                            {variations.length > 1 && (
                              <button type="button" onClick={() => setVariations(variations.filter((_, idx) => idx !== i))} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                                <Trash2 size={14}/>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {/* Upload e Gerenciamento de Fotos */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Fotos do Produto (Escolha a Capa)</label>
                      <div className="grid grid-cols-4 gap-2">
                        {/* Renderiza as fotos existentes (já salvas no DB) */}
                        {existingPhotos.map((foto, i) => {
                          const isCover = !coverData.isNew && coverData.index === i;
                          return (
                          <div key={foto.id_foto || i} className={`aspect-square rounded-2xl border-2 ${isCover ? 'border-yellow-400 shadow-md' : 'border-gray-200'} overflow-hidden relative group bg-gray-100`}>
                            <img src={resolveImageUrl(foto.url || foto)} className="w-full h-full object-cover" alt="" />
                            
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
                              <button type="button" onClick={() => setCoverData({ isNew: false, index: i })} className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-colors" title="Definir como capa">
                                <Star size={16} className={isCover ? 'fill-yellow-400 text-yellow-400' : ''} />
                              </button>
                              <button type="button" onClick={() => handleRemoveExistingPhoto(i)} className="p-2 bg-red-500/80 hover:bg-red-600 rounded-full text-white backdrop-blur-sm transition-colors" title="Remover foto">
                                <Trash2 size={16} />
                              </button>
                            </div>

                            {isCover && (
                              <span className="absolute bottom-2 left-2 bg-yellow-400 text-black px-2 py-0.5 rounded text-[8px] font-black uppercase shadow-sm flex items-center gap-1">
                                <Star size={8} fill="currentColor" /> Capa
                              </span>
                            )}
                          </div>
                        )})}
                        
                        {/* Renderiza as fotos novas em staging */}
                        {previewUrls.map((url, i) => {
                          const isCover = coverData.isNew && coverData.index === i;
                          return (
                          <div key={`new-${i}`} className={`aspect-square rounded-2xl border-2 ${isCover ? 'border-yellow-400 shadow-md' : 'border-green-400'} overflow-hidden relative group bg-gray-100`}>
                            <img src={url} className="w-full h-full object-cover" alt="" />
                            
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
                              <button type="button" onClick={() => setCoverData({ isNew: true, index: i })} className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-colors" title="Definir como capa">
                                <Star size={16} className={isCover ? 'fill-yellow-400 text-yellow-400' : ''} />
                              </button>
                              <button type="button" onClick={() => removeUploadFile(i)} className="p-2 bg-red-500/80 hover:bg-red-600 rounded-full text-white backdrop-blur-sm transition-colors" title="Remover foto">
                                <Trash2 size={16} />
                              </button>
                            </div>
                            
                            <span className={`absolute bottom-2 left-2 ${isCover ? 'bg-yellow-400 text-black' : 'bg-green-500 text-white'} px-2 py-0.5 rounded text-[8px] font-black uppercase shadow-sm flex items-center gap-1`}>
                              {isCover ? <><Star size={8} fill="currentColor" /> Capa</> : 'Novo'}
                            </span>
                          </div>
                        )})}

                        <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-gray-300 hover:border-black hover:bg-gray-50 flex flex-col items-center justify-center text-gray-500 hover:text-black transition-all cursor-pointer">
                          <Upload size={18} />
                          <span className="text-[8px] mt-1 uppercase font-black">Upload</span>
                        </button>
                        <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                      </div>
                    </div>

                    <div className="space-y-4 p-6 bg-gray-50 rounded-3xl border border-gray-200">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Status Público</label>
                        <select className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl p-3 text-xs outline-none font-bold transition-colors focus:border-black" value={formData.status} onChange={(e)=>setFormData({...formData, status: e.target.value})}>
                          <option value="ativo">Ativo - Visível na loja</option>
                          <option value="inativo">Inativo - Indisponível</option>
                        </select>
                      </div>
                      
                      <div className="h-px bg-gray-200" />
                      
                      <div className="space-y-4">
                        <label className="flex items-center justify-between cursor-pointer group">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-900 group-hover:text-yellow-600 transition-colors">Produto Destaque</span>
                            <span className="text-[8px] text-gray-500 font-bold uppercase">Exibir na vitrine principal</span>
                          </div>
                          <div className={`w-10 h-6 rounded-full p-1 transition-colors ${formData.destaque ? 'bg-yellow-500' : 'bg-gray-300'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${formData.destaque ? 'translate-x-4' : 'translate-x-0'} shadow-sm`} />
                          </div>
                          <input type="checkbox" className="hidden" checked={formData.destaque} onChange={(e)=>setFormData({...formData, destaque: e.target.checked})} />
                        </label>

                        <label className="flex items-center justify-between cursor-pointer group">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-900 group-hover:text-blue-600 transition-colors">Modo Oculto</span>
                            <span className="text-[8px] text-gray-500 font-bold uppercase">Apenas acessível via link direto</span>
                          </div>
                          <div className={`w-10 h-6 rounded-full p-1 transition-colors ${formData.oculto ? 'bg-blue-500' : 'bg-gray-300'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${formData.oculto ? 'translate-x-4' : 'translate-x-0'} shadow-sm`} />
                          </div>
                          <input type="checkbox" className="hidden" checked={formData.oculto} onChange={(e)=>setFormData({...formData, oculto: e.target.checked})} />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA: TÉCNICO */}
              {activeTab === 'tecnico' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-3xl mx-auto py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><Scale size={14}/> Peso (kg)</label>
                      <input type="number" step="0.001" placeholder="Ex: 0.250" className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-2xl p-4 focus:border-black outline-none font-bold text-lg transition-colors" value={formData.peso} onChange={(e)=>setFormData({...formData, peso: e.target.value})}/>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><Maximize size={14}/> Dimensões (CxLxA cm)</label>
                      <input type="text" placeholder="Ex: 30x20x10" className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-2xl p-4 focus:border-black outline-none font-bold text-lg uppercase transition-colors" value={formData.dimensoes} onChange={(e)=>setFormData({...formData, dimensoes: e.target.value})}/>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Ficha Técnica Completa</label>
                    <textarea rows="8" className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-2xl p-5 focus:border-black outline-none resize-none font-mono text-sm leading-relaxed transition-colors" placeholder="Ex: 100% Algodão, fio 30.1 penteado. Gola canelada..." value={formData.ficha_tecnica} onChange={(e)=>setFormData({...formData, ficha_tecnica: e.target.value})} />
                  </div>
                </div>
              )}

              {/* ABA: SEO */}
              {activeTab === 'seo' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-2xl mx-auto py-4">
                  <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl flex gap-4 text-blue-600 mb-4">
                    <Info size={24} className="flex-shrink-0" />
                    <p className="text-xs font-bold leading-relaxed">Estas informações são fundamentais para o ranqueamento no Google. O título e descrição aqui sobrescrevem o nome e descrição originais apenas nos resultados de busca.</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">SEO Meta Title</label>
                    <input type="text" placeholder="Recomendado: 50-60 caracteres" className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-2xl p-4 focus:border-black outline-none font-bold transition-colors" value={formData.seo_titulo} onChange={(e)=>setFormData({...formData, seo_titulo: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">SEO Meta Description</label>
                    <textarea rows="3" placeholder="Recomendado: 150-160 caracteres" className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-2xl p-4 focus:border-black outline-none resize-none text-sm transition-colors" value={formData.seo_descricao} onChange={(e)=>setFormData({...formData, seo_descricao: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Tags (Busca e Filtros Internos)</label>
                    <input type="text" placeholder="ex: camiseta, hype, drop1, preta" className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-2xl p-4 focus:border-black outline-none text-sm lowercase transition-colors" value={formData.tags} onChange={(e)=>setFormData({...formData, tags: e.target.value})} />
                  </div>
                </div>
              )}
            </form>

            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 rounded-b-[2rem]">
              <button type="button" onClick={() => setActiveModal(null)} className="px-8 py-3.5 rounded-2xl border border-gray-300 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-100 transition-colors">Cancelar</button>
              <button form="productForm" type="submit" disabled={saving} className="flex items-center justify-center gap-2 px-10 py-3.5 rounded-2xl bg-black text-white font-black uppercase text-[10px] tracking-widest hover:bg-gray-800 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]">
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {saving ? 'Salvando...' : 'Confirmar & Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmação de Exclusão Simples */}
      {activeModal === 'delete' && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in zoom-in-95">
          <div className="bg-white border border-red-100 rounded-[2rem] w-full max-w-md p-10 text-center shadow-2xl">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 size={36} className="text-red-500" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tighter mb-2 text-gray-900">Remover Produto?</h3>
            <p className="text-gray-500 text-sm mb-10 leading-relaxed uppercase font-bold tracking-tight">O item #{targetId} será deletado permanentemente da base de dados.</p>
            <div className="flex gap-4">
              <button onClick={() => setActiveModal(null)} className="flex-1 py-4 rounded-2xl border border-gray-200 text-[10px] font-black uppercase text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={handleDelete} className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-black uppercase text-[10px] hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20">Sim, Deletar</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmação de Exclusão em Massa */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in zoom-in-95">
          <div className="bg-white border border-red-100 rounded-[2rem] w-full max-w-md p-10 text-center shadow-2xl">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 size={36} className="text-red-600" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tighter mb-2 text-gray-900">Excluir {selectedIds.length} produtos?</h3>
            <p className="text-gray-500 text-sm mb-10 leading-relaxed uppercase font-bold tracking-tight">Esta ação não pode ser desfeita. Todos os itens selecionados serão deletados permanentemente.</p>
            <div className="flex gap-4">
              <button onClick={() => setIsBulkDeleteModalOpen(false)} className="flex-1 py-4 rounded-2xl border border-gray-200 text-[10px] font-black uppercase text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={handleBulkDelete} className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-black uppercase text-[10px] hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20">Sim, Excluir Todos</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
      `}</style>
    </div>
  );
}