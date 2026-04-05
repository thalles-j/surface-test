import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Crown, Plus, Trash2, Eye } from 'lucide-react';
import Modal from '../Modal';
import AlertModal from '../AlertModal';
import Pagination from './Pagination';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';

const PAGE_SIZE = 15;

export default function Customers() {
  const { addToast } = useToast();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedType, setSelectedType] = useState('todos');
  const [sortBy, setSortBy] = useState('');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [detailModal, setDetailModal] = useState({ isOpen: false, customer: null });
  const [detailData, setDetailData] = useState(null);

  // --- Coupons ---
  const [coupons, setCoupons] = useState([]);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponData, setCouponData] = useState({ code: '', discount: '', type: 'Porcentagem', expiry: '' });
  const [confirmDeleteCoupon, setConfirmDeleteCoupon] = useState({ isOpen: false, id: null });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [debouncedSearch, selectedType]);

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('limit', PAGE_SIZE);
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (selectedType !== 'todos') params.set('type', selectedType);
      if (sortBy) {
        params.set('sortBy', sortBy);
        params.set('sortDir', sortDir);
      }

      const res = await api.get(`/admin/customers?${params}`);
      if (res.data?.data) {
        setCustomers(res.data.data);
        setTotalPages(res.data.totalPages || 1);
        setTotalItems(res.data.total || 0);
      } else {
        setCustomers(res.data || []);
      }
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
      addToast('Erro ao carregar clientes', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, selectedType, sortBy, sortDir, addToast]);

  const loadCoupons = useCallback(async () => {
    try {
      const res = await api.get('/admin/marketing/coupons');
      setCoupons((res.data || []).map(c => ({
        id: c.id_cupom,
        code: c.codigo,
        discount: Number(c.desconto),
        type: c.tipo,
        expiry: c.validade,
        uses: c.usos || 0,
        active: c.ativo,
      })));
    } catch (err) {
      console.error('Erro ao carregar cupons:', err);
    }
  }, []);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);
  useEffect(() => { loadCoupons(); }, [loadCoupons]);

  const getTypeColor = useCallback((type) => {
    switch (type) {
      case 'VIP': return 'bg-purple-100 text-purple-700';
      case 'Recorrente': return 'bg-blue-100 text-blue-700';
      case 'Novo': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }, []);

  const stats = useMemo(() => ({
    total: totalItems,
    vip: customers.filter(c => c.type === 'VIP').length,
    novo: customers.filter(c => c.type === 'Novo').length,
    totalSpent: customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0),
  }), [customers, totalItems]);

  const openCustomerDetail = useCallback(async (customer) => {
    setDetailModal({ isOpen: true, customer });
    try {
      const res = await api.get(`/admin/customers/${customer.id}`);
      setDetailData(res.data);
    } catch (err) {
      console.error('Erro ao carregar detalhes:', err);
      addToast('Erro ao carregar detalhes do cliente', 'error');
    }
  }, [addToast]);

  const closeDetailModal = useCallback(() => {
    setDetailModal({ isOpen: false, customer: null });
    setDetailData(null);
  }, []);

  const handleToggleSort = useCallback((field) => {
    if (sortBy === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  }, [sortBy]);

  // --- Cupons ---
  const handleAddCoupon = useCallback(async () => {
    if (!couponData.code || !couponData.discount) {
      addToast('Preencha código e desconto', 'warning');
      return;
    }
    try {
      await api.post('/admin/marketing/coupons', {
        codigo: couponData.code,
        desconto: Number(couponData.discount),
        tipo: couponData.type,
        validade: couponData.expiry || null,
        ativo: true,
      });
      addToast('Cupom criado com sucesso!', 'success');
      await loadCoupons();
      setCouponData({ code: '', discount: '', type: 'Porcentagem', expiry: '' });
      setShowCouponForm(false);
    } catch (err) {
      console.error('Erro ao criar cupom:', err);
      addToast('Erro ao criar cupom', 'error');
    }
  }, [couponData, addToast, loadCoupons]);

  const performConfirmDeleteCoupon = useCallback(async () => {
    if (!confirmDeleteCoupon.id) return;
    try {
      await api.delete(`/admin/marketing/coupons/${confirmDeleteCoupon.id}`);
      setCoupons(prev => prev.filter(c => c.id !== confirmDeleteCoupon.id));
      setConfirmDeleteCoupon({ isOpen: false, id: null });
      addToast('Cupom excluído', 'success');
    } catch (err) {
      console.error('Erro ao deletar cupom:', err);
      addToast('Erro ao deletar cupom', 'error');
    }
  }, [confirmDeleteCoupon.id, addToast]);

  if (loading && customers.length === 0) return <div className="text-center py-12">Carregando clientes...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 border border-gray-100 rounded-lg">
          <p className="text-gray-500 text-sm font-medium">Total de Clientes</p>
          <h3 className="text-3xl font-bold mt-2">{stats.total}</h3>
        </div>
        <div className="bg-white p-6 border border-gray-100 rounded-lg">
          <p className="text-gray-500 text-sm font-medium">Clientes VIP</p>
          <h3 className="text-3xl font-bold mt-2 text-purple-600">{stats.vip}</h3>
          <p className="text-xs text-gray-400 mt-1">nesta página</p>
        </div>
        <div className="bg-white p-6 border border-gray-100 rounded-lg">
          <p className="text-gray-500 text-sm font-medium">Novos Clientes</p>
          <h3 className="text-3xl font-bold mt-2 text-green-600">{stats.novo}</h3>
          <p className="text-xs text-gray-400 mt-1">nesta página</p>
        </div>
        <div className="bg-white p-6 border border-gray-100 rounded-lg">
          <p className="text-gray-500 text-sm font-medium">Receita (página)</p>
          <h3 className="text-2xl font-bold mt-2">R$ {stats.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
      </div>

      {/* TABELA */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome, email ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-black outline-none"
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-black bg-white"
          >
            <option value="todos">Todas as Categorias</option>
            <option value="VIP">VIP</option>
            <option value="Recorrente">Recorrente</option>
            <option value="Novo">Novo</option>
          </select>
        </div>

        {loading && <div className="p-4 text-center text-gray-400 text-sm">Atualizando...</div>}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-gray-100">
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Telefone</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4 cursor-pointer select-none" onClick={() => handleToggleSort('ordersCount')}>
                  Pedidos {sortBy === 'ordersCount' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="px-6 py-4">Ticket Médio</th>
                <th className="px-6 py-4 cursor-pointer select-none" onClick={() => handleToggleSort('totalSpent')}>
                  Total Gasto {sortBy === 'totalSpent' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="px-6 py-4">Última Compra</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-sm">{c.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.phone || '—'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {c.type === 'VIP' && <Crown size={14} className="text-purple-600" />}
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${getTypeColor(c.type)}`}>
                        {c.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-sm">{c.ordersCount}</td>
                  <td className="px-6 py-4 text-sm">R$ {(c.ticketMedio || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 font-bold">R$ {(c.totalSpent || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{c.ultimaCompra ? new Date(c.ultimaCompra).toLocaleDateString('pt-BR') : '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openCustomerDetail(c)} className="p-2 text-gray-400 hover:text-black transition-colors" title="Ver detalhes">
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && customers.length === 0 && (
          <div className="p-12 text-center text-gray-400">
            <p>Nenhum cliente encontrado.</p>
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} total={totalItems} onPageChange={setPage} limit={PAGE_SIZE} />
      </div>

      {/* Customer Detail Modal */}
      <Modal isOpen={detailModal.isOpen} onClose={closeDetailModal} title={`Cliente: ${detailModal.customer?.name || ''}`} size="lg">
        {detailData ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-gray-400 font-bold uppercase">Email</p><p className="text-sm">{detailData.email}</p></div>
              <div><p className="text-xs text-gray-400 font-bold uppercase">Telefone</p><p className="text-sm">{detailData.phone || '—'}</p></div>
              <div><p className="text-xs text-gray-400 font-bold uppercase">Cadastro</p><p className="text-sm">{new Date(detailData.registered).toLocaleDateString('pt-BR')}</p></div>
              <div><p className="text-xs text-gray-400 font-bold uppercase">Ticket Médio</p><p className="text-sm font-bold">R$ {(detailData.ticketMedio || 0).toFixed(2)}</p></div>
            </div>

            {detailData.addresses?.length > 0 && (
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-400 font-bold uppercase mb-2">Endereços</p>
                {detailData.addresses.map((a, i) => (
                  <p key={i} className="text-sm text-gray-600">{a.logradouro}, {a.numero}{a.complemento ? ` - ${a.complemento}` : ''} — {a.cidade}/{a.estado} CEP {a.cep}</p>
                ))}
              </div>
            )}

            {detailData.orders?.length > 0 && (
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-400 font-bold uppercase mb-2">Histórico de Pedidos</p>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {detailData.orders.map(o => (
                    <div key={o.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                      <div>
                        <p className="text-sm font-bold">Pedido #{o.id}</p>
                        <p className="text-xs text-gray-400">{new Date(o.date).toLocaleDateString('pt-BR')} — {o.items.length} item(s)</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">R$ {o.total.toFixed(2)}</p>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${o.status === 'finalizado' ? 'bg-green-100 text-green-700' : o.status === 'cancelado' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{o.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-gray-400 py-8">Carregando...</p>
        )}
      </Modal>

      {/* CUPONS */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold">Gerenciar Cupons</h2>
          <button
            onClick={() => setShowCouponForm(true)}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg font-bold hover:bg-zinc-800 transition-colors"
          >
            <Plus size={16} /> Novo Cupom
          </button>
        </div>

        <Modal isOpen={showCouponForm} onClose={() => setShowCouponForm(false)} title="Criar Novo Cupom">
          <div className="p-2">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                value={couponData.code}
                onChange={(e) => setCouponData({ ...couponData, code: e.target.value.toUpperCase() })}
                placeholder="Código"
                maxLength="20"
                className="p-2 border border-gray-300 rounded-lg outline-none focus:border-black font-mono font-bold bg-zinc-50"
              />
              <input
                type="number"
                value={couponData.discount}
                onChange={(e) => setCouponData({ ...couponData, discount: e.target.value })}
                placeholder="Desconto"
                className="p-2 border border-gray-300 rounded-lg outline-none focus:border-black bg-zinc-50"
              />
              <select
                value={couponData.type}
                onChange={(e) => setCouponData({ ...couponData, type: e.target.value })}
                className="p-2 border border-gray-300 rounded-lg outline-none focus:border-black bg-zinc-50"
              >
                <option>Porcentagem</option>
                <option>Valor Fixo</option>
                <option>Frete</option>
              </select>
              <input
                type="date"
                value={couponData.expiry}
                onChange={(e) => setCouponData({ ...couponData, expiry: e.target.value })}
                className="p-2 border border-gray-300 rounded-lg outline-none focus:border-black bg-zinc-50"
              />
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={handleAddCoupon} className="flex-1 bg-green-600 text-white py-2 font-bold hover:bg-green-700 rounded-lg">Criar Cupom</button>
              <button onClick={() => setShowCouponForm(false)} className="px-6 py-2 border border-gray-300 font-bold hover:bg-gray-50 rounded-lg">Cancelar</button>
            </div>
          </div>
        </Modal>

        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-gray-100">
              <th className="px-6 py-4">Código</th>
              <th className="px-6 py-4">Desconto</th>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-6 py-4">Validade</th>
              <th className="px-6 py-4">Usos</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {coupons.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-mono bg-zinc-100 px-3 py-1 rounded font-bold text-sm">{c.code}</span>
                </td>
                <td className="px-6 py-4 font-bold">{c.discount}{c.type === 'Porcentagem' ? '%' : 'R$'}</td>
                <td className="px-6 py-4 text-sm">{c.type}</td>
                <td className="px-6 py-4 text-sm">{c.expiry ? new Date(c.expiry).toLocaleDateString('pt-BR') : 'Sem expiração'}</td>
                <td className="px-6 py-4 font-bold">{c.uses}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => setConfirmDeleteCoupon({ isOpen: true, id: c.id })} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {coupons.length === 0 && (
          <div className="p-8 text-center text-gray-400"><p>Nenhum cupom cadastrado.</p></div>
        )}

        <AlertModal
          isOpen={confirmDeleteCoupon.isOpen}
          onClose={() => setConfirmDeleteCoupon({ isOpen: false, id: null })}
          title="Confirmar exclusão"
          message="Deseja realmente excluir este cupom?"
          type="warning"
          actionLabel="Excluir"
          actionCallback={performConfirmDeleteCoupon}
        />
      </div>
    </div>
  );
}
