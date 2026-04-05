import React, { useState, useEffect, useCallback } from 'react';
import { Search, Eye, ChevronDown, ChevronUp, ChevronRight, Filter, Loader2, Clock } from 'lucide-react';
import Modal from '../Modal';
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
  pendente: 'bg-yellow-950 text-yellow-400',
  confirmado: 'bg-blue-950 text-blue-400',
  em_separacao: 'bg-purple-950 text-purple-400',
  enviado: 'bg-indigo-950 text-indigo-400',
  finalizado: 'bg-emerald-950 text-emerald-400',
  cancelado: 'bg-red-950 text-red-400',
};

const STATUS_DOT = {
  pendente: 'bg-yellow-400',
  confirmado: 'bg-blue-400',
  em_separacao: 'bg-purple-400',
  enviado: 'bg-indigo-400',
  finalizado: 'bg-emerald-400',
  cancelado: 'bg-red-400',
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

  const [stats, setStats] = useState({ totalRevenue: 0, ordersCount: 0, ticketMedio: 0, finalizados: 0 });

  const [orderModal, setOrderModal] = useState({ isOpen: false, order: null });
  const [orderHistory, setOrderHistory] = useState([]);
  const [statusSaving, setStatusSaving] = useState(false);

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
      const body = res.data;
      if (body?.data) {
        setOrders(body.data.map(mapOrder));
        setTotalOrders(body.total || 0);
        setTotalPages(body.totalPages || 1);

        // Always set stats — use aggregates when present, fallback to total count
        const agg = body.aggregates || {};
        setStats({
          totalRevenue: Number(agg.totalRevenue) || 0,
          ordersCount: body.total || 0,
          ticketMedio: Number(agg.avgTicket) || 0,
          finalizados: Number(agg.finalizados) || 0,
        });
      } else {
        // Unpaginated fallback
        const list = Array.isArray(body) ? body : [];
        setOrders(list.map(mapOrder));
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

  const openOrderModal = useCallback(async (order) => {
    setOrderModal({ isOpen: true, order });
    try {
      const res = await api.get(`/admin/orders/${order.rawId}/history`);
      setOrderHistory(res.data || []);
    } catch {
      setOrderHistory([]);
    }
  }, []);
  const closeOrderModal = useCallback(() => {
    setOrderModal({ isOpen: false, order: null });
    setOrderHistory([]);
  }, []);

  const handleStatusChange = useCallback(async (newStatus) => {
    const order = orderModal.order;
    if (!order) return;
    setStatusSaving(true);
    try {
      const res = await api.patch(`/admin/orders/${order.rawId}/status`, { status: newStatus });
      const data = res.data?.dados || res.data;
      toast.success(data?.mensagem || 'Status atualizado');
      const updatedOrder = { ...order, status: newStatus };
      setOrderModal(prev => ({ ...prev, order: updatedOrder }));
      setOrders(prev => prev.map(o => o.rawId === order.rawId ? { ...o, status: newStatus } : o));
      if (data?.historico) {
        setOrderHistory(data.historico);
      } else {
        const hRes = await api.get(`/admin/orders/${order.rawId}/history`);
        setOrderHistory(hRes.data || []);
      }
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.mensagem || 'Erro ao atualizar status');
    } finally {
      setStatusSaving(false);
    }
  }, [orderModal.order, toast, loadOrders]);

  const toggleSort = useCallback(() => {
    setSortByValue(prev => prev === null ? 'desc' : prev === 'desc' ? 'asc' : null);
    setPage(1);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 p-6 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all duration-300">
          <p className="text-zinc-500 text-sm font-medium">Total de Vendas</p>
          <h3 className="text-2xl font-bold mt-2 text-white">R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
        <div className="bg-zinc-900 p-6 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all duration-300">
          <p className="text-zinc-500 text-sm font-medium">Pedidos</p>
          <h3 className="text-2xl font-bold mt-2 text-white">{stats.ordersCount}</h3>
        </div>
        <div className="bg-zinc-900 p-6 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all duration-300">
          <p className="text-zinc-500 text-sm font-medium">Ticket Médio</p>
          <h3 className="text-2xl font-bold mt-2 text-white">R$ {stats.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
        <div className="bg-zinc-900 p-6 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all duration-300">
          <p className="text-zinc-500 text-sm font-medium">Finalizados</p>
          <h3 className="text-2xl font-bold mt-2 text-white">{stats.finalizados}</h3>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800 space-y-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input type="text" placeholder="Buscar por cliente..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:border-zinc-500 outline-none text-white placeholder-zinc-500" />
            </div>
            <select value={selectedStatus} onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
              className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg outline-none focus:border-zinc-500 text-white">
              <option value="all">Todos os Status</option>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <button onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-bold transition-colors ${hasActiveFilters ? 'border-white bg-white text-black' : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'}`}>
              <Filter size={16} /> Filtros
            </button>
          </div>

          {showFilters && (
            <div className="flex gap-4 items-end flex-wrap pt-2 border-t border-zinc-800">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Data início</label>
                <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }}
                  className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Data fim</label>
                <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }}
                  className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white" />
              </div>
              {hasActiveFilters && (
                <button onClick={handleResetFilters} className="text-xs text-zinc-500 hover:text-white underline pb-2">Limpar filtros</button>
              )}
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-800/50 text-xs font-bold uppercase text-zinc-500 border-b border-zinc-800">
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
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center"><Loader2 size={24} className="animate-spin mx-auto text-zinc-500" /></td></tr>
              ) : orders.map((order) => (
                <tr key={order.rawId} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-sm text-white">{order.id}</td>
                  <td className="px-6 py-4"><div className="font-medium text-sm text-zinc-200">{order.client}</div><div className="text-[12px] text-zinc-500">{order.email}</div></td>
                  <td className="px-6 py-4 text-sm text-zinc-400">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</td>
                  <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase ${STATUS_COLORS[order.status] || 'bg-zinc-800 text-zinc-400'}`}>{STATUS_LABELS[order.status] || order.status}</span></td>
                  <td className="px-6 py-4 font-bold text-sm text-white">R$ {order.total.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-zinc-500">{new Date(order.date).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openOrderModal(order)} className="p-2 text-zinc-500 hover:text-white transition-colors"><Eye size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Modal isOpen={orderModal.isOpen} onClose={closeOrderModal} title={`Detalhes do pedido ${orderModal.order?.id || ''}`} size="lg">
          {orderModal.order && (() => {
            const order = orderModal.order;
            const nextStatuses = TRANSITIONS[order.status] || [];
            return (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-zinc-500 font-bold uppercase">Cliente</p><p className="text-sm font-bold text-white">{order.client}</p></div>
                <div><p className="text-xs text-zinc-500 font-bold uppercase">Email</p><p className="text-sm text-zinc-300">{order.email}</p></div>
                {order.phone && <div><p className="text-xs text-zinc-500 font-bold uppercase">Telefone</p><p className="text-sm text-zinc-300">{order.phone}</p></div>}
                <div><p className="text-xs text-zinc-500 font-bold uppercase">Status</p><span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase ${STATUS_COLORS[order.status]}`}>{STATUS_LABELS[order.status]}</span></div>
              </div>

              {nextStatuses.length > 0 && (
                <div className="border-t border-zinc-800 pt-4">
                  <p className="text-xs text-zinc-500 font-bold uppercase mb-3">Atualizar Status</p>
                  <div className="flex flex-wrap gap-2">
                    {nextStatuses.map(ns => (
                      <button key={ns} onClick={() => handleStatusChange(ns)} disabled={statusSaving}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50
                          ${ns === 'cancelado'
                            ? 'border border-red-800 text-red-400 hover:bg-red-950'
                            : 'bg-white text-black hover:bg-zinc-200'}`}>
                        {statusSaving && <Loader2 size={14} className="animate-spin" />}
                        <span>{STATUS_LABELS[order.status]}</span>
                        <ChevronRight size={14} />
                        <span>{STATUS_LABELS[ns]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {nextStatuses.length === 0 && (
                <div className="border-t border-zinc-800 pt-4">
                  <p className="text-xs text-zinc-500 font-bold uppercase mb-2">Status Final</p>
                  <p className="text-sm text-zinc-400">Este pedido está em estado terminal e não pode mais ser alterado.</p>
                </div>
              )}

              {order.address && (
                <div className="border-t border-zinc-800 pt-4">
                  <p className="text-xs text-zinc-500 font-bold uppercase mb-2">Endereço</p>
                  <p className="text-sm text-zinc-300">{order.address.logradouro}, {order.address.numero}{order.address.complemento ? ` - ${order.address.complemento}` : ''}</p>
                  <p className="text-sm text-zinc-500">{order.address.cidade} - {order.address.estado}, CEP: {order.address.cep}</p>
                </div>
              )}
              <div className="border-t border-zinc-800 pt-4">
                <p className="text-xs text-zinc-500 font-bold uppercase mb-3">Itens</p>
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-zinc-800 p-3 rounded-lg">
                      <div><p className="text-sm font-bold text-white">{item.name}</p>{item.size && <p className="text-xs text-zinc-500">Tam: {item.size}</p>}</div>
                      <div className="text-right"><p className="text-sm font-bold text-white">R$ {(item.price * item.qty).toFixed(2)}</p><p className="text-xs text-zinc-500">{item.qty}x R$ {item.price.toFixed(2)}</p></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-zinc-800 pt-4 space-y-1">
                <div className="flex justify-between text-sm"><span className="text-zinc-500">Subtotal</span><span className="text-zinc-300">R$ {order.subtotal.toFixed(2)}</span></div>
                {order.desconto > 0 && <div className="flex justify-between text-sm"><span className="text-zinc-500">Desconto</span><span className="text-emerald-400">-R$ {order.desconto.toFixed(2)}</span></div>}
                {order.frete > 0 && <div className="flex justify-between text-sm"><span className="text-zinc-500">Frete</span><span className="text-zinc-300">R$ {order.frete.toFixed(2)}</span></div>}
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-zinc-800"><span className="text-white">Total</span><span className="text-white">R$ {order.total.toFixed(2)}</span></div>
                {order.metodo_pagamento && <p className="text-xs text-zinc-500 pt-1">Pagamento: {order.metodo_pagamento}</p>}
              </div>

              {orderHistory.length > 0 && (
                <div className="border-t border-zinc-800 pt-4">
                  <p className="text-xs text-zinc-500 font-bold uppercase mb-3 flex items-center gap-2"><Clock size={14} /> Histórico</p>
                  <div className="space-y-0">
                    {orderHistory.map((h, i) => (
                      <div key={h.id_historico} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${STATUS_DOT[h.status_para] || 'bg-zinc-500'}`} />
                          {i < orderHistory.length - 1 && <div className="w-px flex-1 bg-zinc-800 my-1" />}
                        </div>
                        <div className="pb-4">
                          <div className="flex items-center gap-2">
                            {h.status_de && <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${STATUS_COLORS[h.status_de] || 'bg-zinc-800 text-zinc-400'}`}>{STATUS_LABELS[h.status_de] || h.status_de}</span>}
                            {h.status_de && h.status_para && <ChevronRight size={12} className="text-zinc-600" />}
                            {h.status_para && <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${STATUS_COLORS[h.status_para] || 'bg-zinc-800 text-zinc-400'}`}>{STATUS_LABELS[h.status_para] || h.status_para}</span>}
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-1">{h.autor} · {new Date(h.criado_em).toLocaleString('pt-BR')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            );
          })()}
        </Modal>

        {!loading && orders.length === 0 && (
          <div className="p-12 text-center text-zinc-500"><p>Nenhum pedido encontrado.</p></div>
        )}

        <div className="px-6 pb-4">
          <Pagination page={page} totalPages={totalPages} total={totalOrders} limit={PAGE_SIZE} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
