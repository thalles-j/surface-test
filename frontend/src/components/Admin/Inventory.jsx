import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AlertCircle, Search, RotateCcw, History } from 'lucide-react';
import Modal from '../Modal';
import Pagination from './Pagination';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';

const PAGE_SIZE = 20;

const getStockHealth = (stock) => {
  if (stock === 0) return { label: 'Esgotado', color: 'bg-red-950 text-red-400', key: 'out' };
  if (stock <= 5) return { label: 'Crítico', color: 'bg-red-950 text-red-400', key: 'critical' };
  if (stock <= 15) return { label: 'Baixo', color: 'bg-yellow-950 text-yellow-400', key: 'low' };
  return { label: 'Em estoque', color: 'bg-emerald-950 text-emerald-400', key: 'ok' };
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
      return [{ productId: p.id_produto, name: p.nome_produto, category: p.categoria?.nome_categoria || '', sku: '-', size: '-', stock: 0, price: Number(p.preco || 0) }];
    }
    return vars.map(v => ({
      productId: p.id_produto,
      name: p.nome_produto,
      category: p.categoria?.nome_categoria || '',
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

  // Client-side health filter (stock health is computed from data)
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

  const stats = useMemo(() => ({
    totalUnits: inventory.reduce((s, i) => s + i.stock, 0),
    totalValue: inventory.reduce((s, i) => s + i.stock * i.price, 0),
    lowStockItems: inventory.filter(i => i.stock > 0 && i.stock <= 15),
    outOfStockItems: inventory.filter(i => i.stock === 0),
  }), [inventory]);

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
  }, []);

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

  if (loading && inventory.length === 0) return <div className="text-center py-12">Carregando inventário...</div>;

  return (
    <>
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 p-6 border border-zinc-800 rounded-xl">
          <p className="text-zinc-500 text-sm font-medium">Total em Estoque</p>
          <h3 className="text-3xl font-bold mt-2">{stats.totalUnits}</h3>
          <p className="text-xs text-zinc-600 mt-1">unidades</p>
        </div>
        <div className="bg-zinc-900 p-6 border border-zinc-800 rounded-xl">
          <p className="text-zinc-500 text-sm font-medium">Valor em Estoque</p>
          <h3 className="text-3xl font-bold mt-2">R$ {stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
        <div className="bg-zinc-900 p-6 border border-zinc-800 rounded-xl">
          <p className="text-zinc-500 text-sm font-medium">Estoque Baixo</p>
          <h3 className="text-3xl font-bold mt-2 text-yellow-400">{stats.lowStockItems.length}</h3>
          <p className="text-xs text-zinc-600 mt-1">SKUs</p>
        </div>
        <div className="bg-zinc-900 p-6 border border-zinc-800 rounded-xl">
          <p className="text-zinc-500 text-sm font-medium">Esgotados</p>
          <h3 className="text-3xl font-bold mt-2 text-red-400">{stats.outOfStockItems.length}</h3>
          <p className="text-xs text-zinc-600 mt-1">SKUs</p>
        </div>
      </div>

      {/* ALERTAS */}
      {stats.lowStockItems.length > 0 && (
        <div className="bg-yellow-950/50 border border-yellow-900 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="text-yellow-400 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-bold text-yellow-400 mb-2">Atenção: Estoque Baixo</h3>
              <p className="text-sm text-yellow-500">Os seguintes SKUs estão com estoque baixo:</p>
              <ul className="mt-3 space-y-1">
                {stats.lowStockItems.slice(0, 10).map((item, idx) => (
                  <li key={idx} className="text-sm text-yellow-500">
                    <span className="font-bold">{item.name}</span> ({item.size}) — {item.stock} un
                  </li>
                ))}
                {stats.lowStockItems.length > 10 && <li className="text-sm text-yellow-500">...e mais {stats.lowStockItems.length - 10}</li>}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TABELA */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800 flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome ou SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:border-zinc-500 outline-none text-white placeholder-zinc-500"
            />
          </div>
          <select
            value={healthFilter}
            onChange={(e) => setHealthFilter(e.target.value)}
            className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg outline-none focus:border-zinc-500 text-white"
          >
            <option value="todos">Todos</option>
            <option value="ok">Em estoque</option>
            <option value="low">Estoque baixo</option>
            <option value="out">Esgotados</option>
          </select>
          <h2 className="text-lg font-bold">Gestão de Estoque</h2>
        </div>

        {loading && <div className="p-4 text-center text-zinc-500 text-sm">Atualizando...</div>}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-800/50 text-xs font-bold uppercase text-zinc-500 border-b border-zinc-800">
                <th className="px-6 py-4">Produto</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Tamanho</th>
                <th className="px-6 py-4">Estoque</th>
                <th className="px-6 py-4">Preço</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredInventory.map((item, idx) => {
                const health = getStockHealth(item.stock);
                return (
                  <tr key={`${item.productId}-${item.sku}-${idx}`} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-sm">{item.name}</div>
                      <div className="text-[10px] text-zinc-500 uppercase">{item.category}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono bg-zinc-800 px-2 py-1 rounded text-xs text-zinc-400 font-semibold">
                        {item.sku}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold">{item.size}</td>
                    <td className="px-6 py-4">
                      <span className={`font-bold text-sm ${item.stock === 0 ? 'text-red-400' : item.stock <= 15 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                        {item.stock} un
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold">R$ {item.price.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${health.color}`}>
                        {health.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1">
                      <button
                        onClick={() => openRepoModal(item)}
                        className="p-2 text-zinc-500 hover:text-emerald-400 transition-colors"
                        title="Repor Estoque"
                      >
                        <RotateCcw size={16} />
                      </button>
                      <button
                        onClick={() => openMovementsModal(item)}
                        className="p-2 text-zinc-500 hover:text-blue-400 transition-colors"
                        title="Histórico"
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
          <div className="p-12 text-center text-zinc-500">
            <p>Nenhum item encontrado.</p>
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} total={totalItems} onPageChange={setPage} limit={PAGE_SIZE} />
      </div>
    </div>

    {/* Reposition Modal */}
    <Modal isOpen={repoModal.isOpen} onClose={() => setRepoModal({ isOpen: false, item: null, qty: 0, obs: '' })} title={`Repor estoque — ${repoModal.item?.name || ''} (${repoModal.item?.size || ''})`} size="sm">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium block mb-1 text-zinc-300">Quantidade a repor</label>
          <input
            type="number"
            min="1"
            value={repoModal.qty}
            onChange={(e) => setRepoModal(prev => ({ ...prev, qty: Number(e.target.value) }))}
            className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-zinc-500 outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1 text-zinc-300">Observação</label>
          <input
            type="text"
            value={repoModal.obs}
            onChange={(e) => setRepoModal(prev => ({ ...prev, obs: e.target.value }))}
            placeholder="Ex: Reposição do fornecedor X"
            className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-zinc-500 outline-none"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={saveRepoModal} disabled={repoModal.qty <= 0} className="flex-1 bg-emerald-600 text-white py-2 font-bold hover:bg-emerald-700 rounded-lg disabled:opacity-50">Repor</button>
          <button onClick={() => setRepoModal({ isOpen: false, item: null, qty: 0, obs: '' })} className="px-4 py-2 border border-zinc-700 text-zinc-400 rounded-lg hover:text-white hover:border-zinc-500">Cancelar</button>
        </div>
      </div>
    </Modal>

    {/* Movements History Modal */}
    <Modal isOpen={movementsModal.isOpen} onClose={() => setMovementsModal({ isOpen: false, productId: null, productName: '' })} title={`Histórico — ${movementsModal.productName}`} size="lg">
      <div className="max-h-96 overflow-y-auto">
        {movements.length === 0 ? (
          <p className="text-center text-zinc-500 py-8">Nenhuma movimentação registrada.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-zinc-500 border-b border-zinc-800">
                <th className="py-2 text-left">Data</th>
                <th className="py-2 text-left">Tipo</th>
                <th className="py-2 text-left">SKU</th>
                <th className="py-2 text-right">Qtd</th>
                <th className="py-2 text-left">Obs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {movements.map(m => (
                <tr key={m.id_movimentacao}>
                  <td className="py-2">{new Date(m.criado_em).toLocaleDateString('pt-BR')}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      m.tipo === 'venda' ? 'bg-blue-950 text-blue-400' :
                      m.tipo === 'reposicao' ? 'bg-emerald-950 text-emerald-400' :
                      m.tipo === 'devolucao' ? 'bg-purple-950 text-purple-400' :
                      'bg-zinc-800 text-zinc-400'
                    }`}>{m.tipo}</span>
                  </td>
                  <td className="py-2 font-mono text-xs">{m.sku_variacao}</td>
                  <td className="py-2 text-right font-bold">{m.tipo === 'venda' ? '-' : '+'}{m.quantidade}</td>
                  <td className="py-2 text-zinc-500 text-xs">{m.observacao || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Modal>
    </>
  );
}
