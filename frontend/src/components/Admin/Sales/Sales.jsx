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
import { api } from '../../../services/api'; 
import { useToast } from '../../../context/ToastContext'; 

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

  // Lógica de Busca Debounce (Tabela Principal)
  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Lógica de Busca Debounce (Produtos do Modal)
  const searchProducts = useCallback(async (term) => {
    setIsSearchingProduct(true);
    try {
      const res = await api.get(`/products?search=${term}`);
      const results = res.data?.data || res.data || [];
      setProductResults(Array.isArray(results) ? results : []);
    } catch (err) {
      setProductResults([]);
    } finally {
      setIsSearchingProduct(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTermProduct.length >= 2) {
        searchProducts(searchTermProduct);
      } else {
        setProductResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTermProduct, searchProducts]);

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

  const addItemToOrder = (prod) => {
    const newItem = {
      id_produto: prod.id_produto || prod.id,
      nome: prod.nome_produto || prod.nome || 'Produto Adicionado',
      qtd: 1,
      preco: Number(prod.preco) || 0,
      size: prod.tamanhos?.[0] || 'M'
    };
    const newItems = [...(tempOrder.itemsList || []), newItem];
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
    newItems[index][field] = field === 'qtd' ? parseInt(value, 10) || 0 : value;
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 p-4 md:p-10 font-sans animate-in fade-in duration-500">
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

        {/* Tabela Principal */}
        <div className="space-y-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
            <Package className="text-slate-400" size={20} /> Gestão de Pedidos
          </h2>
          <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
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
                  ) : orders.length === 0 ? (
                    <tr><td colSpan={5} className="py-12 text-center text-slate-400 font-bold">Nenhum pedido encontrado.</td></tr>
                  ) : orders.map(o => (
                    <tr key={o.rawId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-6 font-bold text-slate-400">{o.id}</td>
                      <td className="px-6 py-6">
                        <div className="font-black text-slate-900 uppercase text-sm tracking-tight">{o.cliente}</div>
                        <div className="text-xs text-slate-400 font-medium">{o.email}</div>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <select
                          value={o.status}
                          onChange={(e) => executeStatusChange(o.rawId, e.target.value)}
                          disabled={statusSaving}
                          className={`px-4 py-1.5 rounded-full text-[10px] font-black border uppercase appearance-none text-center cursor-pointer focus:outline-none transition-colors ${STATUS_COLORS[o.status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}
                        >
                          {Object.entries(STATUS_LABELS).map(([key, label]) => (
                            <option key={key} value={key} className="bg-white text-slate-800">{label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-6 text-right font-black text-slate-900">{formatCurrency(o.total)}</td>
                      <td className="px-6 py-6 text-right">
                        <button onClick={() => openOrderModal(o)} className="p-2.5 bg-slate-100 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl transition-all shadow-sm"><Eye size={20} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex justify-between items-center px-4">
            <p className="text-xs font-bold text-slate-400 uppercase">Página {page} de {totalPages}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-5 py-2 border border-slate-200 rounded-xl text-xs font-black disabled:opacity-30">Anterior</button>
              <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-black disabled:opacity-30">Próxima</button>
            </div>
          </div>
        </div>

        {/* Tabela Mensal */}
        <div className="space-y-4 pt-10 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 uppercase">
              <Calendar className="text-slate-400" size={20} /> Demonstrativo Mensal
            </h2>
            <select className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold shadow-sm outline-none cursor-pointer" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
              <option value="01">Janeiro</option><option value="02">Fevereiro</option><option value="03">Março</option><option value="04">Abril</option>
              <option value="05">Maio</option><option value="06">Junho</option><option value="07">Julho</option><option value="08">Agosto</option>
              <option value="09">Setembro</option><option value="10">Outubro</option><option value="11">Novembro</option><option value="12">Dezembro</option>
            </select>
          </div>
          <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr><th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Pedido</th><th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Cliente</th><th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase">Valor</th><th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase">Data</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlyOrders.length > 0 ? monthlyOrders.map(order => (
                    <tr key={order.rawId} className="text-sm hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4 text-slate-400 font-bold">{order.id}</td><td className="px-6 py-4 text-slate-800 font-black uppercase tracking-tight">{order.cliente}</td><td className="px-6 py-4 text-right text-slate-900 font-bold">{formatCurrency(order.total)}</td><td className="px-6 py-4 text-center text-slate-400">{new Date(order.data).toLocaleDateString('pt-BR')}</td>
                    </tr>
                  )) : <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-300 font-bold">Nenhum pedido encontrado.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* O MODAL AGORA FICA TOTALMENTE DE FORA DO CONTÊINER PRINCIPAL PARA EVITAR MARGENS */}
      {viewingOrder && tempOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
          
          <div 
            className="absolute inset-0 bg-slate-900/80" 
            onClick={() => setViewingOrder(null)} 
          />
          
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* HEADER DO MODAL */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase">Pedido {tempOrder.id}</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID do Sistema: {tempOrder.rawId}</p>
              </div>
              <button onClick={() => setViewingOrder(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"><X size={20} /></button>
            </div>

            {/* CORPO DO MODAL */}
            <div className="p-6 md:p-8 space-y-8 overflow-y-auto grow">
              
              {/* LINHA 1: CLIENTE E ENDEREÇO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Info Cliente e Pagamento */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2 tracking-widest"><User size={12}/> Cliente</p>
                    <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-2xl space-y-1">
                      <p className="font-black text-slate-900 text-sm uppercase">{tempOrder.cliente}</p>
                      <p className="text-xs font-bold text-slate-400 truncate">{tempOrder.email}</p>
                      <p className="text-xs font-bold text-slate-400">{tempOrder.phone || 'S/ Telefone'}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2 tracking-widest"><CreditCard size={12}/> Pagamento</p>
                    <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-2xl">
                      <p className="font-bold text-slate-900 text-sm uppercase">{tempOrder.pagamento}</p>
                      <div className={`mt-2 inline-block px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest ${STATUS_COLORS[tempOrder.status] || 'bg-slate-100 text-slate-500'}`}>{STATUS_LABELS[tempOrder.status] || tempOrder.status}</div>
                    </div>
                  </div>
                </div>

                {/* Endereço */}
                <div className="space-y-2 h-full flex flex-col">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2 tracking-widest"><MapPin size={12}/> Endereço</p>
                    {!isEditingAddress ? (
                      <button onClick={() => { setIsEditingAddress(true); setEditedAddress(tempOrder.endereco); }} className="text-[10px] font-bold text-blue-600 hover:underline">EDITAR</button>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={handleUpdateAddress} disabled={addressSaving} className="text-[10px] font-bold text-emerald-600">SALVAR</button>
                        <button onClick={() => setIsEditingAddress(false)} className="text-[10px] font-bold text-rose-600">CANCELAR</button>
                      </div>
                    )}
                  </div>
                  {isEditingAddress ? (
                    <textarea className="w-full h-full bg-slate-50 border border-blue-200 rounded-2xl p-4 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-slate-200 resize-none" value={editedAddress} onChange={e => setEditedAddress(e.target.value)} placeholder="Editar endereço completo..."/>
                  ) : (
                    <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-2xl flex-1">
                      <p className="text-sm font-medium text-slate-600 leading-relaxed">{tempOrder.endereco}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* LINHA 2: ITENS DO PEDIDO */}
              <div className="space-y-6 pt-6 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2 tracking-widest"><Package size={12}/> Produtos do Pedido</p>
                  {!isEditingItems ? (
                    <button onClick={() => setIsEditingItems(true)} className="text-[10px] font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all uppercase tracking-widest">Alterar / Trocar Itens</button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => { setIsEditingItems(false); loadOrders(); }} className="text-[10px] font-bold text-slate-400 hover:bg-slate-100 px-3 py-1.5 rounded-lg uppercase tracking-widest">Cancelar Edição</button>
                      <button onClick={handleUpdateItems} className="text-[10px] font-black text-white bg-slate-900 hover:bg-black px-4 py-1.5 rounded-lg shadow-sm uppercase tracking-widest">Salvar Itens</button>
                    </div>
                  )}
                </div>

                {isEditingItems && (
                  <div className="relative animate-in slide-in-from-top-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        className="w-full bg-white border border-blue-200 rounded-xl py-3 pl-10 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100"
                        placeholder="Pesquisar novo produto para adicionar à troca..."
                        value={searchTermProduct}
                        onChange={(e) => setSearchTermProduct(e.target.value)}
                      />
                      {isSearchingProduct && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" size={14} />}
                    </div>
                    {productResults.length > 0 && (
                      <div className="absolute w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-10 max-h-48 overflow-y-auto">
                        {productResults.map(prod => (
                          <button key={prod.id_produto || prod.id} onClick={() => addItemToOrder(prod)} className="w-full flex justify-between items-center p-3 hover:bg-slate-50 text-left border-b border-slate-100 last:border-0 transition-colors">
                            <div>
                              <p className="text-xs font-black text-slate-900 uppercase">{prod.nome_produto || prod.nome}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{formatCurrency(prod.preco)}</p>
                            </div>
                            <Plus size={16} className="text-blue-500" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.isArray(tempOrder.itemsList) && tempOrder.itemsList.map((item, i) => (
                    <div key={i} className={`flex flex-col p-4 rounded-2xl border transition-all ${isEditingItems ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-white shadow-sm'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-black text-slate-900 text-sm uppercase">{item.nome}</p>
                        {isEditingItems && (
                          <button onClick={() => removeItem(i)} className="p-1 text-rose-400 hover:text-rose-600 transition-colors"><Trash2 size={14} /></button>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isEditingItems ? (
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase">Qtd</label>
                              <input type="number" className="w-12 border border-slate-300 rounded-lg p-1.5 text-center font-bold text-xs outline-none" value={item.qtd} onChange={(e) => updateItemField(i, 'qtd', e.target.value)} />
                            </div>
                          ) : (
                            <span className="font-black text-slate-400 text-xs">{item.qtd}x</span>
                          )}
                          
                          {isEditingItems ? (
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase">Tamanho</label>
                              <input className="w-12 border border-slate-300 rounded-lg p-1.5 text-center font-bold text-xs uppercase outline-none" value={item.size} onChange={(e) => updateItemField(i, 'size', e.target.value)} />
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Tam: {item.size || 'M'}</span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Unit: {formatCurrency(item.preco)}</p>
                          <p className="font-black text-slate-900">{formatCurrency(item.qtd * item.preco)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-end pt-4">
                  <div className="text-right bg-slate-900 px-6 py-4 rounded-[24px] shadow-lg">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor Final</p>
                    <p className="text-2xl font-black text-white">{formatCurrency(tempOrder.total)}</p>
                  </div>
                </div>
              </div>

              {/* LINHA 3: LOGS E MOVIMENTAÇÕES (ÚLTIMA OPÇÃO) */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2 tracking-widest"><Clock size={12}/> Logs e Movimentações</p>
                <div className="bg-slate-50 border border-slate-200 shadow-sm p-6 rounded-2xl max-h-[200px] overflow-y-auto divide-y divide-slate-100">
                  {Array.isArray(orderHistory) && orderHistory.length > 0 ? (
                    <div className="space-y-4">
                      {orderHistory.map((h, i) => (
                        <div key={i} className="flex gap-4 relative py-3 first:pt-0 last:pb-0">
                          <div className="flex flex-col items-center">
                            <div className={`w-2.5 h-2.5 rounded-full mt-1 ${STATUS_DOT[h.status_para] || 'bg-slate-300'}`} />
                            {i < orderHistory.length - 1 && <div className="w-px flex-1 bg-slate-200 my-1" />}
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-900 uppercase">
                              {h.tipo === 'address_change' ? 'Endereço Atualizado' : h.tipo === 'items_change' ? 'Pedido Trocado/Alterado' : STATUS_LABELS[h.status_para] || h.status_para}
                            </p>
                            <p className="text-[10px] text-slate-500">{new Date(h.criado_em || h.data).toLocaleString('pt-BR')} • {h.autor || 'Sistema'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 font-bold text-center py-4">Nenhum log de movimentação disponível.</p>
                  )}
                </div>
              </div>

            </div>

            {/* FOOTER DO MODAL */}
            <div className="p-6 bg-white border-t border-slate-100 shrink-0">
              <button onClick={() => setViewingOrder(null)} className="w-full py-4 bg-slate-100 border border-slate-200 text-slate-600 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                <CheckCircle size={18} /> FECHAR DETALHES
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}