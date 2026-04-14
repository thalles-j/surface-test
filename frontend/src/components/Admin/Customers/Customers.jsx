import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Crown, Plus, Trash2, Eye, UserPlus, 
  ShoppingBag, Mail, Phone, Calendar, DollarSign,
  Tag, X, TrendingUp, Users
} from 'lucide-react';
import { api } from '../../../services/api';
import { arrayToCsv, downloadCsv } from '../../../utils/exportCsv';

const mapCouponTypeToUi = (tipo) => {
  const normalized = String(tipo || '').toLowerCase();
  if (normalized === 'fixo' || normalized === 'valor fixo' || normalized === 'fixed' || normalized === 'valor_fixo') return 'Valor Fixo';
  return 'Porcentagem';
};

const mapCouponTypeToApi = (tipo) => (tipo === 'Valor Fixo' ? 'fixo' : 'porcentagem');

const mapApiCouponToUi = (coupon) => ({
  id: String(coupon?.id_cupom ?? coupon?.id ?? ''),
  code: String(coupon?.codigo ?? coupon?.code ?? ''),
  discount: Number(coupon?.desconto ?? coupon?.discount ?? 0),
  type: mapCouponTypeToUi(coupon?.tipo ?? coupon?.type),
  expiry: coupon?.validade ? new Date(coupon.validade).toISOString().slice(0, 10) : '',
  uses: Number(coupon?.usos ?? coupon?.uses ?? 0),
  active: typeof coupon?.ativo === 'boolean' ? coupon.ativo : true,
});

// --- COMPONENTES AUXILIARES ---

const Badge = ({ children, variant = 'default' }) => {
  const styles = {
    VIP: 'bg-purple-100 text-purple-700 border-purple-200',
    Novo: 'bg-blue-100 text-blue-700 border-blue-200',
    Recorrente: 'bg-green-100 text-green-700 border-green-200',
    default: 'bg-gray-100 text-gray-700 border-gray-200'
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[variant] || styles.default}`}>
      {children}
    </span>
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

export default function App() {
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modais
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Form States
  const [newCoupon, setNewCoupon] = useState({ code: '', discount: '', type: 'Porcentagem', expiry: '' });

  // --- LÓGICA DE CLIENTES ---
  const loadCustomers = useCallback(async () => {
    try {
      setLoadingCustomers(true);
      const res = await api.get('/admin/customers?page=1&limit=500');
      const rows = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
      setCustomers(rows);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const loadCoupons = useCallback(async () => {
    try {
      setLoadingCoupons(true);
      const res = await api.get('/admin/marketing/coupons');
      const rows = Array.isArray(res.data) ? res.data : [];
      setCoupons(rows.map(mapApiCouponToUi));
    } catch (error) {
      console.error('Erro ao carregar cupons:', error);
      setCoupons([]);
    } finally {
      setLoadingCoupons(false);
    }
  }, []);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const openDetails = async (customer) => {
    try {
      const res = await api.get(`/admin/customers/${customer.id}`);
      setSelectedCustomer(res.data || customer);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('Erro ao buscar detalhes do cliente:', error);
      setSelectedCustomer(customer);
      setIsDetailModalOpen(true);
    }
  };

  const filteredCustomers = customers.filter((c) =>
    String(c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCustomers = () => {
    const rows = filteredCustomers.map((c) => ({
      id: c.id,
      nome: c.name || '',
      email: c.email || '',
      telefone: c.phone || '',
      tipo: c.type || '',
      pedidos: Number(c.ordersCount || 0),
      total_gasto: Number(c.totalSpent || 0).toFixed(2),
      ticket_medio: Number(c.ticketMedio || 0).toFixed(2),
      cadastrado_em: c.registered ? new Date(c.registered).toLocaleDateString('pt-BR') : '',
      ultima_compra: c.ultimaCompra ? new Date(c.ultimaCompra).toLocaleDateString('pt-BR') : '',
    }));
    const csv = arrayToCsv(rows, [
      { key: 'id', label: 'ID' },
      { key: 'nome', label: 'Nome' },
      { key: 'email', label: 'Email' },
      { key: 'telefone', label: 'Telefone' },
      { key: 'tipo', label: 'Tipo' },
      { key: 'pedidos', label: 'Pedidos' },
      { key: 'total_gasto', label: 'Total Gasto (R$)' },
      { key: 'ticket_medio', label: 'Ticket Medio (R$)' },
      { key: 'cadastrado_em', label: 'Cadastrado Em' },
      { key: 'ultima_compra', label: 'Ultima Compra' },
    ]);
    downloadCsv(csv, `clientes_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  // --- LÓGICA DE CUPONS ---

  const handleAddCoupon = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/marketing/coupons', {
        codigo: newCoupon.code.trim().toUpperCase(),
        desconto: Number(newCoupon.discount),
        tipo: mapCouponTypeToApi(newCoupon.type),
        validade: newCoupon.expiry || null,
      });
      await loadCoupons();
      setNewCoupon({ code: '', discount: '', type: 'Porcentagem', expiry: '' });
      setIsCouponModalOpen(false);
    } catch (error) {
      console.error('Erro ao criar cupom:', error);
    }
  };

  const deleteCoupon = async (id) => {
    try {
      await api.delete(`/admin/marketing/coupons/${id}`);
      setCoupons((prev) => prev.filter((c) => c.id !== String(id)));
    } catch (error) {
      console.error('Erro ao deletar cupom:', error);
    }
  };

  // --- RENDERIZAÇÃO ---

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      <div className="max-w-7xl mx-auto px-3 py-6 sm:px-4 sm:py-8">

        {/* --- SEÇÃO DE CLIENTES --- */}
        <section className="space-y-6 mb-16">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
              <Users className="text-indigo-600" size={24} /> 
              Base de Clientes
            </h2>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Users size={24} /></div>
              <div><p className="text-sm text-gray-500 font-medium">Total Clientes</p><h3 className="text-xl sm:text-2xl font-bold">{customers.length}</h3></div>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Crown size={24} /></div>
              <div><p className="text-sm text-gray-500 font-medium">VIPs</p><h3 className="text-xl sm:text-2xl font-bold">{customers.filter(c => c.type === 'VIP').length}</h3></div>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><DollarSign size={24} /></div>
              <div><p className="text-sm text-gray-500 font-medium">Receita Total</p><h3 className="text-xl sm:text-2xl font-bold">R$ {customers.reduce((acc, c) => acc + Number(c.totalSpent || 0), 0).toLocaleString()}</h3></div>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><TrendingUp size={24} /></div>
              <div><p className="text-sm text-gray-500 font-medium">Novos (Mês)</p><h3 className="text-xl sm:text-2xl font-bold">{customers.filter(c => c.type === 'Novo').length}</h3></div>
            </div>
          </div>

          {/* toolbar Clientes */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Pesquisar por nome ou email..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex w-full md:w-auto items-center gap-2">
              <button
                onClick={handleExportCustomers}
                className="flex-1 md:flex-none min-h-[42px] px-4 sm:px-5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-all"
              >
                Exportar CSV
              </button>
              <button
                type="button"
                disabled
                title="Cadastro de clientes não disponível no admin no momento."
                className="flex-1 md:flex-none flex items-center gap-2 bg-indigo-600 text-white min-h-[42px] px-4 sm:px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all justify-center disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <UserPlus size={18} /> Novo Cliente
              </button>
            </div>
          </div>

          {/* Table Clientes */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Categoria</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Pedidos</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Total Gasto</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingCustomers ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Carregando clientes...</td>
                    </tr>
                  ) : filteredCustomers.map(customer => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                            {String(customer.name || '?').charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{customer.name || 'Sem nome'}</p>
                            <p className="text-xs text-gray-500">{customer.email || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={customer.type}>{customer.type}</Badge>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-700">{Number(customer.ordersCount || 0)}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">R$ {Number(customer.totalSpent || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => openDetails(customer)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Ver Detalhes"
                        >
                          <Eye size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!loadingCustomers && filteredCustomers.length === 0 && (
              <div className="p-8 sm:p-12 text-center">
                <div className="mx-auto w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-4"><Search size={32} /></div>
                <h4 className="text-lg font-bold text-gray-800">Nenhum cliente encontrado</h4>
                <p className="text-gray-500">Tente ajustar seus termos de busca.</p>
              </div>
            )}
          </div>
        </section>

        {/* --- SEÇÃO DE CUPONS --- */}
        <section className="space-y-6 animate-in fade-in duration-500">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
              <Tag className="text-emerald-600" size={24} /> 
              Cupons e Campanhas
            </h2>
            <button 
              onClick={() => setIsCouponModalOpen(true)}
              className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-gray-200"
            >
              <Plus size={18} /> Criar Cupom
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Código</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Desconto</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Usos</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingCoupons ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Carregando cupons...</td>
                    </tr>
                  ) : coupons.map(coupon => (
                    <tr key={coupon.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <code className="bg-amber-50 text-amber-700 px-3 py-1 rounded-md font-mono font-bold border border-amber-100 uppercase tracking-tight">{coupon.code}</code>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {coupon.type === 'Porcentagem' ? `${coupon.discount}%` : `R$ ${coupon.discount}`}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 italic">{coupon.type}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 font-bold text-gray-700 text-xs">
                          {coupon.uses}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${coupon.active ? 'text-green-600' : 'text-red-600'}`}>
                          <span className={`w-2 h-2 rounded-full ${coupon.active ? 'bg-green-600' : 'bg-red-600'}`}></span>
                          {coupon.active ? 'Ativo' : 'Pausado'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => deleteCoupon(coupon.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!loadingCoupons && coupons.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Nenhum cupom cadastrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {/* MODAL: DETALHES DO CLIENTE */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Perfil do Cliente">
        {selectedCustomer && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-6 items-start pb-6 border-b border-gray-100">
              <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-indigo-100">
                {selectedCustomer.name.charAt(0)}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{selectedCustomer.name}</h2>
                  <Badge variant={selectedCustomer.type}>{selectedCustomer.type}</Badge>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500 font-medium">
                  <span className="flex items-center gap-1.5"><Mail size={16} /> {selectedCustomer.email}</span>
                  <span className="flex items-center gap-1.5"><Phone size={16} /> {selectedCustomer.phone}</span>
                  <span className="flex items-center gap-1.5"><Calendar size={16} /> Cliente desde: {selectedCustomer.registered ? new Date(selectedCustomer.registered).toLocaleDateString() : '-'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                  <p className="text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">Gasto Acumulado</p>
                  <p className="text-2xl font-black text-indigo-900">R$ {Number(selectedCustomer.totalSpent || 0).toFixed(2)}</p>
               </div>
               <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <p className="text-amber-600 text-xs font-bold uppercase tracking-wider mb-1">Ticket Médio</p>
                  <p className="text-2xl font-black text-amber-900">
                    R$ {Number(selectedCustomer.ordersCount || 0) > 0 ? (Number(selectedCustomer.totalSpent || 0) / Number(selectedCustomer.ordersCount || 0)).toFixed(2) : "0.00"}
                  </p>
               </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><ShoppingBag size={18} className="text-indigo-600" /> Histórico de Pedidos</h4>
              <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 border-b border-gray-200">
                      <th className="px-4 py-2 font-bold uppercase text-[10px]">ID</th>
                      <th className="px-4 py-2 font-bold uppercase text-[10px]">Data</th>
                      <th className="px-4 py-2 font-bold uppercase text-[10px]">Status</th>
                      <th className="px-4 py-2 font-bold uppercase text-[10px] text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(selectedCustomer.orders || []).map(order => (
                      <tr key={order.id} className="text-gray-700">
                        <td className="px-4 py-3 font-mono text-xs">#{order.id}</td>
                        <td className="px-4 py-3">{order.date ? new Date(order.date).toLocaleDateString() : '-'}</td>
                        <td className="px-4 py-3">
                           <span className="bg-white border px-2 py-0.5 rounded text-[10px] font-bold">{order.status}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">R$ {Number(order.total || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                    {(selectedCustomer.orders || []).length === 0 && (
                      <tr><td colSpan="4" className="px-4 py-6 text-center text-gray-500">Nenhum pedido encontrado.</td></tr>
                    )}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: CRIAR CUPOM */}
      <Modal isOpen={isCouponModalOpen} onClose={() => setIsCouponModalOpen(false)} title="Configurar Novo Cupom">
        <form onSubmit={handleAddCoupon} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Código do Cupom</label>
            <input 
              required
              className="w-full p-2.5 rounded-lg border border-gray-200 font-mono focus:ring-2 focus:ring-indigo-500 outline-none uppercase placeholder:lowercase" 
              placeholder="Ex: DESCONTO20"
              value={newCoupon.code}
              onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Tipo de Desconto</label>
              <select 
                className="w-full min-h-[42px] p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={newCoupon.type}
                onChange={e => setNewCoupon({...newCoupon, type: e.target.value})}
              >
                <option value="Porcentagem">Porcentagem (%)</option>
                <option value="Valor Fixo">Valor Fixo (R$)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Valor</label>
              <input 
                required
                type="number"
                className="w-full min-h-[42px] p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" 
                placeholder="10"
                value={newCoupon.discount}
                onChange={e => setNewCoupon({...newCoupon, discount: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Validade (Opcional)</label>
            <input 
              type="date"
              className="w-full min-h-[42px] p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" 
              value={newCoupon.expiry}
              onChange={e => setNewCoupon({...newCoupon, expiry: e.target.value})}
            />
          </div>
          <button type="submit" className="w-full min-h-[44px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-100">
            Ativar Cupom
          </button>
        </form>
      </Modal>
    </div>
  );
}

