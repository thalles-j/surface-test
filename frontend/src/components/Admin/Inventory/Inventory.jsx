import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  AlertCircle, 
  Search, 
  RotateCcw, 
  History,
  Filter,
  ArrowUpCircle,
  ArrowDownCircle,
  LayoutGrid,
  TrendingUp
} from 'lucide-react';
import Modal from '../../Modal';
import Pagination from '../Pagination/Pagination';
import { useToast } from '../../../context/ToastContext';
import { api } from '../../../services/api';

const PAGE_SIZE = 20;

// --- HELPERS ---
const getStockHealth = (stock) => {
  if (stock === 0) return { label: 'Esgotado', styleClass: 'bg-red-100 text-red-800 border border-red-200', key: 'out' };
  if (stock <= 5) return { label: 'Crítico', styleClass: 'bg-orange-100 text-orange-800 border border-orange-200', key: 'critical' };
  if (stock <= 15) return { label: 'Baixo', styleClass: 'bg-yellow-100 text-yellow-800 border border-yellow-200', key: 'low' };
  return { label: 'Em estoque', styleClass: 'bg-emerald-100 text-emerald-800 border border-emerald-200', key: 'ok' };
};

// --- SUB-COMPONENTS ---
const StatCard = ({ title, value, variant = "default", subtitle }) => {
  const cardClass = variant === 'warning'
    ? 'admin-panel'
    : variant === 'danger'
      ? 'admin-panel'
      : 'admin-kpi-card';

  return (
    <div
      className={`p-6 shadow-sm rounded-xl ${cardClass}`}
      style={variant === 'warning'
        ? { background: 'var(--app-warning-soft)', borderColor: 'var(--app-warning-border)' }
        : variant === 'danger'
          ? { background: 'var(--app-danger-soft)', borderColor: 'var(--app-danger-border)' }
          : undefined}
    >
      <p className="admin-kpi-label">{title}</p>
      <h2 className="admin-kpi-value mt-2">{value}</h2>
      {subtitle && <p className="admin-kpi-meta mt-1">{subtitle}</p>}
    </div>
  );
};

export default function Inventory() {
  const { addToast } = useToast();

  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [healthFilter, setHealthFilter] = useState('todos');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [movementsModal, setMovementsModal] = useState({ isOpen: false, productId: null, productName: '' });
  const [movements, setMovements] = useState([]);
  const [repoModal, setRepoModal] = useState({ isOpen: false, item: null, qty: 0, obs: '' });

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Resetar página ao filtrar
  useEffect(() => { setPage(1); }, [debouncedSearch, healthFilter]);

  const flattenProduct = useCallback((p) => {
    const vars = Array.isArray(p.variacoes_estoque) ? p.variacoes_estoque : [];
    if (vars.length === 0) {
      return [{ 
        productId: p.id_produto, 
        name: p.nome_produto, 
        category: p.categoria?.nome_categoria || 'Sem Coleção', 
        sku: '-', 
        size: '-', 
        stock: 0, 
        price: Number(p.preco || 0) 
      }];
    }
    return vars.map(v => ({
      productId: p.id_produto,
      name: p.nome_produto,
      category: p.categoria?.nome_categoria || 'Sem Coleção',
      sku: v.sku || '-',
      size: v.tamanho || '-',
      stock: v.estoque || 0,
      price: Number(v.preco || p.preco || 0),
    }));
  }, []);

  const loadInventory = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('limit', PAGE_SIZE);
      if (debouncedSearch) params.set('search', debouncedSearch);

      const res = await api.get(`/admin/inventory/status?${params}`);

      if (res.data?.data) {
        const items = res.data.data.flatMap(flattenProduct);
        setInventory(items);
        setTotalPages(res.data.totalPages || 1);
        setTotalItems(res.data.total || 0);
      } else {
        const items = (res.data || []).flatMap(flattenProduct);
        setInventory(items);
      }
    } catch (err) {
      console.error('Erro ao carregar inventário:', err);
      addToast('Erro ao carregar inventário', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, flattenProduct, addToast]);

  useEffect(() => { loadInventory(); }, [loadInventory]);

  // Filtros de saúde do estoque
  const filteredInventory = useMemo(() => {
    if (healthFilter === 'todos') return inventory;
    return inventory.filter(i => {
      const h = getStockHealth(i.stock);
      if (healthFilter === 'ok') return h.key === 'ok';
      if (healthFilter === 'low') return h.key === 'low' || h.key === 'critical';
      if (healthFilter === 'out') return h.key === 'out';
      return true;
    });
  }, [inventory, healthFilter]);

  // Estatísticas do topo
  const stats = useMemo(() => ({
    totalUnits: inventory.reduce((s, i) => s + i.stock, 0),
    totalValue: inventory.reduce((s, i) => s + i.stock * i.price, 0),
    lowStockItems: inventory.filter(i => i.stock > 0 && i.stock <= 15),
    outOfStockItems: inventory.filter(i => i.stock === 0),
  }), [inventory]);

  // Agrupamento por Modelo (Grade de Tamanhos)
  const productGridStats = useMemo(() => {
    const groups = {};
    inventory.forEach(item => {
      if (!groups[item.productId]) {
        groups[item.productId] = {
          productId: item.productId,
          name: item.name,
          category: item.category,
          totalStock: 0,
          variations: []
        };
      }
      groups[item.productId].totalStock += item.stock;
      groups[item.productId].variations.push({
        size: item.size,
        stock: item.stock
      });
    });

    const sizeOrder = { 'PP': 1, 'P': 2, 'M': 3, 'G': 4, 'GG': 5, 'XG': 6, 'EXG': 7 };
    
    return Object.values(groups)
      .map(product => ({
        ...product,
        variations: product.variations.sort((a, b) => (sizeOrder[a.size.toUpperCase()] || 99) - (sizeOrder[b.size.toUpperCase()] || 99))
      }))
      .sort((a, b) => b.totalStock - a.totalStock); 
  }, [inventory]);

  // Performance por Coleção (Dados fictícios baseados no inventário)
  const collectionSalesStats = useMemo(() => {
    const categories = [...new Set(inventory.map(item => item.category))];
    
    return categories.map((cat, index) => {
      const soldItems = (index + 1) * 12; // Mock de vendas
      const revenue = soldItems * 150;
      const performance = Math.min(100, 30 + (index * 15));

      return {
        name: cat,
        sold: soldItems,
        revenue: revenue,
        averageTicket: revenue / (soldItems || 1),
        performance: performance
      };
    }).sort((a, b) => b.revenue - a.revenue); 
  }, [inventory]);

  const openMovementsModal = useCallback(async (item) => {
    setMovementsModal({ isOpen: true, productId: item.productId, productName: item.name });
    try {
      const res = await api.get(`/admin/inventory/movements?id_produto=${item.productId}&limit=30`);
      setMovements(res.data || []);
    } catch (err) {
      addToast('Erro ao carregar movimentações', 'error');
      setMovements([]);
    }
  }, [addToast]);

  const openRepoModal = useCallback((item) => setRepoModal({ isOpen: true, item, qty: 0, obs: '' }), []);

  const saveRepoModal = useCallback(async () => {
    if (!repoModal.item || repoModal.qty <= 0) return;
    try {
      await api.post('/admin/inventory/movements', {
        id_produto: repoModal.item.productId,
        sku_variacao: repoModal.item.sku !== '-' ? repoModal.item.sku : repoModal.item.size,
        tipo: 'reposicao',
        quantidade: Number(repoModal.qty),
        observacao: repoModal.obs || 'Reposição manual',
      });
      addToast('Estoque reposto com sucesso!', 'success');
      await loadInventory();
      setRepoModal({ isOpen: false, item: null, qty: 0, obs: '' });
    } catch (err) {
      addToast('Erro ao repor estoque', 'error');
    }
  }, [repoModal, loadInventory, addToast]);

  if (loading && inventory.length === 0) {
    return <div className="text-center py-12 text-gray-500 font-sans min-h-screen bg-white">Carregando inventário...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 bg-white min-h-screen p-8 text-gray-900 font-sans">
      
      {/* HEADER DA PÁGINA */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900">Estoque & Inventário</h1>
        <p className="text-gray-500 mt-1">Gerencie a disponibilidade e reposição dos seus produtos em tempo real.</p>
      </div>
        
      {/* CARDS DE RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total em Estoque" value={stats.totalUnits} subtitle="UNIDADES" />
        <StatCard title="Valor Estimado" value={`R$ ${stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} subtitle="ESTOQUE BRUTO" />
        <StatCard title="Estoque Baixo" value={stats.lowStockItems.length} variant="warning" subtitle="SKUs em alerta" />
        <StatCard title="Esgotados" value={stats.outOfStockItems.length} variant="danger" subtitle="SKUs sem estoque" />
      </div>

      {/* ALERTAS CRÍTICOS */}
      {stats.lowStockItems.length > 0 && (
        <div className="flex items-start gap-4 bg-red-50 border border-red-200 p-4 rounded-xl">
          <AlertCircle className="text-red-500 mt-1 flex-shrink-0" size={24} />
          <div>
            <h3 className="font-bold text-red-900">Atenção: Estoque Baixo</h3>
            <p className="text-sm text-red-700 mt-1">Os seguintes SKUs precisam de reposição imediata:</p>
            <ul className="mt-2 space-y-1 text-sm text-red-800">
              {stats.lowStockItems.slice(0, 5).map((item, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="font-bold">{item.name}</span> (Tam: {item.size}) — {item.stock} un
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="space-y-8">
        
        {/* TABELA: DISPONIBILIDADE DE GRADE */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center gap-3 bg-gray-50/50">
            <LayoutGrid size={18} className="text-gray-500" />
            <h3 className="text-lg font-bold text-gray-900">Visão de Grade por Produto</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-gray-200">
                  <th className="px-6 py-4">Produto (Modelo Pai)</th>
                  <th className="px-6 py-4">Grade de Tamanhos (Estoque)</th>
                  <th className="px-6 py-4 text-right">Total Físico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {productGridStats.map((product) => (
                  <tr key={product.productId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-sm text-gray-900">{product.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{product.category}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {product.variations.map((v, i) => {
                          const isOut = v.stock === 0;
                          const isCritical = v.stock > 0 && v.stock <= 5;
                          return (
                            <div key={i} className={`flex items-center border rounded-md overflow-hidden text-xs font-medium ${isOut ? 'border-red-200 opacity-60' : isCritical ? 'border-orange-200' : 'border-gray-200'}`}>
                              <span className={`px-2 py-1 border-r ${isOut ? 'bg-red-50 text-red-700 border-red-200' : isCritical ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                {v.size}
                              </span>
                              <span className={`px-2 py-1 bg-white font-bold ${isOut ? 'text-red-700' : isCritical ? 'text-orange-700' : 'text-gray-900'}`}>
                                {v.stock}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-lg text-gray-900">{product.totalStock}</span>
                      <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">Unidades</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* TABELA PRINCIPAL DE SKUS */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-900">Listagem Detalhada (SKUs)</h3>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar nome ou SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-900 placeholder-gray-400 shadow-sm transition-all text-sm w-full md:w-64"
                />
              </div>
              <div className="relative">
                <select 
                  value={healthFilter} 
                  onChange={(e) => setHealthFilter(e.target.value)} 
                  className="pl-4 pr-10 py-2 bg-white border border-gray-300 rounded-lg outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-gray-900 shadow-sm transition-all text-sm appearance-none w-full md:w-auto"
                >
                  <option value="todos">Todos os Status</option>
                  <option value="ok">Em Estoque</option>
                  <option value="low">Estoque Baixo</option>
                  <option value="out">Esgotados</option>
                </select>
                <Filter size={12} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-gray-200">
                  <th className="px-6 py-4">Produto</th>
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4">Estoque</th>
                  <th className="px-6 py-4">Preço</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInventory.map((item, idx) => {
                  const health = getStockHealth(item.stock);
                  return (
                    <tr key={`${item.productId}-${item.sku}-${idx}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-sm text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">Tam: {item.size}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs bg-gray-100 border border-gray-200 px-2 py-1 rounded text-gray-700">{item.sku}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold text-sm ${item.stock === 0 ? 'text-red-600' : item.stock <= 15 ? 'text-orange-500' : 'text-gray-900'}`}>
                          {item.stock} un
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">R$ {item.price.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${health.styleClass}`}>
                          {health.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => openRepoModal(item)} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors ml-1" title="Repor Estoque">
                          <RotateCcw size={18} />
                        </button>
                        <button onClick={() => openMovementsModal(item)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors ml-1" title="Ver Histórico">
                          <History size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="border-t border-gray-200">
              <Pagination page={page} totalPages={totalPages} total={totalItems} onPageChange={setPage} limit={PAGE_SIZE} />
          </div>
        </div>

        {/* TABELA DE PERFORMANCE POR COLEÇÃO */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center gap-3 bg-gray-50/50">
            <TrendingUp size={18} className="text-gray-500" />
            <h3 className="text-lg font-bold text-gray-900">Performance de Vendas por Coleção</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-gray-200">
                  <th className="px-6 py-4">Coleção / Categoria</th>
                  <th className="px-6 py-4 text-center">Peças Vendidas</th>
                  <th className="px-6 py-4">Receita Gerada</th>
                  <th className="px-6 py-4 w-1/4">Giro / Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {collectionSalesStats.map((col, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-sm text-gray-900">{col.name}</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-700">{col.sold} UN</td>
                    <td className="px-6 py-4 font-bold text-gray-900">R$ {col.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${col.performance > 70 ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                            style={{ width: `${col.performance}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-gray-600 w-8 text-right">{col.performance.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
      </div>

      {/* MODAL DE REPOSIÇÃO */}
      <Modal isOpen={repoModal.isOpen} onClose={() => setRepoModal({ isOpen: false, item: null, qty: 0, obs: '' })} title="Nova Reposição" size="sm">
        <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg mb-6">
          <p className="text-xs font-bold text-gray-500 uppercase">Item Selecionado</p>
          <p className="font-bold text-gray-900 mt-1">{repoModal.item?.name}</p>
          <p className="text-xs text-gray-600 mt-1 font-mono">TAMANHO: {repoModal.item?.size} | SKU: {repoModal.item?.sku}</p>
        </div>
        <div className="space-y-2 mb-6">
          <label className="text-sm font-bold text-gray-700">Quantidade a repor</label>
          <input 
            type="number" 
            min="1" 
            value={repoModal.qty} 
            onChange={(e) => setRepoModal(p => ({ ...p, qty: Number(e.target.value) }))} 
            className="w-full p-2 bg-white border border-gray-300 rounded-lg outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-gray-900 shadow-sm transition-all" 
          />
        </div>
        <div className="flex gap-3">
          <button onClick={() => setRepoModal({ isOpen: false, item: null, qty: 0, obs: '' })} className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 rounded-lg transition-colors">Cancelar</button>
          <button onClick={saveRepoModal} disabled={repoModal.qty <= 0} className="flex-1 px-4 py-2 bg-emerald-600 text-white font-bold hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Confirmar</button>
        </div>
      </Modal>

      {/* MODAL DE HISTÓRICO */}
      <Modal isOpen={movementsModal.isOpen} onClose={() => setMovementsModal({ isOpen: false, productId: null, productName: '' })} title="Histórico de Giro" size="lg">
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {movements.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Nenhuma movimentação registrada.</p>
          ) : movements.map((m) => {
            const isIn = m.tipo === 'reposicao' || m.tipo === 'devolucao';
            return (
              <div key={m.id_movimentacao} className="flex items-center gap-4 bg-gray-50 border border-gray-100 p-3 rounded-lg">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 ${isIn ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                  {isIn ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">{m.tipo.toUpperCase()}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{new Date(m.criado_em).toLocaleDateString('pt-BR')} • SKU: <span className="font-mono">{m.sku_variacao}</span></p>
                </div>
                <span className={`font-bold text-lg ${isIn ? 'text-emerald-600' : 'text-red-600'}`}>
                  {isIn ? '+' : '-'}{m.quantidade}
                </span>
              </div>
            );
          })}
        </div>
      </Modal>

    </div>
  );
}
