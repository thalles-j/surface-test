import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Lock, 
  Unlock, 
  TrendingUp, 
  Zap, 
  Clock, 
  Eye 
} from 'lucide-react';
import { api } from '../../../services/api';
import { resolveImageUrl } from '../../../utils/resolveImageUrl';
import { useToast } from '../../../context/ToastContext';

const EMPTY_DASHBOARD_DATA = {
  monthlyRevenue: 0,
  orders: 0,
  avgTicket: 0,
  conversionRate: 0,
  revenueGrowth: '0%',
  ordersGrowth: '0%',
  avgTicketGrowth: '0%',
  topProducts: [],
};

const StatCard = ({ title, value, change, isPositive }) => (
  <div className="bg-white p-4 sm:p-6 border border-zinc-200 rounded-xl hover:border-zinc-300 shadow-sm transition-all duration-300">
    <p className="text-zinc-500 text-xs sm:text-sm font-medium">{title}</p>
    <div className="flex items-end justify-between gap-2 mt-3">
      <h3 className="text-xl sm:text-2xl sm:text-3xl font-bold text-zinc-900 break-words">{value}</h3>
      {change && (
        <span className={`flex items-center gap-1 text-xs font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {change}
        </span>
      )}
    </div>
  </div>
);

export default function Dashboard({ onCreateCollection }) {
  const toast = useToast();
  const [isDropLocked, setIsDropLocked] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [visitsCount, setVisitsCount] = useState(0);
  const [categorySales, setCategorySales] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        setLoading(true);
        // Hit de visita (background)
        api.post('/admin/analytics/visits/hit', { path: '/admin/dashboard' }).catch(() => {});

        const [statsRes, topRes, ordersRes, settingsRes, visitsRes, catRes] = await Promise.all([
          api.get('/admin/dashboard/stats'),
          api.get('/admin/dashboard/top-products'),
          api.get('/admin/analytics/recent-orders').catch(() => ({ data: [] })),
          api.get('/admin/settings').catch(() => ({ data: {} })),
          api.get('/admin/analytics/visits').catch(() => ({ data: [] })),
          api.get('/admin/analytics/category-sales').catch(() => ({ data: [] })),
        ]);

        if (cancelled) return;

        setRecentOrders(ordersRes.data || []);
        setIsDropLocked(settingsRes.data?.loja_ativa === false);
        setCategorySales(Array.isArray(catRes.data) ? catRes.data : []);
        
        const safeVisits = Array.isArray(visitsRes.data) ? visitsRes.data : [];
        const visitsTotal = safeVisits.reduce((s, it) => s + (it.count || 0), 0);
        setVisitsCount(visitsTotal);

        const stats = statsRes.data || {};
        const topProducts = (topRes.data || []).map((it) => {
          const prod = it.produto || it.prod || {};
          return {
            id: prod.id_produto || prod.id || prod.idProduto,
            name: prod.nome_produto || prod.nome || prod.name,
            price: Number(prod.preco || prod.price || 0),
            sold: it.sold || 0,
            sku: Array.isArray(prod.variacoes_estoque) && prod.variacoes_estoque[0] ? prod.variacoes_estoque[0].sku : prod.sku || '',
            image: prod.fotos && prod.fotos[0] ? resolveImageUrl(prod.fotos[0].url) : ''
          };
        });

        setDashboardData({
          monthlyRevenue: Number(stats.monthlyRevenue || 0),
          orders: stats.ordersCount || stats.orders || 0,
          avgTicket: Number(stats.avgTicket || 0),
          conversionRate: stats.conversionRate || 0,
          revenueGrowth: String(stats.revenueGrowth ?? '0%'),
          ordersGrowth: String(stats.ordersGrowth ?? '0%'),
          avgTicketGrowth: String(stats.avgTicketGrowth ?? '0%'),
          topProducts,
        });
      } catch (err) {
        if (!cancelled) {
          console.error('Erro ao carregar dashboard:', err);
          toast.error('Erro ao carregar dados do dashboard');
          setDashboardData(EMPTY_DASHBOARD_DATA);
          setRecentOrders([]);
          setCategorySales([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [toast]);

  if (loading || !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
        <p className="text-zinc-500 font-medium animate-pulse">Sincronizando dados...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Faturamento (Mês)"
          value={`R$ ${dashboardData.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          change={dashboardData.revenueGrowth}
          isPositive={!dashboardData.revenueGrowth.startsWith('-')}
        />
        <StatCard title="Pedidos" value={dashboardData.orders} change={dashboardData.ordersGrowth} isPositive={!dashboardData.ordersGrowth.startsWith('-')} />
        <StatCard
          title="Ticket Médio"
          value={`R$ ${dashboardData.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          change={dashboardData.avgTicketGrowth}
          isPositive={!dashboardData.avgTicketGrowth.startsWith('-')}
        />
        <StatCard title="Taxa de Conversão" value={`${dashboardData.conversionRate}%`} change="" isPositive={true} />
      </div>

      {/* SEÇÃO PRINCIPAL: PRODUTOS E STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* TOP PRODUTOS */}
        <div className="bg-white p-4 sm:p-8 border border-zinc-200 rounded-xl shadow-sm">
          <div className="flex justify-between items-center gap-3 mb-6">
            <h3 className="font-bold text-base sm:text-lg text-zinc-900">Produtos Mais Vendidos</h3>
            <button className="text-xs text-zinc-400 hover:text-zinc-900 transition-colors">Ver tudo →</button>
          </div>
          <div className="space-y-4">
            {dashboardData.topProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 pb-4 border-b border-zinc-100 last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={p.image || "/placeholder-prod.png"} alt={p.name} className="w-12 h-12 object-cover rounded-lg bg-zinc-100" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-zinc-900 truncate">{p.name}</p>
                    <span className="text-[10px] bg-zinc-100 px-2 py-1 rounded font-mono text-zinc-500">{p.sku}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-zinc-900">R$ {p.price.toFixed(2)}</p>
                  <p className="text-[10px] text-zinc-500">{p.sold} vendidos</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* STATUS DO DROP */}
        <div className="bg-white p-4 sm:p-8 border border-zinc-200 rounded-xl shadow-sm">
          <h3 className="font-bold text-base sm:text-lg mb-6 text-zinc-900">Status do Próximo Drop</h3>
          <div className="flex flex-col items-center justify-center py-8">
            <div className={`p-4 rounded-full mb-4 ${isDropLocked ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {isDropLocked ? <Lock size={32} /> : <Unlock size={32} />}
            </div>
            <p className="text-xs sm:text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-2 text-center">Modo Coming Soon</p>
            <h4 className="text-xl sm:text-2xl font-bold mb-6 text-zinc-900 text-center">{isDropLocked ? 'Site Travado' : 'Site Aberto'}</h4>
            <button
              onClick={async () => {
                try {
                  const res = await api.patch('/admin/settings/toggle-store', { loja_ativa: isDropLocked });
                  setIsDropLocked(!res.data.loja_ativa);
                  toast.success(res.data.loja_ativa ? 'Loja aberta!' : 'Loja fechada!');
                } catch (err) {
                  toast.error('Erro ao alternar status');
                }
              }}
              className={`w-full sm:w-auto px-5 sm:px-8 py-3 rounded-lg text-sm font-bold shadow-sm transition-all ${
                isDropLocked ? 'bg-zinc-900 text-white hover:bg-black' : 'border-2 border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              {isDropLocked ? '🔓 Liberar Acesso' : '🔒 Travar Site'}
            </button>
          </div>
        </div>
      </div>

      {/* ANALYTICS: ACESSOS E CATEGORIAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white p-4 sm:p-6 border border-zinc-200 rounded-xl flex items-center gap-3 sm:gap-4 shadow-sm">
          <div className="p-3 bg-blue-50 rounded-lg"><Eye size={24} className="text-blue-600" /></div>
          <div>
            <p className="text-zinc-500 text-sm font-medium">Total de Acessos</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-zinc-900">{visitsCount.toLocaleString('pt-BR')}</h3>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-4 sm:p-6 border border-zinc-200 rounded-xl shadow-sm">
          <h3 className="text-sm font-bold mb-4 text-zinc-900 uppercase tracking-wider">Vendas por Categoria</h3>
          <div className="space-y-3">
            {categorySales.map((cat) => {
              const maxValue = Math.max(...categorySales.map(c => Number(c.value || 0)), 1);
              const value = Number(cat.value || 0);
              return (
                <div key={cat.name} className="flex items-center gap-3 sm:gap-4">
                  <div className="w-20 sm:w-24 text-[11px] sm:text-xs font-bold text-zinc-500 truncate">{cat.name}</div>
                  <div className="flex-1 bg-zinc-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-zinc-900 h-full rounded-full transition-all duration-700" 
                      style={{ width: `${(value / maxValue) * 100}%` }} 
                    />
                  </div>
                  <div className="text-right text-[11px] sm:text-xs font-bold text-zinc-900 w-16 sm:w-20">
                    R$ {value.toLocaleString('pt-BR')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* PEDIDOS RECENTES */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-zinc-100 bg-zinc-50/50">
          <h3 className="font-bold flex items-center gap-2 text-zinc-900"><Clock size={18} /> Pedidos Recentes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm text-left">
            <thead>
              <tr className="text-zinc-400 text-[10px] uppercase tracking-widest border-b border-zinc-100">
                <th className="px-6 py-4 font-semibold">ID</th>
                <th className="px-6 py-4 font-semibold">Cliente</th>
                <th className="px-6 py-4 font-semibold">Total</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {recentOrders.map(order => (
                <tr key={order.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-zinc-900">#{order.id}</td>
                  <td className="px-6 py-4 text-zinc-600 font-medium">{order.client || order.customer}</td>
                  <td className="px-6 py-4 font-bold text-zinc-900">R$ {Number(order.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-zinc-100 text-zinc-600 uppercase">
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-400 text-xs text-right">{new Date(order.date).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* BOTÕES DE AÇÃO RÁPIDA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-10">
        <button 
          onClick={onCreateCollection}
          className="flex items-center justify-between p-4 sm:p-6 bg-zinc-900 text-white rounded-xl hover:bg-black transition-all group"
        >
          <div className="text-left">
            <h4 className="font-bold">Criar Coleção</h4>
            <p className="text-xs text-zinc-400">Preparar novo drop</p>
          </div>
          <TrendingUp className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        </button>

        <button className="flex items-center justify-between p-4 sm:p-6 bg-white border-2 border-zinc-100 rounded-xl hover:border-zinc-900 transition-all group">
          <div className="text-left">
            <h4 className="font-bold text-zinc-900">Disparar Campanha</h4>
            <p className="text-xs text-zinc-500">Notificar via E-mail/WhatsApp</p>
          </div>
          <Zap size={20} className="text-zinc-900" />
        </button>
      </div>

    </div>
  );
}

