import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Crown, Plus, Trash2, Eye, UserPlus, 
  ShoppingBag, Mail, Phone, Calendar, DollarSign,
  Tag, Percent, X, ChevronRight, User, Filter,
  TrendingUp, Users, ArrowRight
} from 'lucide-react';

// --- MOCK DATA (Inicial) ---
const INITIAL_CUSTOMERS = [
  { id: '1', name: 'Ana Oliveira', email: 'ana@email.com', phone: '(11) 99999-8888', type: 'VIP', ordersCount: 12, totalSpent: 2450.50, createdAt: '2023-10-15' },
  { id: '2', name: 'Bruno Santos', email: 'bruno@email.com', phone: '(21) 98888-7777', type: 'Novo', ordersCount: 1, totalSpent: 89.90, createdAt: '2024-03-01' },
  { id: '3', name: 'Carla Lima', email: 'carla@email.com', phone: '(31) 97777-6666', type: 'Recorrente', ordersCount: 5, totalSpent: 560.00, createdAt: '2024-01-10' },
];

const INITIAL_ORDERS = [
  { id: 'ORD-001', customerId: '1', date: '2024-03-15', total: 150.00, status: 'Entregue' },
  { id: 'ORD-002', customerId: '1', date: '2024-03-02', total: 220.50, status: 'Entregue' },
  { id: 'ORD-003', customerId: '3', date: '2024-03-20', total: 120.00, status: 'Processando' },
];

const INITIAL_COUPONS = [
  { id: '1', code: 'BEMVINDO10', discount: 10, type: 'Porcentagem', expiry: '2025-12-31', uses: 45, active: true },
  { id: '2', code: 'PRIMEIRA20', discount: 20, type: 'Valor Fixo', expiry: '2024-06-01', uses: 12, active: true },
];

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
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

export default function App() {
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [coupons, setCoupons] = useState(INITIAL_COUPONS);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modais
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Form States
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', type: 'Novo' });
  const [newCoupon, setNewCoupon] = useState({ code: '', discount: '', type: 'Porcentagem', expiry: '' });

  // --- LÓGICA DE CLIENTES ---

  const handleAddCustomer = (e) => {
    e.preventDefault();
    const customer = {
      ...newCustomer,
      id: Math.random().toString(36).substr(2, 9),
      ordersCount: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setCustomers([customer, ...customers]);
    setNewCustomer({ name: '', email: '', phone: '', type: 'Novo' });
    setIsUserModalOpen(false);
  };

  const openDetails = (customer) => {
    setSelectedCustomer(customer);
    setIsDetailModalOpen(true);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- LÓGICA DE CUPONS ---

  const handleAddCoupon = (e) => {
    e.preventDefault();
    const coupon = {
      ...newCoupon,
      id: Math.random().toString(36).substr(2, 9),
      uses: 0,
      active: true
    };
    setCoupons([coupon, ...coupons]);
    setNewCoupon({ code: '', discount: '', type: 'Porcentagem', expiry: '' });
    setIsCouponModalOpen(false);
  };

  const deleteCoupon = (id) => {
    setCoupons(coupons.filter(c => c.id !== id));
  };

  // --- RENDERIZAÇÃO ---

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* --- SEÇÃO DE CLIENTES --- */}
        <section className="space-y-6 mb-16">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Users className="text-indigo-600" size={24} /> 
              Base de Clientes
            </h2>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Users size={24} /></div>
              <div><p className="text-sm text-gray-500 font-medium">Total Clientes</p><h3 className="text-2xl font-bold">{customers.length}</h3></div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Crown size={24} /></div>
              <div><p className="text-sm text-gray-500 font-medium">VIPs</p><h3 className="text-2xl font-bold">{customers.filter(c => c.type === 'VIP').length}</h3></div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><DollarSign size={24} /></div>
              <div><p className="text-sm text-gray-500 font-medium">Receita Total</p><h3 className="text-2xl font-bold">R$ {customers.reduce((acc, c) => acc + c.totalSpent, 0).toLocaleString()}</h3></div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><TrendingUp size={24} /></div>
              <div><p className="text-sm text-gray-500 font-medium">Novos (Mês)</p><h3 className="text-2xl font-bold">{customers.filter(c => c.type === 'Novo').length}</h3></div>
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
            <button 
              onClick={() => setIsUserModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all w-full md:w-auto justify-center"
            >
              <UserPlus size={18} /> Novo Cliente
            </button>
          </div>

          {/* Table Clientes */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
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
                  {filteredCustomers.map(customer => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                            {customer.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{customer.name}</p>
                            <p className="text-xs text-gray-500">{customer.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={customer.type}>{customer.type}</Badge>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-700">{customer.ordersCount}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">R$ {customer.totalSpent.toFixed(2)}</td>
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
            {filteredCustomers.length === 0 && (
              <div className="p-12 text-center">
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
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
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
              <table className="w-full text-left">
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
                  {coupons.map(coupon => (
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
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {/* MODAL: ADICIONAR CLIENTE */}
      <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title="Cadastrar Novo Cliente">
        <form onSubmit={handleAddCustomer} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Nome Completo</label>
              <input 
                required
                className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" 
                placeholder="Ex: João Silva"
                value={newCustomer.name}
                onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">E-mail</label>
              <input 
                required
                type="email"
                className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" 
                placeholder="joao@email.com"
                value={newCustomer.email}
                onChange={e => setNewCustomer({...newCustomer, email: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Telefone</label>
              <input 
                className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" 
                placeholder="(00) 00000-0000"
                value={newCustomer.phone}
                onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Categoria</label>
              <select 
                className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={newCustomer.type}
                onChange={e => setNewCustomer({...newCustomer, type: e.target.value})}
              >
                <option value="Novo">Novo</option>
                <option value="Recorrente">Recorrente</option>
                <option value="VIP">VIP</option>
              </select>
            </div>
          </div>
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-100">
            Criar Cliente
          </button>
        </form>
      </Modal>

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
                  <h2 className="text-2xl font-bold text-gray-900">{selectedCustomer.name}</h2>
                  <Badge variant={selectedCustomer.type}>{selectedCustomer.type}</Badge>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500 font-medium">
                  <span className="flex items-center gap-1.5"><Mail size={16} /> {selectedCustomer.email}</span>
                  <span className="flex items-center gap-1.5"><Phone size={16} /> {selectedCustomer.phone}</span>
                  <span className="flex items-center gap-1.5"><Calendar size={16} /> Cliente desde: {new Date(selectedCustomer.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                  <p className="text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">Gasto Acumulado</p>
                  <p className="text-2xl font-black text-indigo-900">R$ {selectedCustomer.totalSpent.toFixed(2)}</p>
               </div>
               <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <p className="text-amber-600 text-xs font-bold uppercase tracking-wider mb-1">Ticket Médio</p>
                  <p className="text-2xl font-black text-amber-900">
                    R$ {selectedCustomer.ordersCount > 0 ? (selectedCustomer.totalSpent / selectedCustomer.ordersCount).toFixed(2) : "0.00"}
                  </p>
               </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><ShoppingBag size={18} className="text-indigo-600" /> Histórico de Pedidos</h4>
              <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 border-b border-gray-200">
                      <th className="px-4 py-2 font-bold uppercase text-[10px]">ID</th>
                      <th className="px-4 py-2 font-bold uppercase text-[10px]">Data</th>
                      <th className="px-4 py-2 font-bold uppercase text-[10px]">Status</th>
                      <th className="px-4 py-2 font-bold uppercase text-[10px] text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {INITIAL_ORDERS.filter(o => o.customerId === selectedCustomer.id).map(order => (
                      <tr key={order.id} className="text-gray-700">
                        <td className="px-4 py-3 font-mono text-xs">{order.id}</td>
                        <td className="px-4 py-3">{new Date(order.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                           <span className="bg-white border px-2 py-0.5 rounded text-[10px] font-bold">{order.status}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">R$ {order.total.toFixed(2)}</td>
                      </tr>
                    ))}
                    {INITIAL_ORDERS.filter(o => o.customerId === selectedCustomer.id).length === 0 && (
                      <tr><td colSpan="4" className="px-4 py-6 text-center text-gray-500">Nenhum pedido encontrado.</td></tr>
                    )}
                  </tbody>
                </table>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Tipo de Desconto</label>
              <select 
                className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
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
                className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" 
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
              className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" 
              value={newCoupon.expiry}
              onChange={e => setNewCoupon({...newCoupon, expiry: e.target.value})}
            />
          </div>
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-100">
            Ativar Cupom
          </button>
        </form>
      </Modal>
    </div>
  );
}