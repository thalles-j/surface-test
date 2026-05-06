import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search, Plus, Filter, Edit2, Trash2, Image as ImageIcon, 
  ExternalLink, Save, X, Upload, ArrowUpAz, ArrowDownZa, 
  LayoutGrid, Info, Globe, Scale, Maximize, Loader2, Star
} from 'lucide-react';

// Importações com caminhos corrigidos
import { api } from '../../../services/api'; 
import { resolveImageUrl } from '../../../utils/resolveImageUrl';
import { useToast } from '../../../context/ToastContext';
import Pagination from '../Pagination/Pagination';

// Importação do CSS Module
import styles from './Products.module.css';

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
      
      // ADICIONE ESTA LINHA:
      // Isso avisa o backend para pular o filtro e trazer TUDO (incluindo ocultos)
      params.set('oculto', 'all'); 

      const res = await api.get(`/admin/products?${params}`);
      
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
        nome_produto: product.nome_produto ?? "",
        descricao: product.descricao ?? "",
        preco: product.preco ?? "",
        id_categoria: product.id_categoria ?? "",
        status: product.status ?? "ativo",
        oculto: product.oculto ?? false,
        destaque: product.destaque ?? false,
        tags: product.tags ?? "",
        peso: product.peso ?? "",
        dimensoes: product.dimensoes ?? "",
        ficha_tecnica: product.ficha_tecnica ?? "",
        seo_titulo: product.seo_titulo ?? "",
        seo_descricao: product.seo_descricao ?? "",
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

    if (coverData.isNew) {
      if (coverData.index === index) {
        setCoverData({ isNew: false, index: 0 });
      } else if (coverData.index > index) {
        setCoverData({ isNew: true, index: coverData.index - 1 });
      }
    }
  };

  const handleRemoveExistingPhoto = (index) => {
    setExistingPhotos(prev => prev.filter((_, i) => i !== index));
    
    if (!coverData.isNew) {
      if (coverData.index === index) {
        setCoverData({ isNew: false, index: 0 });
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

      let newFotosMapped = [];
      if (uploadFiles && uploadFiles.length > 0) {
        const fd = new FormData();
        uploadFiles.forEach(f => fd.append('photos', f));
        const up = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        newFotosMapped = up.data.map(fi => ({ url: fi.url, descricao: fi.descricao }));
      }

      let finalFotos = editingId ? [...existingPhotos] : [];
      finalFotos = [...finalFotos, ...newFotosMapped];

      let coverElementIndex = coverData.isNew ? existingPhotos.length + coverData.index : coverData.index;
      
      if (coverElementIndex >= 0 && coverElementIndex < finalFotos.length) {
        const [coverEl] = finalFotos.splice(coverElementIndex, 1);
        finalFotos.unshift(coverEl); 
      }

      finalFotos = finalFotos.map((f, i) => ({ ...f, principal: i === 0 }));
      payload.fotos = finalFotos;

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
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} size={20} />
            <input 
              type="text"
              placeholder="Pesquisar por nome ou SKU..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className={styles.toolbarButtons}>
            <button 
              onClick={() => setActiveModal('filters')}
              className={`${styles.btnFilter} ${(filterCategory !== 'all' || filterStatus !== 'all') ? styles.btnFilterActive : styles.btnFilterInactive}`}
            >
              <Filter size={16} />
              Filtros
            </button>
            <button 
              onClick={() => handleOpenEdit()}
              className={styles.btnPrimary}
            >
              <Plus size={18} /> Novo Produto
            </button>
          </div>
        </div>

        {/* Tabela de Produtos */}
        <div className={styles.tableCard}>
          
          {selectedIds.length > 0 && (
            <div className={styles.bulkActionBar}>
              <div className={styles.bulkLeft}>
                <span className={styles.bulkCount}>
                  {selectedIds.length} selecionados
                </span>
                <div className={styles.bulkDivider} />
                <div className={styles.bulkBtnGroup}>
                  <button onClick={() => handleBulkAction('ativar')} className={styles.btnBulk}>Ativar</button>
                  <button onClick={() => handleBulkAction('desativar')} className={styles.btnBulk}>Inativar</button>
                  <button onClick={() => handleBulkAction('mostrar')} className={styles.btnBulk}>Mostrar</button>
                  <button onClick={() => handleBulkAction('ocultar')} className={styles.btnBulk}>Ocultar</button>
                  <button onClick={() => setSelectedIds([])} className={styles.btnBulkClear} title="Limpar seleção"><X size={16}/></button>
                </div>
              </div>
              <div>
                <button onClick={() => setIsBulkDeleteModalOpen(true)} className={styles.btnBulkDelete} title="Excluir selecionados">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          )}

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead className={styles.tableHead}>
                <tr>
                  <th style={{ width: '3rem', textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      className={styles.checkbox}
                      checked={products.length > 0 && selectedIds.length === products.length}
                      onChange={(e) => setSelectedIds(e.target.checked ? products.map(p => p.id_produto) : [])}
                    />
                  </th>
                  <th>Produto / ID</th>
                  <th>SKU Principal</th>
                  <th style={{ textAlign: 'center' }}>Link Estoque</th>
                  <th style={{ textAlign: 'center' }}>Preço (R$)</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {loading ? (
                  <tr><td colSpan={7} className={styles.emptyState}><Loader2 className="animate-spin" style={{ margin: '0 auto' }} size={24}/></td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan={7} className={styles.emptyState}>Nenhum produto encontrado</td></tr>
                ) : products.map(product => {
                  const sku = Array.isArray(product.variacoes_estoque) && product.variacoes_estoque[0] ? product.variacoes_estoque[0].sku : product.sku || '-';
                  const isSelected = selectedIds.includes(product.id_produto);
                  
                  return (
                  <tr 
                    key={product.id_produto} 
                    className={[
                      styles.tableRow,
                      product.oculto ? styles.tableRowHidden : '',
                      isSelected ? styles.tableRowSelected : '',
                      !product.oculto && !isSelected ? styles.tableRowDefault : ''
                    ].filter(Boolean).join(' ')}
                  >
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleSelection(product.id_produto)}
                        className={styles.checkbox}
                      />
                    </td>
                    <td>
                      <div className={styles.productCell}>
                        <div className={styles.productImgWrapper}>
                          {product.fotos?.[0] ? (
                            <img src={resolveImageUrl(product.fotos[0].url || product.fotos[0])} className={styles.productImg} alt="" />
                          ) : (
                            <div className={styles.productImgPlaceholder}><ImageIcon size={20} /></div>
                          )}
                        </div>
                        <div>
                          <p className={styles.productId}>
                            #{product.id_produto} 
                            {product.destaque && <span style={{ color: '#eab308', fontSize: '0.75rem' }}>★</span>}
                            {product.oculto && <span className={styles.badgeHidden}>Oculto</span>}
                          </p>
                          <p className={styles.productName}>{product.nome_produto}</p>
                          <p className={styles.productCategory}>{product.categoria?.nome_categoria || 'Sem categoria'}</p>
                        </div>
                      </div>
                    </td>
                    <td className={styles.skuText}>{sku}</td>
                    <td style={{ textAlign: 'center' }}>
                      <a 
                        href={`/estoque?produto=${product.id_produto}`} 
                        className={styles.linkEstoque}
                      >
                        Estoque <ExternalLink size={12} />
                      </a>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={styles.priceText}>
                        {Number(product.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`${styles.statusBadge} ${
                        product.status === 'ativo' ? styles.statusActive : styles.statusInactive
                      }`}>
                        {product.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className={styles.actionsWrapper}>
                        <button onClick={() => handleOpenEdit(product)} className={`${styles.btnAction} ${styles.btnActionEdit}`}>
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => {setTargetId(product.id_produto); setActiveModal('delete');}} className={`${styles.btnAction} ${styles.btnActionDelete}`}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className={styles.paginationWrapper}>
              <Pagination page={page} totalPages={totalPages} total={totalProducts} limit={PAGE_SIZE} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>

      {/* Modal de Filtros */}
      {activeModal === 'filters' && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Filtros</h3>
              <button onClick={() => setActiveModal(null)} className={styles.modalClose}><X size={24} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label className={styles.label} style={{ marginBottom: '0.5rem' }}>Categoria</label>
                <select className={styles.input} value={filterCategory} onChange={(e)=>setFilterCategory(e.target.value)}>
                  <option value="all">Todas</option>
                  {categories.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nome_categoria}</option>)}
                </select>
              </div>
              <div>
                <label className={styles.label} style={{ marginBottom: '0.5rem' }}>Status</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {['all', 'ativo', 'inativo'].map(s => (
                    <button key={s} onClick={()=>setFilterStatus(s)} className={`${styles.btnFilter} ${filterStatus===s ? styles.btnFilterActive : styles.btnFilterInactive}`} style={{ padding: '0.75rem', justifyContent: 'center' }}>
                      {s === 'all' ? 'Todos' : s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={styles.label} style={{ marginBottom: '0.5rem' }}>Ordem</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button onClick={()=>setSortOrder('A-Z')} className={`${styles.btnFilter} ${sortOrder==='A-Z' ? styles.btnFilterActive : styles.btnFilterInactive}`} style={{ padding: '0.75rem', justifyContent: 'center' }}><ArrowUpAz size={16}/> A-Z</button>
                  <button onClick={()=>setSortOrder('Z-A')} className={`${styles.btnFilter} ${sortOrder==='Z-A' ? styles.btnFilterActive : styles.btnFilterInactive}`} style={{ padding: '0.75rem', justifyContent: 'center' }}><ArrowDownZa size={16}/> Z-A</button>
                </div>
              </div>
            </div>
            <button onClick={() => { setPage(1); setActiveModal(null); loadProducts(); }} className={styles.btnPrimary} style={{ width: '100%', marginTop: '2.5rem' }}>Aplicar</button>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {activeModal === 'edit' && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContentEdit}>
            
            <div className={styles.modalHeaderEdit}>
              <div>
                <h2 className={styles.modalTitleEdit}>
                  {editingId ? 'Configurar Produto' : 'Novo Produto'}
                  {editingId && formData.destaque && <Star style={{ color: '#eab308' }} fill="currentColor" size={20}/>}
                </h2>
                <p className={styles.modalSubtitleEdit}>Sincronização com Prisma BD</p>
              </div>
              <button onClick={() => setActiveModal(null)} className={styles.modalClose}><X size={24} /></button>
            </div>

            <div className={`${styles.tabsWrapper} ${styles.customScrollbar}`}>
              {[
                {id: 'geral', icon: <LayoutGrid size={14}/>, label: 'Geral & Variáveis'},
                {id: 'tecnico', icon: <Scale size={14}/>, label: 'Ficha Técnica'},
                {id: 'seo', icon: <Globe size={14}/>, label: 'Marketing / SEO'}
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${styles.tabButton} ${activeTab === tab.id ? styles.tabActive : styles.tabInactive}`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
            
            <form id="productForm" onSubmit={handleSave} className={`${styles.formWrapper} ${styles.customScrollbar}`}>
              
              {/* ABA: GERAL */}
              {activeTab === 'geral' && (
                <div className={styles.formGrid}>
                  <div className={styles.formCol}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Nome do Produto *</label>
                      <input required type="text" className={styles.input} 
                        value={formData.nome_produto} 
                        onChange={(e)=>{
                          const val = e.target.value;
                          setFormData({...formData, nome_produto: val});
                          setVariations(prev => prev.map(v => ({...v, sku: generateSku(val, v.tamanho)})));
                        }} 
                      />
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Preço (R$) *</label>
                        <input required type="number" step="0.01" className={`${styles.input} ${styles.inputLarge}`} value={formData.preco} onChange={(e)=>setFormData({...formData, preco: e.target.value})} />
                      </div>
                      <div className={styles.formGroup}>
                         <label className={styles.label}>Categoria *</label>
                         <select required className={styles.input} value={formData.id_categoria} onChange={(e)=>setFormData({...formData, id_categoria: e.target.value})}>
                          <option value="">Selecione...</option>
                          {categories.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nome_categoria}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={`${styles.label} ${styles.inputMono}`}>Descrição Curta</label>
                      <textarea rows="2" className={`${styles.input} ${styles.textarea}`} value={formData.descricao} onChange={(e)=>setFormData({...formData, descricao: e.target.value})} />
                    </div>

                    <div className={styles.sectionCard}>
                      <div className={styles.sectionHeader}>
                        <div>
                          <p className={styles.sectionTitle}>Grade & SKUs</p>
                          <p className={styles.sectionSubtitle}>Gerencie os tamanhos</p>
                        </div>
                        <button type="button" onClick={() => setVariations([...variations, { tamanho: '', sku: '', estoque: 0 }])} className={styles.btnAddVar}>
                          <Plus size={12}/> Add
                        </button>
                      </div>
                      
                      <div className={`${styles.varList} ${styles.customScrollbar}`}>
                        {variations.map((v, i) => (
                          <div key={i} className={styles.varItem}>
                            <select className={styles.varSelect}
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
                            <input type="text" placeholder="SKU" className={styles.varInput} 
                              value={v.sku} onChange={(e) => {
                                const newVars = [...variations];
                                newVars[i].sku = e.target.value;
                                setVariations(newVars);
                              }} 
                            />
                            {variations.length > 1 && (
                              <button type="button" onClick={() => setVariations(variations.filter((_, idx) => idx !== i))} className={styles.btnRemoveVar}>
                                <Trash2 size={14}/>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className={styles.formCol}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Fotos do Produto (Escolha a Capa)</label>
                      <div className={styles.photoGrid}>
                        {existingPhotos.map((foto, i) => {
                          const isCover = !coverData.isNew && coverData.index === i;
                          return (
                          <div key={foto.id_foto || i} className={`${styles.photoItem} ${isCover ? styles.photoCover : styles.photoDefault}`}>
                            <img src={resolveImageUrl(foto.url || foto)} className={styles.photoImg} alt="" />
                            
                            <div className={styles.photoOverlay}>
                              <button type="button" onClick={() => setCoverData({ isNew: false, index: i })} className={`${styles.btnPhotoAction} ${styles.btnPhotoStar}`} title="Definir como capa">
                                <Star size={16} className={isCover ? styles.btnPhotoStarActive : ''} />
                              </button>
                              <button type="button" onClick={() => handleRemoveExistingPhoto(i)} className={`${styles.btnPhotoAction} ${styles.btnPhotoTrash}`} title="Remover foto">
                                <Trash2 size={16} />
                              </button>
                            </div>

                            {isCover && (
                              <span className={`${styles.photoBadge} ${styles.badgeCover}`}>
                                <Star size={8} fill="currentColor" /> Capa
                              </span>
                            )}
                          </div>
                        )})}
                        
                        {previewUrls.map((url, i) => {
                          const isCover = coverData.isNew && coverData.index === i;
                          return (
                          <div key={`new-${i}`} className={`${styles.photoItem} ${isCover ? styles.photoCover : styles.photoNew}`}>
                            <img src={url} className={styles.photoImg} alt="" />
                            
                            <div className={styles.photoOverlay}>
                              <button type="button" onClick={() => setCoverData({ isNew: true, index: i })} className={`${styles.btnPhotoAction} ${styles.btnPhotoStar}`} title="Definir como capa">
                                <Star size={16} className={isCover ? styles.btnPhotoStarActive : ''} />
                              </button>
                              <button type="button" onClick={() => removeUploadFile(i)} className={`${styles.btnPhotoAction} ${styles.btnPhotoTrash}`} title="Remover foto">
                                <Trash2 size={16} />
                              </button>
                            </div>
                            
                            <span className={`${styles.photoBadge} ${isCover ? styles.badgeCover : styles.badgeNew}`}>
                              {isCover ? <><Star size={8} fill="currentColor" /> Capa</> : 'Novo'}
                            </span>
                          </div>
                        )})}

                        <button type="button" onClick={() => fileInputRef.current?.click()} className={styles.uploadBtn}>
                          <Upload size={18} />
                          <span className={styles.uploadText}>Upload</span>
                        </button>
                        <input type="file" multiple accept="image/*" className="hidden" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileChange} />
                      </div>
                    </div>

                    <div className={styles.sectionCard}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Status Público</label>
                        <select className={styles.input} value={formData.status} onChange={(e)=>setFormData({...formData, status: e.target.value})}>
                          <option value="ativo">Ativo - Visível na loja</option>
                          <option value="inativo">Inativo - Indisponível</option>
                        </select>
                      </div>
                      
                      <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '0.5rem 0' }} />
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label className={styles.toggleWrapper}>
                          <div className={styles.toggleTextGroup}>
                            <span className={`${styles.toggleLabel} ${styles.toggleLabelDestaque}`}>Produto Destaque</span>
                            <span className={styles.toggleDesc}>Exibir na vitrine principal</span>
                          </div>
                          <div className={`${styles.toggleTrack} ${formData.destaque ? styles.toggleTrackOnDestaque : styles.toggleTrackOff}`}>
                            <div className={`${styles.toggleThumb} ${formData.destaque ? styles.toggleThumbOn : styles.toggleThumbOff}`} />
                          </div>
                          <input type="checkbox" style={{ display: 'none' }} checked={formData.destaque} onChange={(e)=>setFormData({...formData, destaque: e.target.checked})} />
                        </label>

                        <label className={styles.toggleWrapper}>
                          <div className={styles.toggleTextGroup}>
                            <span className={`${styles.toggleLabel} ${styles.toggleLabelOculto}`}>Modo Oculto</span>
                            <span className={styles.toggleDesc}>Apenas acessível via link direto</span>
                          </div>
                          <div className={`${styles.toggleTrack} ${formData.oculto ? styles.toggleTrackOnOculto : styles.toggleTrackOff}`}>
                            <div className={`${styles.toggleThumb} ${formData.oculto ? styles.toggleThumbOn : styles.toggleThumbOff}`} />
                          </div>
                          <input type="checkbox" style={{ display: 'none' }} checked={formData.oculto} onChange={(e)=>setFormData({...formData, oculto: e.target.checked})} />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA: TÉCNICO */}
              {activeTab === 'tecnico' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '48rem', margin: '1rem auto' }}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}><Scale size={14}/> Peso (kg)</label>
                      <input type="number" step="0.001" placeholder="Ex: 0.250" className={`${styles.input} ${styles.inputLarge}`} value={formData.peso} onChange={(e)=>setFormData({...formData, peso: e.target.value})}/>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}><Maximize size={14}/> Dimensões (CxLxA cm)</label>
                      <input type="text" placeholder="Ex: 30x20x10" className={`${styles.input} ${styles.inputLarge}`} style={{ textTransform: 'uppercase' }} value={formData.dimensoes} onChange={(e)=>setFormData({...formData, dimensoes: e.target.value})}/>
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Ficha Técnica Completa</label>
                    <textarea rows="8" className={`${styles.input} ${styles.textarea} ${styles.inputMono}`} placeholder="Ex: 100% Algodão, fio 30.1 penteado. Gola canelada..." value={formData.ficha_tecnica} onChange={(e)=>setFormData({...formData, ficha_tecnica: e.target.value})} />
                  </div>
                </div>
              )}

              {/* ABA: SEO */}
              {activeTab === 'seo' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '42rem', margin: '1rem auto' }}>
                  <div className={styles.infoBox}>
                    <Info size={24} style={{ flexShrink: 0 }} />
                    <p className={styles.infoText}>Estas informações são fundamentais para o ranqueamento no Google. O título e descrição aqui sobrescrevem o nome e descrição originais apenas nos resultados de busca.</p>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>SEO Meta Title</label>
                    <input type="text" placeholder="Recomendado: 50-60 caracteres" className={styles.input} value={formData.seo_titulo} onChange={(e)=>setFormData({...formData, seo_titulo: e.target.value})} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>SEO Meta Description</label>
                    <textarea rows="3" placeholder="Recomendado: 150-160 caracteres" className={`${styles.input} ${styles.textarea}`} value={formData.seo_descricao} onChange={(e)=>setFormData({...formData, seo_descricao: e.target.value})} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Tags (Busca e Filtros Internos)</label>
                    <input type="text" placeholder="ex: camiseta, hype, drop1, preta" className={styles.input} style={{ textTransform: 'lowercase' }} value={formData.tags} onChange={(e)=>setFormData({...formData, tags: e.target.value})} />
                  </div>
                </div>
              )}
            </form>

            <div className={styles.modalFooter}>
              <button type="button" onClick={() => setActiveModal(null)} className={styles.btnCancel}>Cancelar</button>
              <button form="productForm" type="submit" disabled={saving} className={styles.btnSave}>
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {saving ? 'Salvando...' : 'Confirmar & Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmação de Exclusão Simples */}
      {activeModal === 'delete' && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmModal}>
            <div className={styles.confirmIconWrapper}>
              <Trash2 size={36} className={styles.confirmIcon} />
            </div>
            <h3 className={styles.confirmTitle}>Remover Produto?</h3>
            <p className={styles.confirmText}>O item #{targetId} será deletado permanentemente da base de dados.</p>
            <div className={styles.confirmActions}>
              <button onClick={() => setActiveModal(null)} className={styles.btnConfirmCancel}>Cancelar</button>
              <button onClick={handleDelete} className={styles.btnConfirmDelete}>Sim, Deletar</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmação de Exclusão em Massa */}
      {isBulkDeleteModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmModal}>
            <div className={styles.confirmIconWrapper}>
              <Trash2 size={36} className={styles.confirmIcon} />
            </div>
            <h3 className={styles.confirmTitle}>Excluir {selectedIds.length} produtos?</h3>
            <p className={styles.confirmText}>Esta ação não pode ser desfeita. Todos os itens selecionados serão deletados permanentemente.</p>
            <div className={styles.confirmActions}>
              <button onClick={() => setIsBulkDeleteModalOpen(false)} className={styles.btnConfirmCancel}>Cancelar</button>
              <button onClick={handleBulkDelete} className={styles.btnConfirmDelete}>Sim, Excluir Todos</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}