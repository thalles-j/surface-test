import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Eye, Edit, ChevronDown, ChevronUp, Filter, Loader2 } from 'lucide-react';
import Modal from '../Modal';
import AlertModal from '../AlertModal';
import Pagination from './Pagination';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const STATUS_LABELS = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  em_separacao: 'Em Separação',
  enviado: 'Enviado',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
};

const STATUS_COLORS = {
  pendente: 'bg-yellow-100 text-yellow-700',
  confirmado: 'bg-blue-100 text-blue-700',
  em_separacao: 'bg-purple-100 text-purple-700',
  enviado: 'bg-indigo-100 text-indigo-700',
  finalizado: 'bg-green-100 text-green-700',
  cancelado: 'bg-red-100 text-red-700',
};

const TRANSITIONS = {
  pendente: ['confirmado', 'cancelado'],
  confirmado: ['em_separacao', 'cancelado'],
  em_separacao: ['enviado', 'cancelado'],
  enviado: ['finalizado'],
  finalizado: [],
  cancelado: [],
};

const PAGE_SIZE = 15;

export default function Sales() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortByValue, setSortByValue] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [orderModal, setOrderModal] = useState({ isOpen: false, order: null });
  const [statusModal, setStatusModal] = useState({ isOpen: false, order: null, status: '' });

  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('');
  const [confirmBulk, setConfirmBulk] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const mapOrder = useCallback((o) => ({
    id: `#${o.id_pedido}`,
    rawId: o.id_pedido,
    client: o.usuario?.nome || '—',
    email: o.usuario?.email || '',
    phone: o.usuario?.telefone || '',
    address: o.usuario?.enderecos?.[0] || null,
    total: Number(o.total || 0),
    subtotal: Number(o.subtotal || o.total || 0),
    frete: Number(o.frete || 0),
    desconto: Number(o.desconto || 0),
    status: o.status || 'pendente',
    date: o.data_pedido,
    metodo_pagamento: o.metodo_pagamento || '',
    codigo_cupom: o.codigo_cupom || '',
    items: (o.pedidoProdutos || []).map(pp => ({
      name: pp.produto?.nome_produto || 'Produto',
      qty: pp.quantidade || 1,
      price: Number(pp.preco_unitario || pp.produto?.preco || 0),
      size: pp.tamanho || '',
    })),
  }), []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: PAGE_SIZE });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (selectedStatus !== 'all') params.set('status', selectedStatus);
      if (sortByValue) { params.set('sortBy', 'total'); params.set('sortDir', sortByValue); }
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await api.get(`/admin/sales?${params}`);
      if (res.data?.data) {
        setOrders(res.data.data.map(mapOrder));
        setTotalOrders(res.data.total);
        setTotalPages(res.data.totalPages);
      } else {
        setOrders((res.data || []).map(mapOrder));
      }
    } catch (err) {
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, selectedStatus, sortByValue, startDate, endDate, mapOrder, toast]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const hasActiveFilters = selectedStatus !== 'all' || debouncedSearch || startDate || endDate;

  const handleResetFilters = useCallback(() => {
    setSelectedStatus('all');
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setSortByValue(null);
    setPage(1);
  }, []);

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
    return {
      totalRevenue,
      ordersCount: totalOrders,
      ticketMedio: orders.length > 0 ? totalRevenue / orders.length : 0,
      finalizados: orders.filter(o => o.status === 'finalizado').length,
    };
  }, [orders, totalOrders]);

  const openOrderModal = useCallback((order) => setOrderModal({ isOpen: true, order }), []);
  const closeOrderModal = useCallback(() => setOrderModal({ isOpen: false, order: null }), []);

  const openStatusModal = useCallback((order) => {
    const nextStatuses = TRANSITIONS[order.status] || [];
    setStatusModal({ isOpen: true, order, status: nextStatuses[0] || order.status });
  }, []);
  const closeStatusModal = useCallback(() => setStatusModal({ isOpen: false, order: null, status: '' }), []);

  const saveOrderStatus = useCallback(async () => {
    try {
      if (!statusModal.order) return;
      await api.patch(`/admin/orders/${statusModal.order.rawId}/status`, { status: statusModal.status });
      toast.success('Status atualizado');
      closeStatusModal();
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.mensagem || 'Erro ao atualizar status');
    }
  }, [statusModal, closeStatusModal, loadOrders, toast]);

  const toggleSort = useCallback(() => {
    setSortByValue(prev => prev === null ? 'desc' : prev === 'desc' ? 'asc' : null);
    setPage(1);
  }, []);

  const allSelected = orders.length > 0 && selectedIds.length === orders.length;
  const toggleSelectAll = useCallback(() => {
    setSelectedIds(allSelected ? [] : orders.map(o => o.rawId));
  }, [allSelected, orders]);

  const toggleSelect = useCallback((id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const handleBulkStatus = useCallback(async () => {
    if (!bulkStatus || selectedIds.length === 0) return;
    try {
      const res = await api.patch('/admin/orders/bulk-status', { ids: selectedIds, status: bulkStatus });
      toast.success(res.data?.mensagem || 'Status atualizados');
      setSelectedIds([]);
      setBulkStatus('');
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.mensagem || 'Erro na ação em lote');
    }
    setConfirmBulk(false);
  }, [bulkStatus, selectedIds, loadOrders, toast]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 border border-gray-100 rounded-lg">
          <p className="text-gray-500 text-sm font-medium">Total de Vendas</p>
          <h3 className="text-2xl font-bold mt-2">R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
        <div className="bg-white p-6 border border-gray-100 rounded-lg">
          <p className="text-gray-500 text-sm font-medium">Pedidos</p>
          <h3 className="text-2xl font-bold mt-2">{stats.ordersCount}</h3>
        </div>
        <div className="bg-white p-6 border border-gray-100 rounded-lg">
          <p className="text-gray-500 text-sm font-medium">Ticket Médio</p>
          <h3 className="text-2xl font-bold mt-2">R$ {stats.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
        <div className="bg-white p-6 border border-gray-100 rounded-lg">
          <p className="text-gray-500 text-sm font-medium">Finalizados</p>
          <h3 className="text-2xl font-bold mt-2">{stats.finalizados}</h3>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100 space-y-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Buscar por cliente..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-black outline-none" />
            </div>
            <select value={selectedStatus} onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
              className="px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-black bg-white">
              <option value="all">Todos os Status</option>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <button onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-bold transition-colors ${hasActiveFilters ? 'border-black bg-black text-white' : 'border-gray-200 hover:bg-gray-50'}`}>
              <Filter size={16} /> Filtros
            </button>
          </div>

          {showFilters && (
            <div className="flex gap-4 items-end flex-wrap pt-2 border-t border-gray-100">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Data início</label>
                <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }}
                  className="p-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Data fim</label>
                <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }}
                  className="p-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              {hasActiveFilters && (
                <button onClick={handleResetFilters} className="text-xs text-gray-500 hover:text-black underline pb-2">Limpar filtros</button>
              )}
            </div>
          )}

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <span className="text-sm font-bold text-gray-600">{selectedIds.length} selecionado(s)</span>
              <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}
                className="p-2 border border-gray-200 rounded-lg text-sm bg-white">
                <option value="">Alterar status para...</option>
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <button onClick={() => { if (bulkStatus) setConfirmBulk(true); }} disabled={!bulkStatus}
                className="px-4 py-2 bg-black text-white rounded-lg text-sm font-bold disabled:opacity-30 hover:bg-zinc-800 transition-colors">Aplicar</button>
              <button onClick={() => setSelectedIds([])} className="text-xs text-gray-400 hover:text-black ml-auto">Limpar seleção</button>
            </div>
          )}
        </div>

        <AlertModal isOpen={confirmBulk} onClose={() => setConfirmBulk(false)}
          title="Ação em lote"
          message={`Alterar status de ${selectedIds.length} pedido(s) para "${STATUS_LABELS[bulkStatus] || bulkStatus}"?`}
          type="warning" actionLabel="Confirmar" actionCallback={handleBulkStatus} />

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-gray-100">
                <th className="px-4 py-4 w-10"><input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="w-4 h-4" /></th>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Itens</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 cursor-pointer select-none" onClick={toggleSort}>
                  <span className="inline-flex items-center gap-1">Total {sortByValue === 'desc' && <ChevronDown size={12} />}{sortByValue === 'asc' && <ChevronUp size={12} />}</span>
                </th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="py-12 text-center"><Loader2 size={24} className="animate-spin mx-auto text-gray-400" /></td></tr>
              ) : orders.map((order) => (
                <tr key={order.rawId} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(order.rawId) ? 'bg-blue-50' : ''}`}>
                  <td className="px-4 py-4"><input type="checkbox" checked={selectedIds.includes(order.rawId)} onChange={() => toggleSelect(order.rawId)} className="w-4 h-4" /></td>
                  <td className="px-6 py-4 font-bold text-sm">{order.id}</td>
                  <td className="px-6 py-4"><div className="font-medium text-sm">{order.client}</div><div className="text-[12px] text-gray-400">{order.email}</div></td>
                  <td className="px-6 py-4 text-sm">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</td>
                  <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>{STATUS_LABELS[order.status] || order.status}</span></td>
                  <td className="px-6 py-4 font-bold text-sm">R$ {order.total.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(order.date).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => openOrderModal(order)} className="p-2 text-gray-400 hover:text-black transition-colors"><Eye size={16} /></button>
                    {(TRANSITIONS[order.status] || []).length > 0 && (
                      <button onClick={() => openStatusModal(order)} className="p-2 text-gray-400 hover:text-black transition-colors"><Edit size={16} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Modal isOpen={orderModal.isOpen} onClose={closeOrderModal} title={`Detalhes do pedido ${orderModal.order?.id || ''}`} size="lg">
          {orderModal.order && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-400 font-bold uppercase">Cliente</p><p className="text-sm font-bold">{orderModal.order.client}</p></div>
                <div><p className="text-xs text-gray-400 font-bold uppercase">Email</p><p className="text-sm">{orderModal.order.email}</p></div>
                {orderModal.order.phone && <div><p className="text-xs text-gray-400 font-bold uppercase">Telefone</p><p className="text-sm">{orderModal.order.phone}</p></div>}
                <div><p className="text-xs text-gray-400 font-bold uppercase">Status</p><span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase ${STATUS_COLORS[orderModal.order.status]}`}>{STATUS_LABELS[orderModal.order.status]}</span></div>
              </div>
              {orderModal.order.address && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs text-gray-400 font-bold uppercase mb-2">Endereço</p>
                  <p className="text-sm">{orderModal.order.address.logradouro}, {orderModal.order.address.numero}{orderModal.order.address.complemento ? ` - ${orderModal.order.address.complemento}` : ''}</p>
                  <p className="text-sm text-gray-500">{orderModal.order.address.cidade} - {orderModal.order.address.estado}, CEP: {orderModal.order.address.cep}</p>
                </div>
              )}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-400 font-bold uppercase mb-3">Itens</p>
                <div className="space-y-2">
                  {orderModal.order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                      <div><p className="text-sm font-bold">{item.name}</p>{item.size && <p className="text-xs text-gray-400">Tam: {item.size}</p>}</div>
                      <div className="text-right"><p className="text-sm font-bold">R$ {(item.price * item.qty).toFixed(2)}</p><p className="text-xs text-gray-400">{item.qty}x R$ {item.price.toFixed(2)}</p></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-gray-100 pt-4 space-y-1">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>R$ {orderModal.order.subtotal.toFixed(2)}</span></div>
                {orderModal.order.desconto > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Desconto</span><span className="text-green-600">-R$ {orderModal.order.desconto.toFixed(2)}</span></div>}
                {orderModal.order.frete > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Frete</span><span>R$ {orderModal.order.frete.toFixed(2)}</span></div>}
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-gray-100"><span>Total</span><span>R$ {orderModal.order.total.toFixed(2)}</span></div>
                {orderModal.order.metodo_pagamento && <p className="text-xs text-gray-400 pt-1">Pagamento: {orderModal.order.metodo_pagamento}</p>}
              </div>
            </div>
          )}
        </Modal>

        <Modal isOpen={statusModal.isOpen} onClose={closeStatusModal} title={`Atualizar status ${statusModal.order?.id || ''}`}>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-400 mb-2">Status atual: <strong>{STATUS_LABELS[statusModal.order?.status] || statusModal.order?.status}</strong></p>
              <select value={statusModal.status} onChange={(e) => setStatusModal(prev => ({ ...prev, status: e.target.value }))} className="w-full p-2 border rounded">
                {(TRANSITIONS[statusModal.order?.status] || []).map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={saveOrderStatus} className="flex-1 bg-black text-white py-2 rounded font-bold">Salvar</button>
              <button onClick={closeStatusModal} className="px-4 py-2 border rounded">Cancelar</button>
            </div>
          </div>
        </Modal>

        {!loading && orders.length === 0 && (
          <div className="p-12 text-center text-gray-400"><p>Nenhum pedido encontrado.</p></div>
        )}

        <div className="px-6 pb-4">
          <Pagination page={page} totalPages={totalPages} total={totalOrders} limit={PAGE_SIZE} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
