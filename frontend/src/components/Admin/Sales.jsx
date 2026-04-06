import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  X, 
  User, 
  CreditCard, 
  MapPin, 
  Package, 
  Clock, 
  Loader2,
  Calendar,
  Plus,
  Trash2
} from 'lucide-react';
import { api } from '../../services/api'; 
import { useToast } from '../../context/ToastContext'; 

// --- CONFIGURAÇÕES DE STATUS ---
const STATUS_LABELS = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  em_separacao: 'Em Separação',
  enviado: 'Enviado',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
};

const STATUS_COLORS = {
  pendente: 'bg-amber-100 text-amber-700 border-amber-200',
  confirmado: 'bg-blue-100 text-blue-700 border-blue-200',
  em_separacao: 'bg-purple-100 text-purple-700 border-purple-200',
  enviado: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  finalizado: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelado: 'bg-rose-100 text-rose-700 border-rose-200',
};

const STATUS_DOT = {
  pendente: 'bg-amber-400',
  confirmado: 'bg-blue-400',
  em_separacao: 'bg-purple-400',
  enviado: 'bg-indigo-400',
  finalizado: 'bg-emerald-400',
  cancelado: 'bg-rose-400',
};

const PAGE_SIZE = 15;

export default function Sales() {
  const toast = useToast();
  
  // Estados de Dados
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Estados de Filtro
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState("04");

  // Dashboard Stats
  const [stats, setStats] = useState({ totalRevenue: 0, ordersCount: 0, ticketMedio: 0, finalizados: 0 });

  // Modal e Edição
  const [viewingOrder, setViewingOrder] = useState(null);
  const [tempOrder, setTempOrder] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [statusSaving, setStatusSaving] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editedAddress, setEditedAddress] = useState('');
  const [isEditingItems, setIsEditingItems] = useState(false);

  // Busca de Produtos (Troca)
  const [searchTermProduct, setSearchTermProduct] = useState('');
  const [productResults, setProductResults] = useState([]);
  const [isSearchingProduct, setIsSearchingProduct] = useState(false);

  // Lógica de Busca Debounce
  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const mapOrder = useCallback((o) => ({
    id: `#${o.id_pedido}`,
    rawId: o.id_pedido,
    cliente: o.usuario?.nome || '—',
    email: o.usuario?.email || '',
    phone: o.usuario?.telefone || '',
    endereco: o.endereco_entrega || (o.usuario?.enderecos?.[0] 
      ? `${o.usuario.enderecos[0].logradouro}, ${o.usuario.enderecos[0].numero} - ${o.usuario.enderecos[0].cidade}` 
      : 'Endereço não informado'),
    total: Number(o.total || 0),
    status: o.status || 'pendente',
    data: o.data_pedido,
    pagamento: o.metodo_pagamento || 'Não informado',
    itemsList: (o.pedidoProdutos || []).map(pp => ({
      id_produto: pp.id_produto,
      nome: pp.produto?.nome_produto || 'Produto',
      qtd: pp.quantidade || 1,
      preco: Number(pp.preco_unitario || pp.produto?.preco || 0),
      size: pp.tamanho || '',
    })),
  }), []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: PAGE_SIZE });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (selectedStatus !== 'all') params.set('status', selectedStatus);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await api.get(`/admin/sales?${params}`);
      const body = res.data;
      
      if (body?.data) {
        setOrders(body.data.map(mapOrder));
        setTotalPages(body.totalPages || 1);
        const agg = body.aggregates || {};
        setStats({
          totalRevenue: Number(agg.totalRevenue) || 0,
          ordersCount: body.total || 0,
          ticketMedio: Number(agg.avgTicket) || 0,
          finalizados: Number(agg.finalizados) || 0,
        });
      }
    } catch (err) {
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, selectedStatus, startDate, endDate, mapOrder, toast]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const executeStatusChange = useCallback(async (orderId, newStatus) => {
    setStatusSaving(true);
    try {
      const cleanId = String(orderId).replace('#', ''); 
      const res = await api.patch(`/admin/orders/${cleanId}/status`, { status: String(newStatus) });
      toast.success('Status atualizado com sucesso');
      setOrders(prev => prev.map(o => o.rawId === orderId ? { ...o, status: newStatus } : o));
      if (tempOrder && tempOrder.rawId === orderId) {
        setTempOrder(prev => ({ ...prev, status: newStatus }));
        if (res.data?.dados?.historico) setOrderHistory(res.data.dados.historico);
      }
    } catch (err) {
      toast.error(err.response?.data?.mensagem || 'Erro ao alterar status');
    } finally {
      setStatusSaving(false);
    }
  }, [tempOrder, toast]);

  const handleUpdateAddress = async () => {
    try {
      const cleanId = String(tempOrder.rawId).replace('#', '');
      await api.patch(`/admin/orders/${cleanId}/address`, { endereco: editedAddress });
      setTempOrder(prev => ({ ...prev, endereco: editedAddress }));
      setOrders(prev => prev.map(o => o.rawId === tempOrder.rawId ? { ...o, endereco: editedAddress } : o));
      setIsEditingAddress(false);
      toast.success('Endereço atualizado!');
    } catch (err) {
      toast.error('Erro ao atualizar endereço');
    }
  };

  // Funções de Troca de Itens
  const searchProducts = async (term) => {
    if (term.length < 2) return setProductResults([]);
    setIsSearchingProduct(true);
    try {
      const res = await api.get(`/products?search=${term}`);
      setProductResults(res.data.data || res.data || []);
    } catch (err) {
      console.error("Erro ao buscar produtos", err);
    } finally {
      setIsSearchingProduct(false);
    }
  };

  const addItemToOrder = (prod) => {
    const newItem = {
      id_produto: prod.id_produto,
      nome: prod.nome_produto,
      qtd: 1,
      preco: Number(prod.preco),
      size: prod.tamanhos?.[0] || 'M'
    };
    const newItems = [...tempOrder.itemsList, newItem];
    const newTotal = newItems.reduce((acc, curr) => acc + (curr.qtd * curr.preco), 0);
    setTempOrder({ ...tempOrder, itemsList: newItems, total: newTotal });
    setSearchTermProduct('');
    setProductResults([]);
  };

  const removeItem = (index) => {
    const newItems = tempOrder.itemsList.filter((_, i) => i !== index);
    const newTotal = newItems.reduce((acc, curr) => acc + (curr.qtd * curr.preco), 0);
    setTempOrder({ ...tempOrder, itemsList: newItems, total: newTotal });
  };

  const updateItemField = (index, field, value) => {
    const newItems = [...tempOrder.itemsList];
    newItems[index][field] = field === 'qtd' ? parseInt(value) || 0 : value;
    const newTotal = newItems.reduce((acc, curr) => acc + (curr.qtd * curr.preco), 0);
    setTempOrder({ ...tempOrder, itemsList: newItems, total: newTotal });
  };

  const handleUpdateItems = async () => {
    try {
      const cleanId = String(tempOrder.rawId).replace('#', '');
      const itemsFormatted = tempOrder.itemsList.map(item => ({
        id_produto: item.id_produto,
        quantidade: item.qtd,
        preco_unitario: item.preco,
        tamanho: item.size
      }));
      await api.patch(`/admin/orders/${cleanId}/items`, { items: itemsFormatted });
      setIsEditingItems(false);
      loadOrders();
      toast.success('Produtos do pedido atualizados!');
    } catch (err) {
      toast.error('Erro ao atualizar produtos');
    }
  };

  const openOrderModal = useCallback(async (order) => {
    setViewingOrder(order.rawId);
    setTempOrder({ ...order });
    setIsEditingAddress(false);
    setIsEditingItems(false);
    try {
      const res = await api.get(`/admin/orders/${order.rawId}/history`);
      setOrderHistory(res.data || []);
    } catch {
      setOrderHistory([]);
    }
  }, []);

  const monthlyOrders = useMemo(() => {
    return orders.filter(order => {
      if (!order.data) return false;
      const orderMonth = order.data.split('-')[1];
      return orderMonth === selectedMonth;
    });
  }, [orders, selectedMonth]);

  const formatCurrency = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="min-h-screen bg-white text-slate-900 p-4 md:p-10 font-sans animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: 'Total de Vendas', val: formatCurrency(stats.totalRevenue) },
            { label: 'Pedidos', val: stats.ordersCount },
            { label: 'Ticket Médio', val: formatCurrency(stats.ticketMedio) },
            { label: 'Finalizados', val: stats.finalizados }
          ].map((card, i) => (
            <div key={i} className="bg-[#111111] p-7 rounded-[24px] border border-slate-800 shadow-xl">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">{card.label}</p>
              <h3 className="text-2xl font-black text-white">{card.val}</h3>
            </div>
          ))}
        </div>

        {/* Barra de Filtros */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-4 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-slate-200 font-medium"
                placeholder="Buscar por cliente..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none font-bold text-sm"
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
            >
              <option value="all">Todos os Status</option>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border transition-all ${showFilters ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-600'}`}
            >
              <Filter size={18} /> Filtros Avançados
            </button>
          </div>
          {showFilters && (
            <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-200 animate-in slide-in-from-top-2">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Data Início</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-white border border-slate-200 rounded-lg p-2 text-sm outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Data Fim</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-white border border-slate-200 rounded-lg p-2 text-sm outline-none" />
              </div>
            </div>
          )}
        </div>

        {/* Tabela de Pedidos */}
        <div className="space-y-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
            <Package className="text-slate-400" size={20} /> Gestão de Pedidos
          </h2>
          <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-slate-200" size={40} /></td></tr>
                  ) : orders.map(o => (
                    <tr key={o.rawId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-6 font-bold text-slate-400">{o.id}</td>
                      <td className="px-6 py-6">
                        <div className="font-black text-slate-900">{o.cliente}</div>
                        <div className="text-xs text-slate-400">{o.email}</div>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <select
                          value={o.status}
                          onChange={(e) => executeStatusChange(o.rawId, e.target.value)}
                          disabled={statusSaving}
                          className={`px-4 py-1.5 rounded-full text-[10px] font-black border uppercase appearance-none text-center ${STATUS_COLORS[o.status] || 'bg-slate-100'}`}
                        >
                          {Object.entries(STATUS_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-6 text-right font-black text-slate-900">{formatCurrency(o.total)}</td>
                      <td className="px-6 py-6 text-right">
                        <button onClick={() => openOrderModal(o)} className="p-2.5 bg-slate-100 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl transition-all"><Eye size={20} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal de Detalhes e Edição */}
        {viewingOrder && tempOrder && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4">
            <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[24px] md:rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              
              <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-start">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase">PEDIDO {tempOrder.id}</h2>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase border ${STATUS_COLORS[tempOrder.status]}`}>
                    {STATUS_LABELS[tempOrder.status]}
                  </span>
                </div>
                <button onClick={() => setViewingOrder(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><X size={24} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                {/* Endereço */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><MapPin size={12} /> Endereço de Entrega</label>
                    {!isEditingAddress ? (
                      <button onClick={() => { setIsEditingAddress(true); setEditedAddress(tempOrder.endereco); }} className="text-[10px] font-bold text-blue-600 hover:underline">EDITAR</button>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={handleUpdateAddress} className="text-[10px] font-bold text-emerald-600">SALVAR</button>
                        <button onClick={() => setIsEditingAddress(false)} className="text-[10px] font-bold text-rose-600">CANCELAR</button>
                      </div>
                    )}
                  </div>
                  {isEditingAddress ? (
                    <textarea className="w-full bg-slate-50 border border-blue-200 rounded-xl p-4 text-sm outline-none min-h-[80px]" value={editedAddress} onChange={(e) => setEditedAddress(e.target.value)} />
                  ) : (
                    <p className="text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 p-4 rounded-xl leading-relaxed">{tempOrder.endereco}</p>
                  )}
                </div>

                {/* Cliente e Pagamento */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-1"><User size={10} className="inline mr-1" /> Cliente</label>
                    <p className="text-sm font-black text-slate-900 truncate">{tempOrder.cliente}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-1"><CreditCard size={10} className="inline mr-1" /> Pagamento</label>
                    <p className="text-sm font-black text-slate-900">{tempOrder.pagamento}</p>
                  </div>
                </div>

                {/* Seção de Itens e Trocas */}
                <div className="space-y-6 pt-6 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Package size={14}/> Itens e Trocas</label>
                    {!isEditingItems ? (
                      <button onClick={() => setIsEditingItems(true)} className="text-[10px] font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all">ALTERAR PEDIDO / TROCAR</button>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => { setIsEditingItems(false); loadOrders(); }} className="text-[10px] font-bold text-slate-400 hover:bg-slate-100 px-3 py-1.5 rounded-lg">CANCELAR</button>
                        <button onClick={handleUpdateItems} className="text-[10px] font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 rounded-lg shadow-sm">SALVAR ALTERAÇÕES</button>
                      </div>
                    )}
                  </div>

                  {isEditingItems && (
                    <div className="relative animate-in fade-in slide-in-from-top-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input 
                          className="w-full bg-slate-50 border border-blue-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium outline-none"
                          placeholder="Pesquisar novo produto para adicionar..."
                          value={searchTermProduct}
                          onChange={(e) => { setSearchTermProduct(e.target.value); searchProducts(e.target.value); }}
                        />
                      </div>
                      {productResults.length > 0 && (
                        <div className="absolute w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-10 max-h-48 overflow-y-auto">
                          {productResults.map(prod => (
                            <button key={prod.id_produto} onClick={() => addItemToOrder(prod)} className="w-full flex justify-between items-center p-3 hover:bg-slate-50 text-left border-b border-slate-50 last:border-0">
                              <div>
                                <p className="text-xs font-black text-slate-900">{prod.nome_produto}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">{formatCurrency(prod.preco)}</p>
                              </div>
                              <Plus size={14} className="text-blue-500" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    {tempOrder.itemsList.map((item, i) => (
                      <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isEditingItems ? 'border-blue-100 bg-blue-50/40' : 'border-slate-100 bg-slate-50/50'}`}>
                        <div className="flex items-center gap-4 flex-1">
                          {isEditingItems && (
                            <button onClick={() => removeItem(i)} className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors"><Trash2 size={16} /></button>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {!isEditingItems ? (
                                <span className="font-black text-slate-900 text-sm">{item.qtd}x</span>
                              ) : (
                                <input type="number" className="w-12 border border-slate-200 rounded-lg p-1 text-center font-bold text-xs" value={item.qtd} onChange={(e) => updateItemField(i, 'qtd', e.target.value)} />
                              )}
                              <p className="text-sm font-black text-slate-900">{item.nome}</p>
                            </div>
                            <div className="flex gap-3 mt-1 text-[10px] font-bold uppercase text-slate-400">
                              {isEditingItems ? (
                                <div className="flex items-center gap-1"><span>TAM:</span><input className="w-10 border rounded bg-white px-1 py-0.5 text-slate-900" value={item.size} onChange={(e) => updateItemField(i, 'size', e.target.value)} /></div>
                              ) : (
                                <span>TAMANHO: {item.size || 'M'}</span>
                              )}
                              <span>UNIT: {formatCurrency(item.preco)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right"><p className="font-black text-slate-900">{formatCurrency(item.qtd * item.preco)}</p></div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-900 p-5 rounded-[24px] flex justify-between items-center shadow-lg">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Atualizado</p>
                      <p className="text-xs text-slate-500 italic">O valor será atualizado no banco ao salvar.</p>
                    </div>
                    <p className="text-2xl font-black text-white">{formatCurrency(tempOrder.total)}</p>
                  </div>
                </div>

                {/* Timeline */}
                {orderHistory.length > 0 && (
                  <div className="pt-6 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-6 flex items-center gap-2"><Clock size={12} /> Timeline do Pedido</p>
                    <div className="space-y-4">
                      {orderHistory.map((h, i) => (
                        <div key={i} className="flex gap-4 items-start">
                          <div className={`w-2 h-2 rounded-full mt-1.5 ${STATUS_DOT[h.status_para] || 'bg-slate-300'}`} />
                          <div className="flex-1">
                            <p className="text-[11px] font-bold text-slate-900">
                              {h.tipo === 'address_change' ? 'Endereço atualizado' : h.tipo === 'items_change' ? 'Pedido Alterado/Trocado' : `Alterado para ${STATUS_LABELS[h.status_para] || h.status_para}`}
                            </p>
                            <p className="text-[10px] text-slate-400">{new Date(h.criado_em).toLocaleString('pt-BR')} • por {h.autor}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100">
                <button onClick={() => setViewingOrder(null)} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-2">
                  <CheckCircle size={20} /> CONCLUIR REVISÃO
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}