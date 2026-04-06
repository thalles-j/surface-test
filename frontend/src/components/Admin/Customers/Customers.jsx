import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Crown, Plus, Trash2, Eye, Mail, Phone, Calendar, ShoppingBag, DollarSign, MapPin, Tag } from 'lucide-react';
import Modal from '../../Modal';
import AlertModal from '../../AlertModal';
import Pagination from '../Pagination/Pagination';
import { ModalSection, ModalField, ModalFormGroup, inputClass, selectClass, primaryBtnClass, secondaryBtnClass } from '../AdminModalParts';
import { useToast } from '../../../context/ToastContext';
import { api } from '../../../services/api';

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
      addToast('Erro ao carregar cupons', 'error');
    }
  }, []);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);
  useEffect(() => { loadCoupons(); }, [loadCoupons]);

  const getTypeColor = useCallback((type) => {
    switch (type) {
      case 'VIP': return 'bg-purple-950 text-purple-400';
      case 'Recorrente': return 'bg-blue-950 text-blue-400';
      case 'Novo': return 'bg-emerald-950 text-emerald-400';
      default: return 'bg-zinc-800 text-zinc-400';
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
      setConfirmDeleteCoupon({ isOpen: false, id: null });
      addToast('Cupom excluído', 'success');
      await loadCoupons();
    } catch (err) {
      console.error('Erro ao deletar cupom:', err);
      addToast('Erro ao deletar cupom', 'error');
    }
  }, [confirmDeleteCoupon.id, addToast, loadCoupons]);

  if (loading && customers.length === 0) return <div className="text-center py-12">Carregando clientes...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 p-6 border border-zinc-800 rounded-xl">
          <p className="text-zinc-500 text-sm font-medium">Total de Clientes</p>
          <h3 className="text-3xl font-bold mt-2">{ stats.total}</h3>
        </div>
        <div className="bg-zinc-900 p-6 border border-zinc-800 rounded-xl">
          <p className="text-zinc-500 text-sm font-medium">Clientes VIP</p>
          <h3 className="text-3xl font-bold mt-2 text-purple-400">{stats.vip}</h3>
          <p className="text-xs text-zinc-600 mt-1">nesta página</p>
        </div>
        <div className="bg-zinc-900 p-6 border border-zinc-800 rounded-xl">
          <p className="text-zinc-500 text-sm font-medium">Novos Clientes</p>
          <h3 className="text-3xl font-bold mt-2 text-emerald-400">{stats.novo}</h3>
          <p className="text-xs text-zinc-600 mt-1">nesta página</p>
        </div>
        <div className="bg-zinc-900 p-6 border border-zinc-800 rounded-xl">
          <p className="text-zinc-500 text-sm font-medium">Receita (página)</p>
          <h3 className="text-2xl font-bold mt-2">R$ {stats.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
      </div>

      {/* TABELA */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome, email ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:border-zinc-500 outline-none text-white placeholder-zinc-500"
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg outline-none focus:border-zinc-500 text-white"
          >
            <option value="todos">Todas as Categorias</option>
            <option value="VIP">VIP</option>
            <option value="Recorrente">Recorrente</option>
            <option value="Novo">Novo</option>
          </select>
        </div>

        {loading && <div className="p-4 text-center text-zinc-500 text-sm">Atualizando...</div>}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-800/50 text-xs font-bold uppercase text-zinc-500 border-b border-zinc-800">
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
            <tbody className="divide-y divide-zinc-800">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-sm">{c.name}</td>
                  <td className="px-6 py-4 text-sm text-zinc-400">{c.email}</td>
                  <td className="px-6 py-4 text-sm text-zinc-400">{c.phone || '—'}</td>
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
                  <td className="px-6 py-4 text-sm text-zinc-500">{c.ultimaCompra ? new Date(c.ultimaCompra).toLocaleDateString('pt-BR') : '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openCustomerDetail(c)} className="p-2 text-zinc-500 hover:text-white transition-colors" title="Ver detalhes">
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && customers.length === 0 && (
          <div className="p-12 text-center text-zinc-500">
            <p>Nenhum cliente encontrado.</p>
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} total={totalItems} onPageChange={setPage} limit={PAGE_SIZE} />
      </div>

      {/* Customer Detail Modal */}
      <Modal isOpen={detailModal.isOpen} onClose={closeDetailModal} title={detailModal.customer?.name || 'Cliente'} size="lg" variant="dark">
        {detailData ? (
          <div className="space-y-6">
            {/* Header card */}
            <div className="flex items-start gap-4 p-4 bg-zinc-800/40 rounded-xl border border-zinc-800/50">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-zinc-700/50 flex items-center justify-center text-lg font-bold text-zinc-300">
                {(detailData.name || detailData.email || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-bold text-white truncate">{detailData.name || detailData.email}</h4>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-zinc-400">
                  <span className="flex items-center gap-1"><Mail size={12} />{detailData.email}</span>
                  {detailData.phone && <span className="flex items-center gap-1"><Phone size={12} />{detailData.phone}</span>}
                  <span className="flex items-center gap-1"><Calendar size={12} />Desde {new Date(detailData.registered).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
              {detailModal.customer?.type && (
                <span className={`flex-shrink-0 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${detailModal.customer.type === 'VIP' ? 'bg-purple-950 text-purple-400' : detailModal.customer.type === 'Novo' ? 'bg-emerald-950 text-emerald-400' : 'bg-blue-950 text-blue-400'}`}>
                  {detailModal.customer.type === 'VIP' && <Crown size={10} className="inline mr-1 -mt-px" />}{detailModal.customer.type}
                </span>
              )}
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 bg-zinc-800/30 border border-zinc-800/50 rounded-xl text-center">
                <ShoppingBag size={16} className="mx-auto text-zinc-500 mb-1.5" />
                <p className="text-lg font-bold text-white">{detailData.ordersCount || 0}</p>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Pedidos</p>
              </div>
              <div className="p-3.5 bg-zinc-800/30 border border-zinc-800/50 rounded-xl text-center">
                <Tag size={16} className="mx-auto text-zinc-500 mb-1.5" />
                <p className="text-lg font-bold text-white">R$ {(detailData.ticketMedio || 0).toFixed(2)}</p>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Ticket Médio</p>
              </div>
              <div className="p-3.5 bg-zinc-800/30 border border-zinc-800/50 rounded-xl text-center">
                <DollarSign size={16} className="mx-auto text-zinc-500 mb-1.5" />
                <p className="text-lg font-bold text-white">R$ {(detailData.totalSpent || 0).toFixed(2)}</p>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Total Gasto</p>
              </div>
            </div>

            {/* Addresses */}
            {detailData.addresses?.length > 0 && (
              <ModalSection title="Endereços">
                <div className="space-y-2">
                  {detailData.addresses.map((a, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 bg-zinc-800/30 border border-zinc-800/50 rounded-lg">
                      <MapPin size={14} className="text-zinc-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-zinc-300">{a.logradouro}, {a.numero}{a.complemento ? ` - ${a.complemento}` : ''} — {a.cidade}/{a.estado} CEP {a.cep}</p>
                    </div>
                  ))}
                </div>
              </ModalSection>
            )}

            {/* Order History */}
            {detailData.orders?.length > 0 && (
              <ModalSection title="Histórico de Pedidos">
                <div className="space-y-2 max-h-56 overflow-y-auto admin-scroll pr-1">
                  {detailData.orders.map(o => (
                    <div key={o.id} className="flex items-center justify-between p-3.5 bg-zinc-800/30 border border-zinc-800/50 rounded-lg hover:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-700/50 flex items-center justify-center">
                          <ShoppingBag size={14} className="text-zinc-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Pedido #{o.id}</p>
                          <p className="text-xs text-zinc-500">{new Date(o.date).toLocaleDateString('pt-BR')} — {o.items.length} item(s)</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${o.status === 'finalizado' || o.status === 'concluido' ? 'bg-emerald-950/60 text-emerald-400' : o.status === 'cancelado' ? 'bg-red-950/60 text-red-400' : 'bg-yellow-950/60 text-yellow-400'}`}>{o.status}</span>
                        <p className="text-sm font-bold text-white min-w-[80px] text-right">R$ {o.total.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ModalSection>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin" />
          </div>
        )}
      </Modal>

      {/* CUPONS */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-lg font-bold">Gerenciar Cupons</h2>
          <button
            onClick={() => setShowCouponForm(true)}
            className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-bold hover:bg-zinc-200 transition-colors"
          >
            <Plus size={16} /> Novo Cupom
          </button>
        </div>

        <Modal
          isOpen={showCouponForm}
          onClose={() => setShowCouponForm(false)}
          title="Criar Novo Cupom"
          variant="dark"
          footer={
            <>
              <button onClick={() => setShowCouponForm(false)} className={secondaryBtnClass}>Cancelar</button>
              <button onClick={handleAddCoupon} className={primaryBtnClass}>Criar Cupom</button>
            </>
          }
        >
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ModalFormGroup label="Código do Cupom" htmlFor="coupon-code">
                <input
                  id="coupon-code"
                  type="text"
                  value={couponData.code}
                  onChange={(e) => setCouponData({ ...couponData, code: e.target.value.toUpperCase() })}
                  placeholder="Ex: SURFACE10"
                  maxLength="20"
                  className={`${inputClass} font-mono font-bold`}
                />
              </ModalFormGroup>
              <ModalFormGroup label="Valor do Desconto" htmlFor="coupon-discount">
                <input
                  id="coupon-discount"
                  type="number"
                  value={couponData.discount}
                  onChange={(e) => setCouponData({ ...couponData, discount: e.target.value })}
                  placeholder="Ex: 10"
                  className={inputClass}
                />
              </ModalFormGroup>
              <ModalFormGroup label="Tipo de Desconto" htmlFor="coupon-type">
                <select
                  id="coupon-type"
                  value={couponData.type}
                  onChange={(e) => setCouponData({ ...couponData, type: e.target.value })}
                  className={selectClass}
                >
                  <option>Porcentagem</option>
                  <option>Valor Fixo</option>
                  <option>Frete</option>
                </select>
              </ModalFormGroup>
              <ModalFormGroup label="Validade" htmlFor="coupon-expiry">
                <input
                  id="coupon-expiry"
                  type="date"
                  value={couponData.expiry}
                  onChange={(e) => setCouponData({ ...couponData, expiry: e.target.value })}
                  className={inputClass}
                />
              </ModalFormGroup>
            </div>
          </div>
        </Modal>

        <table className="w-full">
          <thead>
            <tr className="bg-zinc-800/50 text-xs font-bold uppercase text-zinc-500 border-b border-zinc-800">
              <th className="px-6 py-4">Código</th>
              <th className="px-6 py-4">Desconto</th>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-6 py-4">Validade</th>
              <th className="px-6 py-4">Usos</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {coupons.map((c) => (
              <tr key={c.id} className="hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-mono bg-zinc-800 px-3 py-1 rounded font-bold text-sm">{c.code}</span>
                </td>
                <td className="px-6 py-4 font-bold">{c.discount}{c.type === 'Porcentagem' ? '%' : 'R$'}</td>
                <td className="px-6 py-4 text-sm">{c.type}</td>
                <td className="px-6 py-4 text-sm">{c.expiry ? new Date(c.expiry).toLocaleDateString('pt-BR') : 'Sem expiração'}</td>
                <td className="px-6 py-4 font-bold">{c.uses}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => setConfirmDeleteCoupon({ isOpen: true, id: c.id })} className="p-2 text-zinc-500 hover:text-red-400 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {coupons.length === 0 && (
          <div className="p-8 text-center text-zinc-500"><p>Nenhum cupom cadastrado.</p></div>
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
