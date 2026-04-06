import React, { useState, useEffect, useCallback } from 'react';
import { Search, Eye, ChevronDown, ChevronUp, Filter, Loader2, Edit, Save } from 'lucide-react';
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
};

const STATUS_COLORS = {
  pendente: 'bg-yellow-950 text-yellow-400',
  confirmado: 'bg-blue-950 text-blue-400',
  em_separacao: 'bg-purple-950 text-purple-400',
  enviado: 'bg-indigo-950 text-indigo-400',
  finalizado: 'bg-emerald-950 text-emerald-400',
  cancelado: 'bg-red-950 text-red-400',
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

  const [editMode, setEditMode] = useState(null); // null | 'items' | 'address'
  const [editItems, setEditItems] = useState([]);
  const [editAddress, setEditAddress] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

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

        <Modal isOpen={orderModal.isOpen} onClose={closeOrderModal} title={`Detalhes do pedido ${orderModal.order?.id || ''}`} size="lg">
          {orderModal.order && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-zinc-500 font-bold uppercase">Cliente</p><p className="text-sm font-bold text-white">{orderModal.order.client}</p></div>
                <div><p className="text-xs text-zinc-500 font-bold uppercase">Email</p><p className="text-sm text-zinc-300">{orderModal.order.email}</p></div>
                {orderModal.order.phone && <div><p className="text-xs text-zinc-500 font-bold uppercase">Telefone</p><p className="text-sm text-zinc-300">{orderModal.order.phone}</p></div>}
                <div><p className="text-xs text-zinc-500 font-bold uppercase">Status</p><span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase ${STATUS_COLORS[orderModal.order.status]}`}>{STATUS_LABELS[orderModal.order.status]}</span></div>
                {orderModal.order.origem === 'presencial' && <div><p className="text-xs text-zinc-500 font-bold uppercase">Origem</p><span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase bg-orange-950 text-orange-400">Presencial</span></div>}
              </div>

              {/* ADDRESS — Editable */}
              <div className="border-t border-zinc-800 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs text-zinc-500 font-bold uppercase">Endereço de Entrega</p>
                  {editMode !== 'address' && (
                    <button onClick={() => startEditAddress(orderModal.order)} className="text-xs text-zinc-500 hover:text-white flex items-center gap-1"><Edit size={12} /> Editar</button>
                  )}
                </div>
                {editMode === 'address' ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input value={editAddress.logradouro} onChange={e => setEditAddress(a => ({ ...a, logradouro: e.target.value }))} placeholder="Logradouro" className="p-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white" />
                      <input value={editAddress.numero} onChange={e => setEditAddress(a => ({ ...a, numero: e.target.value }))} placeholder="Número" className="p-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white" />
                    </div>
                    <input value={editAddress.complemento} onChange={e => setEditAddress(a => ({ ...a, complemento: e.target.value }))} placeholder="Complemento" className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white" />
                    <div className="grid grid-cols-3 gap-2">
                      <input value={editAddress.cidade} onChange={e => setEditAddress(a => ({ ...a, cidade: e.target.value }))} placeholder="Cidade" className="p-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white" />
                      <input value={editAddress.estado} onChange={e => setEditAddress(a => ({ ...a, estado: e.target.value }))} placeholder="UF" className="p-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white" />
                      <input value={editAddress.cep} onChange={e => setEditAddress(a => ({ ...a, cep: e.target.value }))} placeholder="CEP" className="p-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white" />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => saveEditAddress(orderModal.order.rawId)} disabled={savingEdit} className="flex items-center gap-1 px-3 py-1 bg-white text-black rounded text-xs font-bold disabled:opacity-50"><Save size={12} /> Salvar</button>
                      <button onClick={() => setEditMode(null)} className="px-3 py-1 border border-zinc-700 text-zinc-400 rounded text-xs font-bold">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  (() => {
                    const addr = orderModal.order.endereco_entrega || orderModal.order.address;
                    return addr ? (
                      <>
                        <p className="text-sm text-zinc-300">{addr.logradouro}, {addr.numero}{addr.complemento ? ` - ${addr.complemento}` : ''}</p>
                        <p className="text-sm text-zinc-500">{addr.cidade} - {addr.estado}, CEP: {addr.cep}</p>
                      </>
                    ) : <p className="text-sm text-zinc-500">Sem endereço cadastrado</p>;
                  })()
                )}
              </div>

              {/* ITEMS — Editable */}
              <div className="border-t border-zinc-800 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs text-zinc-500 font-bold uppercase">Itens</p>
                  {editMode !== 'items' && (
                    <button onClick={() => startEditItems(orderModal.order)} className="text-xs text-zinc-500 hover:text-white flex items-center gap-1"><Edit size={12} /> Editar</button>
                  )}
                </div>
                {editMode === 'items' ? (
                  <div className="space-y-2">
                    {editItems.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-center bg-zinc-800 p-2 rounded-lg">
                        <span className="text-sm text-white flex-1 truncate">{item.name}</span>
                        <input value={item.qty} onChange={e => setEditItems(prev => { const n = [...prev]; n[idx] = { ...n[idx], qty: e.target.value }; return n; })} type="number" min="1" className="w-16 p-1 bg-zinc-700 border border-zinc-600 rounded text-sm text-center text-white" />
                        <span className="text-xs text-zinc-500">x R$</span>
                        <input value={item.price} onChange={e => setEditItems(prev => { const n = [...prev]; n[idx] = { ...n[idx], price: e.target.value }; return n; })} type="number" step="0.01" className="w-24 p-1 bg-zinc-700 border border-zinc-600 rounded text-sm text-white" />
                      </div>
                    ))}
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => saveEditItems(orderModal.order.rawId)} disabled={savingEdit} className="flex items-center gap-1 px-3 py-1 bg-white text-black rounded text-xs font-bold disabled:opacity-50"><Save size={12} /> Salvar</button>
                      <button onClick={() => setEditMode(null)} className="px-3 py-1 border border-zinc-700 text-zinc-400 rounded text-xs font-bold">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {orderModal.order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-zinc-800 p-3 rounded-lg">
                        <div><p className="text-sm font-bold text-white">{item.name}</p>{item.size && <p className="text-xs text-zinc-500">Tam: {item.size}</p>}</div>
                        <div className="text-right"><p className="text-sm font-bold text-white">R$ {(item.price * item.qty).toFixed(2)}</p><p className="text-xs text-zinc-500">{item.qty}x R$ {item.price.toFixed(2)}</p></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-zinc-800 pt-4 space-y-1">
                <div className="flex justify-between text-sm"><span className="text-zinc-500">Subtotal</span><span className="text-zinc-300">R$ {orderModal.order.subtotal.toFixed(2)}</span></div>
                {orderModal.order.desconto > 0 && <div className="flex justify-between text-sm"><span className="text-zinc-500">Desconto</span><span className="text-emerald-400">-R$ {orderModal.order.desconto.toFixed(2)}</span></div>}
                {orderModal.order.frete > 0 && <div className="flex justify-between text-sm"><span className="text-zinc-500">Frete</span><span className="text-zinc-300">R$ {orderModal.order.frete.toFixed(2)}</span></div>}
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-zinc-800"><span className="text-white">Total</span><span className="text-white">R$ {orderModal.order.total.toFixed(2)}</span></div>
                {orderModal.order.metodo_pagamento && <p className="text-xs text-zinc-500 pt-1">Pagamento: {orderModal.order.metodo_pagamento}</p>}
              </div>
            </div>
          )}
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
