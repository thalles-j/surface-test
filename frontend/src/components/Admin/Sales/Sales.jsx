import React, { useState, useEffect, useCallback } from 'react';
import { Search, Eye, ChevronDown, ChevronUp, Filter, Loader2, Edit, Save, ArrowRight, Clock, Package, Truck, CheckCircle, XCircle, MapPin, CreditCard, User, Hash, Calendar, ShoppingBag } from 'lucide-react';
import Modal from '../../Modal';
import Pagination from '../Pagination/Pagination';
import { api } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';

const STATUS_LABELS = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  em_separacao: 'Em Separação',
  enviado: 'Enviado',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
  processando: 'Processando',
  concluido: 'Concluído',
};

const STATUS_COLORS = {
  pendente: 'bg-yellow-950 text-yellow-400',
  confirmado: 'bg-blue-950 text-blue-400',
  em_separacao: 'bg-purple-950 text-purple-400',
  enviado: 'bg-indigo-950 text-indigo-400',
  finalizado: 'bg-emerald-950 text-emerald-400',
  cancelado: 'bg-red-950 text-red-400',
  processando: 'bg-cyan-950 text-cyan-400',
  concluido: 'bg-emerald-950 text-emerald-400',
};

const STATUS_TRANSITIONS = {
  pendente: ['confirmado', 'cancelado'],
  confirmado: ['em_separacao', 'cancelado'],
  em_separacao: ['enviado', 'cancelado'],
  enviado: ['finalizado'],
  finalizado: [],
  cancelado: [],
  processando: ['enviado', 'finalizado', 'cancelado'],
  concluido: [],
};

const STATUS_ICONS = {
  pendente: Clock,
  confirmado: CheckCircle,
  em_separacao: Package,
  enviado: Truck,
  finalizado: CheckCircle,
  cancelado: XCircle,
  processando: Package,
  concluido: CheckCircle,
};

const STATUS_ACTION_COLORS = {
  confirmado: 'bg-blue-600 hover:bg-blue-500 text-white',
  em_separacao: 'bg-purple-600 hover:bg-purple-500 text-white',
  enviado: 'bg-indigo-600 hover:bg-indigo-500 text-white',
  finalizado: 'bg-emerald-600 hover:bg-emerald-500 text-white',
  cancelado: 'bg-red-900 hover:bg-red-800 text-red-300 border border-red-800',
  processando: 'bg-cyan-600 hover:bg-cyan-500 text-white',
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

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const mapOrder = useCallback((o) => ({
    id: `#${o.id_pedido}`,
    rawId: o.id_pedido,
    client: o.usuario?.nome || o.nome_cliente || '—',
    email: o.usuario?.email || '',
    phone: o.usuario?.telefone || '',
    address: o.usuario?.enderecos?.[0] || null,
    endereco_entrega: o.endereco_entrega || null,
    total: Number(o.total || 0),
    subtotal: Number(o.subtotal || o.total || 0),
    frete: Number(o.frete || 0),
    desconto: Number(o.desconto || 0),
    status: o.status || 'pendente',
    date: o.data_pedido,
    metodo_pagamento: o.metodo_pagamento || '',
    codigo_cupom: o.codigo_cupom || '',
    origem: o.origem || 'online',
    items: (o.pedidoProdutos || []).map(pp => ({
      id_produto: pp.id_produto,
      name: pp.produto?.nome_produto || 'Produto',
      qty: pp.quantidade || 1,
      price: Number(pp.preco_unitario || pp.produto?.preco || 0),
      size: pp.sku_variacao || pp.tamanho || '',
      sku_variacao: pp.sku_variacao || '',
    })),
    historico: (o.historico || []).map(h => ({
      tipo: h.tipo,
      descricao: h.descricao,
      status_de: h.status_de,
      status_para: h.status_para,
      autor: h.autor,
      data: h.criado_em,
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
        if (res.data.aggregates) {
          setStats({
            totalRevenue: res.data.aggregates.totalRevenue || 0,
            ordersCount: res.data.total || 0,
            ticketMedio: res.data.aggregates.avgTicket || 0,
            finalizados: res.data.aggregates.finalizados || 0,
          });
        }
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

  const openOrderModal = useCallback((order) => setOrderModal({ isOpen: true, order }), []);
  const closeOrderModal = useCallback(() => { setOrderModal({ isOpen: false, order: null }); setEditMode(null); }, []);

  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [editMode, setEditMode] = useState(null); // null | 'items' | 'address'
  const [editItems, setEditItems] = useState([]);
  const [editAddress, setEditAddress] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  const handleUpdateStatus = useCallback(async (orderId, newStatus) => {
    setUpdatingStatus(true);
    try {
      const res = await api.patch(`/admin/orders/${orderId}/status`, { status: newStatus });
      const updatedPedido = res.data?.pedido;
      toast.success(`Status atualizado para ${STATUS_LABELS[newStatus]}`);
      if (updatedPedido) {
        const mapped = mapOrder(updatedPedido);
        setOrderModal(prev => prev.order?.rawId === orderId ? { ...prev, order: mapped } : prev);
        setOrders(prev => prev.map(o => o.rawId === orderId ? mapped : o));
      } else {
        loadOrders();
      }
    } catch (err) {
      toast.error(err.response?.data?.mensagem || 'Erro ao atualizar status');
    } finally {
      setUpdatingStatus(false);
    }
  }, [loadOrders, mapOrder, toast]);

  const startEditItems = useCallback((order) => {
    setEditItems(order.items.map(i => ({ ...i })));
    setEditMode('items');
  }, []);

  const startEditAddress = useCallback((order) => {
    const addr = order.endereco_entrega || order.address || {};
    setEditAddress({ logradouro: addr.logradouro || '', numero: addr.numero || '', complemento: addr.complemento || '', cidade: addr.cidade || '', estado: addr.estado || '', cep: addr.cep || '' });
    setEditMode('address');
  }, []);

  const saveEditItems = useCallback(async (orderId) => {
    setSavingEdit(true);
    try {
      await api.put(`/admin/orders/${orderId}/items`, {
        items: editItems.map(i => ({
          id_produto: i.id_produto,
          sku_variacao: i.sku_variacao || i.size,
          quantidade: Number(i.qty),
          preco_unitario: Number(i.price),
        })),
      });
      toast.success('Itens atualizados');
      setEditMode(null);
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.mensagem || 'Erro ao atualizar itens');
    } finally {
      setSavingEdit(false);
    }
  }, [editItems, loadOrders, toast]);

  const saveEditAddress = useCallback(async (orderId) => {
    setSavingEdit(true);
    try {
      await api.patch(`/admin/orders/${orderId}/address`, { endereco_entrega: editAddress });
      toast.success('Endereço atualizado');
      setEditMode(null);
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.mensagem || 'Erro ao atualizar endereço');
    } finally {
      setSavingEdit(false);
    }
  }, [editAddress, loadOrders, toast]);

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

        <Modal isOpen={orderModal.isOpen} onClose={closeOrderModal} title={`Pedido ${orderModal.order?.id || ''}`} size="lg" variant="dark">
          {orderModal.order && (() => {
            const o = orderModal.order;
            const nextStatuses = STATUS_TRANSITIONS[o.status] || [];
            const addr = o.endereco_entrega || o.address;

            return (
              <div className="space-y-6">

                {/* ── HEADER: ID + Status + Origin + Date ── */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase ${STATUS_COLORS[o.status]}`}>
                    {(() => { const Icon = STATUS_ICONS[o.status]; return Icon ? <Icon size={12} /> : null; })()}
                    {STATUS_LABELS[o.status]}
                  </span>
                  {o.origem === 'presencial' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold uppercase bg-orange-950 text-orange-400">
                      <ShoppingBag size={12} /> Presencial
                    </span>
                  )}
                  <span className="text-xs text-zinc-500 ml-auto flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(o.date).toLocaleDateString('pt-BR')} às {new Date(o.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* ── STATUS UPDATE ── */}
                {nextStatuses.length > 0 && (
                  <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Atualizar Status</p>
                    <div className="flex flex-wrap gap-2">
                      {nextStatuses.map(ns => {
                        const Icon = STATUS_ICONS[ns];
                        return (
                          <button
                            key={ns}
                            onClick={() => handleUpdateStatus(o.rawId, ns)}
                            disabled={updatingStatus}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed ${STATUS_ACTION_COLORS[ns] || 'bg-zinc-700 text-white'}`}
                          >
                            {updatingStatus ? <Loader2 size={12} className="animate-spin" /> : Icon ? <Icon size={12} /> : <ArrowRight size={12} />}
                            {ns === 'cancelado' ? 'Cancelar Pedido' : `Mover para ${STATUS_LABELS[ns]}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── CLIENT INFO ── */}
                <div className="bg-zinc-800/50 rounded-lg p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-1.5"><User size={12} /> Cliente</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-zinc-500">Nome</p>
                      <p className="text-sm font-semibold text-white">{o.client}</p>
                    </div>
                    {o.email && (
                      <div>
                        <p className="text-xs text-zinc-500">Email</p>
                        <p className="text-sm text-zinc-300">{o.email}</p>
                      </div>
                    )}
                    {o.phone && (
                      <div>
                        <p className="text-xs text-zinc-500">Telefone</p>
                        <p className="text-sm text-zinc-300">{o.phone}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── ADDRESS — Editable ── */}
                <div className="bg-zinc-800/50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1.5"><MapPin size={12} /> Endereço de Entrega</p>
                    {editMode !== 'address' && (
                      <button onClick={() => startEditAddress(o)} className="text-[10px] text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"><Edit size={11} /> Editar</button>
                    )}
                  </div>
                  {editMode === 'address' ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input value={editAddress.logradouro} onChange={e => setEditAddress(a => ({ ...a, logradouro: e.target.value }))} placeholder="Logradouro" className="p-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-600 focus:border-zinc-500 outline-none" />
                        <input value={editAddress.numero} onChange={e => setEditAddress(a => ({ ...a, numero: e.target.value }))} placeholder="Número" className="p-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-600 focus:border-zinc-500 outline-none" />
                      </div>
                      <input value={editAddress.complemento} onChange={e => setEditAddress(a => ({ ...a, complemento: e.target.value }))} placeholder="Complemento" className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-600 focus:border-zinc-500 outline-none" />
                      <div className="grid grid-cols-3 gap-2">
                        <input value={editAddress.cidade} onChange={e => setEditAddress(a => ({ ...a, cidade: e.target.value }))} placeholder="Cidade" className="p-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-600 focus:border-zinc-500 outline-none" />
                        <input value={editAddress.estado} onChange={e => setEditAddress(a => ({ ...a, estado: e.target.value }))} placeholder="UF" className="p-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-600 focus:border-zinc-500 outline-none" />
                        <input value={editAddress.cep} onChange={e => setEditAddress(a => ({ ...a, cep: e.target.value }))} placeholder="CEP" className="p-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-600 focus:border-zinc-500 outline-none" />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button onClick={() => saveEditAddress(o.rawId)} disabled={savingEdit} className="flex items-center gap-1.5 px-4 py-2 bg-white text-black rounded-lg text-xs font-bold disabled:opacity-50 transition-opacity"><Save size={12} /> Salvar</button>
                        <button onClick={() => setEditMode(null)} className="px-4 py-2 border border-zinc-700 text-zinc-400 rounded-lg text-xs font-bold hover:border-zinc-500 transition-colors">Cancelar</button>
                      </div>
                    </div>
                  ) : addr ? (
                    <div>
                      <p className="text-sm text-zinc-300">{addr.logradouro}, {addr.numero}{addr.complemento ? ` — ${addr.complemento}` : ''}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{addr.cidade} — {addr.estado}, CEP {addr.cep}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-600 italic">Sem endereço cadastrado</p>
                  )}
                </div>

                {/* ── ITEMS — Editable ── */}
                <div className="bg-zinc-800/50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1.5"><Package size={12} /> Itens ({o.items.length})</p>
                    {editMode !== 'items' && (
                      <button onClick={() => startEditItems(o)} className="text-[10px] text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"><Edit size={11} /> Editar</button>
                    )}
                  </div>
                  {editMode === 'items' ? (
                    <div className="space-y-2">
                      {editItems.map((item, idx) => (
                        <div key={idx} className="flex gap-2 items-center bg-zinc-900 p-3 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{item.name}</p>
                            {item.size && <p className="text-[10px] text-zinc-500">Tam: {item.size}</p>}
                          </div>
                          <label className="text-[10px] text-zinc-500">Qtd</label>
                          <input value={item.qty} onChange={e => setEditItems(prev => { const n = [...prev]; n[idx] = { ...n[idx], qty: e.target.value }; return n; })} type="number" min="1" className="w-14 p-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-center text-white focus:border-zinc-500 outline-none" />
                          <label className="text-[10px] text-zinc-500">R$</label>
                          <input value={item.price} onChange={e => setEditItems(prev => { const n = [...prev]; n[idx] = { ...n[idx], price: e.target.value }; return n; })} type="number" step="0.01" className="w-24 p-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:border-zinc-500 outline-none" />
                        </div>
                      ))}
                      <div className="flex gap-2 pt-2">
                        <button onClick={() => saveEditItems(o.rawId)} disabled={savingEdit} className="flex items-center gap-1.5 px-4 py-2 bg-white text-black rounded-lg text-xs font-bold disabled:opacity-50 transition-opacity"><Save size={12} /> Salvar</button>
                        <button onClick={() => setEditMode(null)} className="px-4 py-2 border border-zinc-700 text-zinc-400 rounded-lg text-xs font-bold hover:border-zinc-500 transition-colors">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {o.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-zinc-900 px-3 py-2.5 rounded-lg">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-white truncate">{item.name}</p>
                            {item.size && <p className="text-[10px] text-zinc-500 mt-0.5">Tam: {item.size}</p>}
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            <p className="text-sm font-bold text-white">R$ {(item.price * item.qty).toFixed(2)}</p>
                            <p className="text-[10px] text-zinc-500">{item.qty}x R$ {item.price.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── FINANCIAL BREAKDOWN ── */}
                <div className="bg-zinc-800/50 rounded-lg p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-1.5"><CreditCard size={12} /> Resumo Financeiro</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-zinc-400">Subtotal</span><span className="text-zinc-300">R$ {o.subtotal.toFixed(2)}</span></div>
                    {o.desconto > 0 && <div className="flex justify-between text-sm"><span className="text-zinc-400">Desconto {o.codigo_cupom ? <span className="text-[10px] text-emerald-500">({o.codigo_cupom})</span> : ''}</span><span className="text-emerald-400">-R$ {o.desconto.toFixed(2)}</span></div>}
                    {o.frete > 0 ? (
                      <div className="flex justify-between text-sm"><span className="text-zinc-400">Frete</span><span className="text-zinc-300">R$ {o.frete.toFixed(2)}</span></div>
                    ) : (
                      <div className="flex justify-between text-sm"><span className="text-zinc-400">Frete</span><span className="text-emerald-400 text-xs">Grátis</span></div>
                    )}
                    <div className="border-t border-zinc-700 pt-2 mt-2 flex justify-between text-sm font-bold">
                      <span className="text-white">Total</span>
                      <span className="text-white text-base">R$ {o.total.toFixed(2)}</span>
                    </div>
                    {o.metodo_pagamento && (
                      <p className="text-[10px] text-zinc-500 pt-1">Pagamento: {o.metodo_pagamento}</p>
                    )}
                  </div>
                </div>

                {/* ── TIMELINE / HISTORICO ── */}
                {o.historico && o.historico.length > 0 && (
                  <div className="bg-zinc-800/50 rounded-lg p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-1.5"><Clock size={12} /> Histórico</p>
                    <div className="space-y-0">
                      {o.historico.map((h, idx) => (
                        <div key={idx} className="flex gap-3 relative">
                          <div className="flex flex-col items-center">
                            <div className="w-2 h-2 rounded-full bg-zinc-600 mt-1.5 shrink-0" />
                            {idx < o.historico.length - 1 && <div className="w-px flex-1 bg-zinc-700" />}
                          </div>
                          <div className="pb-3 min-w-0">
                            <p className="text-xs text-zinc-300">{h.descricao}</p>
                            <p className="text-[10px] text-zinc-600 mt-0.5">
                              {new Date(h.data).toLocaleDateString('pt-BR')} às {new Date(h.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              {h.autor && <span> · {h.autor}</span>}
                            </p>
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
