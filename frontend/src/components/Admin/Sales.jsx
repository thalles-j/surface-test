import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  X, 
  Plus, 
  Trash2, 
  User, 
  CreditCard, 
  MapPin, 
  Package, 
  Clock, 
  Loader2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Calendar
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

  
  
  // Estados de Dados e Carregamento
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // Estados de Filtro
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortByValue, setSortByValue] = useState(null);
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

  // Lógica de Busca Debounce
  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Mapeamento para o Design
  const mapOrder = useCallback((o) => ({
    id: `#${o.id_pedido}`,
    rawId: o.id_pedido,
    cliente: o.usuario?.nome || '—',
    email: o.usuario?.email || '',
    phone: o.usuario?.telefone || '',
    endereco: o.usuario?.enderecos?.[0] 
      ? `${o.usuario.enderecos[0].logradouro}, ${o.usuario.enderecos[0].numero} - ${o.usuario.enderecos[0].cidade}` 
      : 'Endereço não informado',
    total: Number(o.total || 0),
    subtotal: Number(o.subtotal || o.total || 0),
    frete: Number(o.frete || 0),
    desconto: Number(o.desconto || 0),
    status: o.status || 'pendente',
    data: o.data_pedido,
    pagamento: o.metodo_pagamento || 'Não informado',
    itemsList: (o.pedidoProdutos || []).map(pp => ({
      nome: pp.produto?.nome_produto || 'Produto',
      qtd: pp.quantidade || 1,
      preco: Number(pp.preco_unitario || pp.produto?.preco || 0),
      size: pp.tamanho || '',
    })),
  }), []);

  // Carregar Pedidos da API
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

        // --- CORREÇÃO AQUI: Atualizando os cards do Dashboard ---
        const agg = body.aggregates || {};
        setStats({
          totalRevenue: Number(agg.totalRevenue) || 0,
          ordersCount: body.total || 0,
          ticketMedio: Number(agg.avgTicket) || 0,
          finalizados: Number(agg.finalizados) || 0,
        });
        // -------------------------------------------------------
      }
    } catch (err) {
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, selectedStatus, sortByValue, startDate, endDate, mapOrder, toast]);
  useEffect(() => { loadOrders(); }, [loadOrders]);

  // Função genérica para mudar status (usada na tabela e no modal)
  const executeStatusChange = useCallback(async (orderId, newStatus) => {
    setStatusSaving(true);
    try {
      const res = await api.patch(`/admin/orders/${orderId}/status`, { status: newStatus });
      const data = res.data?.dados || res.data;
      toast.success(data?.mensagem || 'Status atualizado com sucesso');
      
      // Atualiza localmente a lista
      setOrders(prev => prev.map(o => o.rawId === orderId ? { ...o, status: newStatus } : o));
      
      // Se for o pedido que estamos a ver no modal, atualiza o modal também
      if (tempOrder && tempOrder.rawId === orderId) {
        setTempOrder(prev => ({ ...prev, status: newStatus }));
        if (data?.historico) setOrderHistory(data.historico);
      }
      
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.mensagem || 'Erro ao comunicar com o servidor. Status alterado localmente.');
      // Fallback para visualização: atualiza localmente mesmo com erro de API (para prototipagem)
      setOrders(prev => prev.map(o => o.rawId === orderId ? { ...o, status: newStatus } : o));
      if (tempOrder && tempOrder.rawId === orderId) {
        setTempOrder(prev => ({ ...prev, status: newStatus }));
      }
    } finally {
      setStatusSaving(false);
    }
  }, [tempOrder, toast, loadOrders]);

  // Filtro para a Segunda Tabela (Demonstrativo Mensal)
  const monthlyOrders = useMemo(() => {
    return orders.filter(order => {
      if (!order.data) return false;
      const orderMonth = order.data.split('-')[1]; // Assume formato YYYY-MM-DD
      return orderMonth === selectedMonth;
    });
  }, [orders, selectedMonth]);

  // Abrir Modal e Carregar Histórico
  const openOrderModal = useCallback(async (order) => {
    setViewingOrder(order.rawId);
    setTempOrder({ ...order });
    try {
      const res = await api.get(`/admin/orders/${order.rawId}/history`);
      setOrderHistory(res.data || []);
    } catch {
      setOrderHistory([]);
    }
  }, []);

  const formatCurrency = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="min-h-screen bg-white text-slate-900 p-4 md:p-10 font-sans animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-10">

          {/* Dashboard Cards (Métricas) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-[#111111] p-7 rounded-[24px] border border-slate-800 shadow-xl">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Total de Vendas</p>
            <h3 className="text-2xl font-black text-white">{formatCurrency(stats.totalRevenue)}</h3>
          </div>
          <div className="bg-[#111111] p-7 rounded-[24px] border border-slate-800 shadow-xl">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Pedidos</p>
            <h3 className="text-2xl font-black text-white">{stats.ordersCount}</h3>
          </div>
          <div className="bg-[#111111] p-7 rounded-[24px] border border-slate-800 shadow-xl">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Ticket Médio</p>
            <h3 className="text-2xl font-black text-white">{formatCurrency(stats.ticketMedio)}</h3>
          </div>
          <div className="bg-[#111111] p-7 rounded-[24px] border border-slate-800 shadow-xl">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Finalizados</p>
            <h3 className="text-2xl font-black text-white">{stats.finalizados}</h3>
          </div>
        </div>
        
        {/* Barra de Busca e Filtros */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-4 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-slate-200 transition-all font-medium"
                placeholder="Buscar por cliente na tabela principal..."
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
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all border ${showFilters ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-600'}`}
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

        {/* TABELA 1: GESTÃO PRINCIPAL */}
        <div className="space-y-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
            <Package className="text-slate-400" size={20} />
            Gestão de Pedidos
          </h2>
          <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
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
                    <tr key={o.rawId} className="hover:bg-slate-50/50 transition-colors group">
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
                          className={`px-4 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-tight cursor-pointer focus:outline-none transition-all appearance-none text-center ${STATUS_COLORS[o.status] || 'bg-slate-100 border-slate-200'}`}
                        >
                          {Object.entries(STATUS_LABELS).map(([key, label]) => (
                            <option key={key} value={key} className="bg-white text-slate-800">{label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-6 text-right font-black text-slate-900">{formatCurrency(o.total)}</td>
                      <td className="px-6 py-6 text-right">
                        <button 
                          onClick={() => openOrderModal(o)}
                          className="p-2.5 bg-slate-100 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl transition-all shadow-sm"
                        >
                          <Eye size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginação */}
          <div className="flex justify-between items-center px-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Página {page} de {totalPages}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-5 py-2 border border-slate-200 rounded-xl text-xs font-black disabled:opacity-30">Anterior</button>
              <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-black disabled:opacity-30">Próxima</button>
            </div>
          </div>
        </div>

        {/* TABELA 2: DEMONSTRATIVO MENSAL */}
        <div className="space-y-4 pt-10 border-t border-slate-100">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
              <Calendar className="text-slate-400" size={20} />
              Demonstrativo Mensal
            </h2>
            <select 
              className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none shadow-sm cursor-pointer"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="01">Janeiro</option>
              <option value="02">Fevereiro</option>
              <option value="03">Março</option>
              <option value="04">Abril</option>
              <option value="05">Maio</option>
              <option value="06">Junho</option>
              <option value="07">Julho</option>
              <option value="08">Agosto</option>
              <option value="09">Setembro</option>
              <option value="10">Outubro</option>
              <option value="11">Novembro</option>
              <option value="12">Dezembro</option>
            </select>
          </div>

          <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Pedido</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4 text-right">Valor</th>
                  <th className="px-6 py-4 text-center">Data</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyOrders.length > 0 ? monthlyOrders.map(order => (
                  <tr key={`month-${order.rawId}`} className="text-sm">
                    <td className="px-6 py-4 text-slate-400 font-bold">{order.id}</td>
                    <td className="px-6 py-4 text-slate-800 font-black">{order.cliente}</td>
                    <td className="px-6 py-4 text-right text-slate-900 font-bold">{formatCurrency(order.total)}</td>
                    <td className="px-6 py-4 text-center text-slate-400 font-medium">
                      {new Date(order.data).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                        {order.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-bold text-sm">
                      Nenhum pedido encontrado para o mês selecionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Gerenciamento Unificado */}
        {viewingOrder && tempOrder && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Pedido {tempOrder.id}</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase mt-1 tracking-widest">Gestão de Status e Histórico</p>
                </div>
                <button onClick={() => setViewingOrder(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 space-y-8 max-h-[65vh] overflow-y-auto">
                
                {/* Transições de Status Rápidas */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações Sugeridas</p>
                  <div className="flex flex-wrap gap-2">
                    {TRANSITIONS[tempOrder.status]?.length > 0 ? (
                      TRANSITIONS[tempOrder.status].map(next => (
                        <button 
                          key={next}
                          disabled={statusSaving}
                          onClick={() => executeStatusChange(tempOrder.rawId, next)}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all border shadow-sm
                            ${next === 'cancelado' ? 'border-rose-200 text-rose-600 hover:bg-rose-50' : 'bg-slate-900 text-white hover:bg-black'}
                          `}
                        >
                          {statusSaving && <Loader2 className="animate-spin w-3 h-3" />}
                          MARCAR COMO {STATUS_LABELS[next].toUpperCase()}
                        </button>
                      ))
                    ) : (
                      <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg text-xs font-bold border border-emerald-100">
                        Estado final atingido ({STATUS_LABELS[tempOrder.status]}).
                      </div>
                    )}
                  </div>
                </div>

                {/* Detalhes Cliente e Pagamento */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><User size={12} className="inline mr-1"/> Cliente</label>
                    <p className="font-black text-slate-900">{tempOrder.cliente}</p>
                    <p className="text-xs text-slate-400">{tempOrder.email}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><CreditCard size={12} className="inline mr-1"/> Pagamento</label>
                    <p className="font-bold text-slate-900">{tempOrder.pagamento}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><MapPin size={12} className="inline mr-1"/> Entrega</label>
                  <p className="text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 p-4 rounded-xl leading-relaxed">{tempOrder.endereco}</p>
                </div>

                {/* Lista de Itens do Pedido */}
                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><Package size={12} className="inline mr-1"/> Produtos</p>
                  <div className="space-y-2">
                    {tempOrder.itemsList.map((item, i) => (
                      <div key={i} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div>
                          <p className="font-black text-slate-900 text-sm">{item.nome}</p>
                          <p className="text-xs text-slate-400">{item.qtd}x de {formatCurrency(item.preco)} {item.size && `| Tam: ${item.size}`}</p>
                        </div>
                        <p className="font-black text-slate-900">{formatCurrency(item.qtd * item.preco)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Histórico Visual */}
                {orderHistory.length > 0 && (
                  <div className="pt-6 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Clock size={12}/> Histórico de Status</p>
                    <div className="space-y-0 pl-2">
                      {orderHistory.map((h, i) => (
                        <div key={h.id_historico} className="flex gap-5">
                          <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full mt-1.5 ring-4 ring-white shadow-sm ${STATUS_DOT[h.status_para] || 'bg-slate-300'}`} />
                            {i < orderHistory.length - 1 && <div className="w-px flex-1 bg-slate-100 my-1" />}
                          </div>
                          <div className="pb-8">
                            <div className="flex items-center gap-2 mb-1.5">
                              {h.status_de && <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${STATUS_COLORS[h.status_de]}`}>{STATUS_LABELS[h.status_de]}</span>}
                              {h.status_de && <ChevronRight size={10} className="text-slate-300" />}
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${STATUS_COLORS[h.status_para]}`}>{STATUS_LABELS[h.status_para]}</span>
                            </div>
                            <p className="text-[11px] font-black text-slate-900">{h.autor}</p>
                            <p className="text-[10px] font-medium text-slate-400 mt-1">{new Date(h.criado_em).toLocaleString('pt-BR')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100">
                <button 
                  onClick={() => setViewingOrder(null)} 
                  className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <CheckCircle size={20} /> FECHAR DETALHES
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}