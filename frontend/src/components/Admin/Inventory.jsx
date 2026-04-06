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
import Modal from '../Modal';
import Pagination from './Pagination';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';

const PAGE_SIZE = 20;

// --- HELPERS ---
const getStockHealth = (stock) => {
  if (stock === 0) return { label: 'Esgotado', color: 'text-red-600 bg-red-50 border-red-100', key: 'out' };
  if (stock <= 5) return { label: 'Crítico', color: 'text-orange-600 bg-orange-50 border-orange-100', key: 'critical' };
  if (stock <= 15) return { label: 'Baixo', color: 'text-yellow-600 bg-yellow-50 border-yellow-100', key: 'low' };
  return { label: 'Em estoque', color: 'text-green-600 bg-green-50 border-green-100', key: 'ok' };
};

// --- SUB-COMPONENTS ---
const StatCard = ({ title, value, color = "bg-white", border = "border-gray-200", subtitle }) => (
  <div className={`flex-1 p-6 rounded border shadow-sm ${color === 'bg-white' ? 'bg-white text-black' : color + ' text-white'} ${border}`}>
    <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${color === 'bg-white' ? 'text-gray-400' : 'text-white/80'}`}>
      {title}
    </p>
    <h2 className="text-3xl font-black tracking-tight">{value}</h2>
    {subtitle && <p className={`text-[9px] font-bold mt-1 uppercase tracking-widest ${color === 'bg-white' ? 'text-gray-400' : 'text-white/60'}`}>{subtitle}</p>}
  </div>
);

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

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [debouncedSearch, healthFilter]);

  const flattenProduct = useCallback((p) => {
    const vars = Array.isArray(p.variacoes_estoque) ? p.variacoes_estoque : [];
    if (vars.length === 0) {
      return [{ productId: p.id_produto, name: p.nome_produto, category: p.categoria?.nome_categoria || 'Sem Coleção', sku: '-', size: '-', stock: 0, price: Number(p.preco || 0) }];
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

  // Filtro na Tabela Principal
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

  // Cálculos de Métricas
  const stats = useMemo(() => ({
    totalUnits: inventory.reduce((s, i) => s + i.stock, 0),
    totalValue: inventory.reduce((s, i) => s + i.stock * i.price, 0),
    lowStockItems: inventory.filter(i => i.stock > 0 && i.stock <= 15),
    outOfStockItems: inventory.filter(i => i.stock === 0),
  }), [inventory]);

  // AGRUPAMENTO DE GRADE POR PRODUTO
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
      
      // Evita duplicar tamanhos
      if (!groups[item.productId].variations.some(v => v.size === item.size)) {
        groups[item.productId].variations.push({
          size: item.size,
          stock: item.stock
        });
      }
    });

    const sizeOrder = { 'PP': 1, 'P': 2, 'M': 3, 'G': 4, 'GG': 5, 'XG': 6, 'EXG': 7 };
    
    return Object.values(groups)
      .map(product => ({
        ...product,
        variations: product.variations.sort((a, b) => (sizeOrder[a.size] || 99) - (sizeOrder[b.size] || 99))
      }))
      .sort((a, b) => b.totalStock - a.totalStock); 
  }, [inventory]);

  // --- NOVA LÓGICA: VENDAS POR COLEÇÃO (SIMULADO PARA O UI) ---
  // Substitua este bloco quando tiver o endpoint real de vendas
  const collectionSalesStats = useMemo(() => {
    const categories = [...new Set(inventory.map(item => item.category))];
    
    return categories.map((cat, index) => {
      // Gerando números fixos simulados baseados no nome da categoria para a interface
      const soldItems = (index + 1) * 142 + (cat.length * 7);
      const revenue = soldItems * (119.90 + (index * 15));
      const performance = Math.min(100, 45 + (index * 12) + (cat.length * 2)); // % Giro

      return {
        name: cat,
        sold: soldItems,
        revenue: revenue,
        averageTicket: revenue / soldItems,
        performance: performance
      };
    }).sort((a, b) => b.revenue - a.revenue); // Ordena pela que gerou mais receita
  }, [inventory]);

  // Funções de Modal
  const openMovementsModal = useCallback(async (item) => {
    setMovementsModal({ isOpen: true, productId: item.productId, productName: item.name });
    try {
      const res = await api.get(`/admin/inventory/movements?id_produto=${item.productId}&limit=30`);
      setMovements(res.data || []);
    } catch (err) {
      console.error('Erro ao carregar movimentações:', err);
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
      console.error('Erro ao repor estoque:', err);
      addToast('Erro ao repor estoque', 'error');
    }
  }, [repoModal, loadInventory, addToast]);

  if (loading && inventory.length === 0) return <div className="min-h-screen bg-white text-center py-12 text-[10px] font-black uppercase tracking-widest text-gray-400">Carregando inventário...</div>;

  return (
    <div className="bg-white min-h-screen">
      <div className="p-4 lg:p-8 space-y-8 max-w-[1400px] mx-auto w-full font-sans animate-in fade-in duration-500 text-black">
        
        {/* CARDS DE RESUMO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total em Estoque" value={stats.totalUnits} subtitle="UNIDADES" />
          <StatCard title="Valor Estimado" value={`R$ ${stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} subtitle="ESTOQUE BRUTO" />
          <StatCard title="Estoque Baixo" value={stats.lowStockItems.length} color="bg-orange-500" border="border-orange-500" subtitle="SKUs em alerta" />
          <StatCard title="Esgotados" value={stats.outOfStockItems.length} color="bg-red-600" border="border-red-600" subtitle="SKUs sem estoque" />
        </div>

        {/* BOTÕES DE AÇÃO NOS EXTREMOS */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <button className="w-full sm:w-auto border border-gray-200 bg-white text-black px-6 py-3 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-gray-50 transition-all shadow-sm">
            IR PARA PRODUTOS
          </button>
          <button className="w-full sm:w-auto bg-black text-white px-6 py-3 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-gray-800 transition-all shadow-xl shadow-black/10">
            EXPORTAR RELATÓRIO
          </button>
        </div>

        {/* ALERTAS CRÍTICOS */}
        {stats.lowStockItems.length > 0 && (
          <div className="bg-white border border-orange-200 rounded p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <AlertCircle className="text-orange-500 flex-shrink-0" size={24} />
              <div>
                <h3 className="font-black uppercase text-sm tracking-tight text-orange-600 mb-2">Atenção: Estoque Baixo</h3>
                <p className="text-[11px] font-bold uppercase tracking-widest text-orange-500/80 mb-3">Os seguintes SKUs precisam de reposição:</p>
                <ul className="space-y-1">
                  {stats.lowStockItems.slice(0, 5).map((item, idx) => (
                    <li key={idx} className="text-xs text-orange-600">
                      <span className="font-black">{item.name}</span> (Tam: {item.size}) — {item.stock} un
                    </li>
                  ))}
                  {stats.lowStockItems.length > 5 && <li className="text-[10px] font-black tracking-widest text-orange-500 mt-2">...e mais {stats.lowStockItems.length - 5} itens</li>}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col space-y-8">
          
          {/* TABELA: DISPONIBILIDADE DE GRADE POR MODELO */}
          <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
              <LayoutGrid size={18} className="text-black" />
              <h3 className="font-black uppercase text-sm tracking-tight text-black">Visão de Grade por Produto</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                    <th className="px-6 py-4">Produto (Modelo Pai)</th>
                    <th className="px-6 py-4">Coleção / Categoria</th>
                    <th className="px-6 py-4">Grade de Tamanhos (Estoque)</th>
                    <th className="px-6 py-4 text-right">Total Físico</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-bold text-xs uppercase tracking-tight">
                  {productGridStats.map((product) => (
                    <tr key={product.productId} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-5 font-black text-black">
                        {product.name}
                      </td>
                      <td className="px-6 py-5 text-[9px] text-gray-400 tracking-widest">
                        {product.category}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-2">
                          {product.variations.map((v, i) => {
                            let tagStyle = "border-gray-200 text-gray-700 bg-white";
                            let tooltipText = `${v.stock} em estoque`;

                            if (v.stock === 0) {
                              tagStyle = "border-red-200 text-red-500 bg-red-50 line-through opacity-70";
                              tooltipText = "Esgotado";
                            } else if (v.stock <= 5) {
                              tagStyle = "border-orange-300 text-orange-600 bg-orange-50";
                            }

                            return (
                              <div 
                                key={i} 
                                title={tooltipText}
                                className={`flex flex-col items-center justify-center min-w-[36px] h-9 border rounded cursor-help transition-all hover:scale-105 ${tagStyle}`}
                              >
                                <span className="text-[10px] font-black leading-none">{v.size}</span>
                                {v.stock > 0 && (
                                  <span className="text-[8px] font-bold leading-none mt-0.5 opacity-80">{v.stock}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="text-base font-black text-black">{product.totalStock}</span>
                        <span className="text-[9px] text-gray-400 block mt-1">UNIDADES</span>
                      </td>
                    </tr>
                  ))}
                  {productGridStats.length === 0 && !loading && (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-[11px] font-black uppercase tracking-widest text-gray-400">
                        Nenhum produto encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABELA PRINCIPAL DE SAÚDE DO INVENTÁRIO (SKUs INDIVIDUAIS) */}
          <div className="bg-white border border-gray-200 rounded overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <h3 className="font-black uppercase text-sm tracking-tight w-full sm:w-auto">Listagem Detalhada (SKUs)</h3>
              
              <div className="flex gap-2 w-full sm:w-auto items-center">
                <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded w-full sm:w-auto">
                  <Search size={14} className="text-gray-400" />
                  <input
                    type="text"
                    placeholder="BUSCAR NOME OU SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 text-[10px] font-black uppercase tracking-widest w-full sm:w-48 outline-none placeholder-gray-300 text-black"
                  />
                </div>
                <div className="relative">
                  <select
                    value={healthFilter}
                    onChange={(e) => setHealthFilter(e.target.value)}
                    className="appearance-none pl-8 pr-8 py-2 bg-white border border-gray-200 rounded text-[10px] font-black uppercase tracking-widest text-gray-600 outline-none hover:bg-gray-50 cursor-pointer"
                  >
                    <option value="todos">Todos os Status</option>
                    <option value="ok">Em Estoque</option>
                    <option value="low">Estoque Baixo</option>
                    <option value="out">Esgotados</option>
                  </select>
                  <Filter size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {loading && <div className="p-4 text-center text-[10px] font-black tracking-widest uppercase text-gray-400">Atualizando tabela...</div>}

            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                    <th className="px-6 py-4">Produto</th>
                    <th className="px-6 py-4">SKU</th>
                    <th className="px-6 py-4">Estoque</th>
                    <th className="px-6 py-4">Preço</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-bold text-xs uppercase tracking-tight">
                  {filteredInventory.map((item, idx) => {
                    const health = getStockHealth(item.stock);
                    return (
                      <tr key={`${item.productId}-${item.sku}-${idx}`} className="hover:bg-gray-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-black text-black">{item.name}</div>
                          <div className="text-[9px] text-gray-400 tracking-widest mt-0.5">Tam: {item.size}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono border border-gray-200 px-2 py-1 rounded text-[10px] text-gray-500">
                            {item.sku}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-black ${item.stock === 0 ? 'text-red-600' : item.stock <= 15 ? 'text-orange-500' : 'text-black'}`}>
                            {item.stock} un
                          </span>
                        </td>
                        <td className="px-6 py-4 font-black text-black">R$ {item.price.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${health.color}`}>
                            {health.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => openRepoModal(item)}
                            className="p-2 text-gray-400 hover:bg-black hover:text-white rounded transition-all inline-flex"
                            title="Repor Estoque"
                          >
                            <RotateCcw size={16} />
                          </button>
                          <button
                            onClick={() => openMovementsModal(item)}
                            className="p-2 text-gray-400 hover:bg-black hover:text-white rounded transition-all inline-flex"
                            title="Ver Histórico"
                          >
                            <History size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {!loading && filteredInventory.length === 0 && (
              <div className="p-12 text-center border-t border-gray-100">
                <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">Nenhum item encontrado.</p>
              </div>
            )}
            
            {/* Paginação da Tabela Principal */}
            <div className="border-t border-gray-100 p-4">
               <Pagination page={page} totalPages={totalPages} total={totalItems} onPageChange={setPage} limit={PAGE_SIZE} />
            </div>
          </div>

          {/* NOVA TABELA: VENDAS POR COLEÇÃO */}
          <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden mt-8">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
              <TrendingUp size={18} className="text-black" />
              <h3 className="font-black uppercase text-sm tracking-tight text-black">Performance de Vendas por Coleção</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                    <th className="px-6 py-4">Coleção / Categoria</th>
                    <th className="px-6 py-4 text-center">Peças Vendidas</th>
                    <th className="px-6 py-4">Receita Gerada</th>
                    <th className="px-6 py-4">Ticket Médio</th>
                    <th className="px-6 py-4 w-1/4">Giro / Performance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-bold text-xs uppercase tracking-tight">
                  {collectionSalesStats.map((col, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-5 font-black text-black tracking-wider italic underline underline-offset-4 decoration-gray-200">
                        {col.name}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="text-base font-black text-black">{col.sold}</span>
                        <span className="text-[9px] text-gray-400 block">UNIDADES</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="font-black text-green-600">R$ {col.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </td>
                      <td className="px-6 py-5 font-black text-gray-500">
                        R$ {col.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden flex-1">
                            <div 
                              className={`h-full ${col.performance > 70 ? 'bg-black' : col.performance > 40 ? 'bg-orange-500' : 'bg-red-500'}`} 
                              style={{ width: `${col.performance}%` }}
                            ></div>
                          </div>
                          <span className="text-[10px] font-black text-gray-500 w-8 text-right">{col.performance.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {collectionSalesStats.length === 0 && !loading && (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-[11px] font-black uppercase tracking-widest text-gray-400">
                        Nenhum dado de venda disponível
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>

        {/* MODAL DE REPOSIÇÃO */}
        <Modal isOpen={repoModal.isOpen} onClose={() => setRepoModal({ isOpen: false, item: null, qty: 0, obs: '' })} title="Nova Reposição" size="sm">
          <div className="space-y-6 font-sans">
            <div className="bg-white border border-gray-200 p-4 rounded">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Item Selecionado</p>
              <p className="font-black text-black uppercase">{repoModal.item?.name}</p>
              <p className="text-[11px] font-bold text-gray-500">TAMANHO: {repoModal.item?.size} | SKU: {repoModal.item?.sku}</p>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Quantidade a repor</label>
              <input
                type="number"
                min="1"
                value={repoModal.qty}
                onChange={(e) => setRepoModal(prev => ({ ...prev, qty: Number(e.target.value) }))}
                className="w-full p-3 bg-white border border-gray-200 rounded text-sm font-black focus:border-black outline-none text-black"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Observação (Opcional)</label>
              <input
                type="text"
                value={repoModal.obs}
                onChange={(e) => setRepoModal(prev => ({ ...prev, obs: e.target.value }))}
                placeholder="Ex: Fornecedor X / Drop 02"
                className="w-full p-3 bg-white border border-gray-200 rounded text-sm font-bold placeholder-gray-300 focus:border-black outline-none uppercase text-black"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setRepoModal({ isOpen: false, item: null, qty: 0, obs: '' })} className="flex-1 py-3 bg-white border border-gray-200 text-[10px] font-black uppercase tracking-[0.2em] text-black rounded hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={saveRepoModal} disabled={repoModal.qty <= 0} className="flex-1 bg-black text-white py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded disabled:opacity-50 hover:bg-gray-800 transition-colors shadow-lg shadow-black/10">
                Confirmar
              </button>
            </div>
          </div>
        </Modal>

        {/* MODAL DE HISTÓRICO */}
        <Modal isOpen={movementsModal.isOpen} onClose={() => setMovementsModal({ isOpen: false, productId: null, productName: '' })} title="Histórico de Giro" size="lg">
          <div className="max-h-[500px] overflow-y-auto pr-2 bg-white">
            <div className="mb-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Produto</p>
              <h3 className="font-black uppercase text-sm tracking-tight text-black">{movementsModal.productName}</h3>
            </div>

            {movements.length === 0 ? (
              <p className="text-center text-[11px] font-black uppercase tracking-widest text-gray-400 py-8">Nenhuma movimentação registrada.</p>
            ) : (
              <div className="space-y-6">
                {movements.map((m, i) => {
                  const isIn = m.tipo === 'reposicao' || m.tipo === 'devolucao';
                  return (
                    <div key={m.id_movimentacao} className="flex items-start gap-3 border-l-2 border-gray-200 pl-4 relative">
                      <div className={`absolute -left-[9px] top-0 p-1 rounded-full bg-white border ${isIn ? 'text-green-500 border-green-200' : 'text-red-500 border-red-200'}`}>
                        {isIn ? <ArrowUpCircle size={10} /> : <ArrowDownCircle size={10} />}
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] font-black uppercase tracking-tight text-black">
                          {m.tipo === 'reposicao' ? 'REPOSIÇÃO ESTOQUE' : m.tipo === 'venda' ? 'VENDA' : m.tipo.toUpperCase()}
                        </p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">
                          {new Date(m.criado_em).toLocaleDateString('pt-BR')} • SKU: {m.sku_variacao}
                        </p>
                        {m.observacao && <p className="text-[10px] text-gray-500 font-medium italic mt-1">{m.observacao}</p>}
                      </div>
                      <span className={`text-sm font-black ${isIn ? 'text-green-600' : 'text-red-600'}`}>
                        {isIn ? '+' : '-'}{m.quantidade}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Modal>

      </div>
    </div>
  );
}