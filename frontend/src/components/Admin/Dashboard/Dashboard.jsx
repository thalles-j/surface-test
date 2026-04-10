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
import { useAdminTheme } from '../../../context/AdminThemeContext';

const StatCard = ({ title, value, change, isPositive, isLightTheme }) => (
  <div
    className={`p-6 border rounded-xl shadow-sm transition-all duration-300 ${
      isLightTheme
        ? 'bg-white border-zinc-200 hover:border-zinc-300'
        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
    }`}
  >
    <p className={`text-sm font-medium ${isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}`}>{title}</p>
    <div className="flex items-end justify-between mt-3">
      <h3 className={`text-3xl font-bold ${isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}`}>{value}</h3>
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
  const { theme } = useAdminTheme();
  const isLightTheme = theme === 'light';
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
        setCategorySales(catRes.data || []);

        const visitsTotal = (visitsRes.data || []).reduce((s, it) => s + (it.count || 0), 0);
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
          revenueGrowth: stats.revenueGrowth || '0%',
          ordersGrowth: stats.ordersGrowth || '0%',
          avgTicketGrowth: stats.avgTicketGrowth || '0%',
          topProducts,
        });
      } catch (err) {
        if (!cancelled) {
          console.error('Erro ao carregar dashboard:', err);
          toast.error('Erro ao carregar dados do dashboard');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  if (loading || !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className={`w-10 h-10 border-4 rounded-full animate-spin ${isLightTheme ? 'border-zinc-200 border-t-zinc-900' : 'border-zinc-700 border-t-zinc-200'}`}></div>
        <p className={`font-medium animate-pulse ${isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}`}>Sincronizando dados...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Faturamento (Mês)"
          value={`R$ ${dashboardData.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          change={dashboardData.revenueGrowth}
          isPositive={!dashboardData.revenueGrowth.startsWith('-')}
          isLightTheme={isLightTheme}
        />
        <StatCard
          title="Pedidos"
          value={dashboardData.orders}
          change={dashboardData.ordersGrowth}
          isPositive={!dashboardData.ordersGrowth.startsWith('-')}
          isLightTheme={isLightTheme}
        />
        <StatCard
          title="Ticket Médio"
          value={`R$ ${dashboardData.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          change={dashboardData.avgTicketGrowth}
          isPositive={!dashboardData.avgTicketGrowth.startsWith('-')}
          isLightTheme={isLightTheme}
        />
        <StatCard title="Taxa de Conversão" value={`${dashboardData.conversionRate}%`} change="" isPositive={true} isLightTheme={isLightTheme} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`p-8 border rounded-xl shadow-sm ${isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-900 border-zinc-800'}`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className={`font-bold text-lg ${isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}`}>Produtos Mais Vendidos</h3>
            <button className={`text-xs transition-colors ${isLightTheme ? 'text-zinc-400 hover:text-zinc-900' : 'text-zinc-500 hover:text-zinc-200'}`}>Ver tudo {'->'}</button>
          </div>
          <div className="space-y-4">
            {dashboardData.topProducts.map((p) => (
              <div key={p.id} className={`flex items-center justify-between pb-4 border-b last:border-0 ${isLightTheme ? 'border-zinc-100' : 'border-zinc-800'}`}>
                <div className="flex items-center gap-3">
                  <img src={p.image || '/placeholder-prod.png'} alt={p.name} className={`w-12 h-12 object-cover rounded-lg ${isLightTheme ? 'bg-zinc-100' : 'bg-zinc-800'}`} />
                  <div>
                    <p className={`text-sm font-bold ${isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}`}>{p.name}</p>
                    <span className={`text-[10px] px-2 py-1 rounded font-mono ${isLightTheme ? 'bg-zinc-100 text-zinc-500' : 'bg-zinc-800 text-zinc-400'}`}>{p.sku}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}`}>R$ {p.price.toFixed(2)}</p>
                  <p className={`text-[10px] ${isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}`}>{p.sold} vendidos</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`p-8 border rounded-xl shadow-sm ${isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-900 border-zinc-800'}`}>
          <h3 className={`font-bold text-lg mb-6 ${isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}`}>Status do Próximo Drop</h3>
          <div className="flex flex-col items-center justify-center py-8">
            <div className={`p-4 rounded-full mb-4 ${isDropLocked ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {isDropLocked ? <Lock size={32} /> : <Unlock size={32} />}
            </div>
            <p className={`text-sm font-semibold uppercase tracking-widest mb-2 ${isLightTheme ? 'text-zinc-400' : 'text-zinc-500'}`}>Modo Coming Soon</p>
            <h4 className={`text-2xl font-bold mb-6 ${isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}`}>{isDropLocked ? 'Site Travado' : 'Site Aberto'}</h4>
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
              className={`px-8 py-3 rounded-lg text-sm font-bold shadow-sm transition-all ${
                isDropLocked
                  ? isLightTheme
                    ? 'bg-zinc-900 text-white hover:bg-black'
                    : 'bg-zinc-100 text-zinc-900 hover:bg-white'
                  : isLightTheme
                    ? 'border-2 border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                    : 'border-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              {isDropLocked ? 'Liberar Acesso' : 'Travar Site'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-1 p-6 border rounded-xl flex items-center gap-4 shadow-sm ${isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-900 border-zinc-800'}`}>
          <div className={`p-3 rounded-lg ${isLightTheme ? 'bg-blue-50' : 'bg-blue-950/40'}`}><Eye size={24} className="text-blue-600" /></div>
          <div>
            <p className={`text-sm font-medium ${isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}`}>Total de Acessos</p>
            <h3 className={`text-3xl font-bold ${isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}`}>{visitsCount.toLocaleString('pt-BR')}</h3>
          </div>
        </div>

        <div className={`lg:col-span-2 p-6 border rounded-xl shadow-sm ${isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-900 border-zinc-800'}`}>
          <h3 className={`text-sm font-bold mb-4 uppercase tracking-wider ${isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}`}>Vendas por Categoria</h3>
          <div className="space-y-3">
            {categorySales.map((cat) => {
              const maxValue = Math.max(...categorySales.map((c) => c.value), 1);
              return (
                <div key={cat.name} className="flex items-center gap-4">
                  <div className={`w-24 text-xs font-bold truncate ${isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}`}>{cat.name}</div>
                  <div className={`flex-1 rounded-full h-3 overflow-hidden ${isLightTheme ? 'bg-zinc-100' : 'bg-zinc-800'}`}>
                    <div className={`h-full rounded-full transition-all duration-700 ${isLightTheme ? 'bg-zinc-900' : 'bg-zinc-200'}`} style={{ width: `${(cat.value / maxValue) * 100}%` }} />
                  </div>
                  <div className={`text-right text-xs font-bold w-20 ${isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}`}>
                    R$ {cat.value.toLocaleString('pt-BR')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className={`border rounded-xl shadow-sm overflow-hidden ${isLightTheme ? 'bg-white border-zinc-200' : 'bg-zinc-900 border-zinc-800'}`}>
        <div className={`p-6 border-b ${isLightTheme ? 'border-zinc-100 bg-zinc-50/50' : 'border-zinc-800 bg-zinc-950/30'}`}>
          <h3 className={`font-bold flex items-center gap-2 ${isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}`}><Clock size={18} /> Pedidos Recentes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className={`text-[10px] uppercase tracking-widest border-b ${isLightTheme ? 'text-zinc-400 border-zinc-100' : 'text-zinc-500 border-zinc-800'}`}>
                <th className="px-6 py-4 font-semibold">ID</th>
                <th className="px-6 py-4 font-semibold">Cliente</th>
                <th className="px-6 py-4 font-semibold">Total</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Data</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLightTheme ? 'divide-zinc-50' : 'divide-zinc-800/80'}`}>
              {recentOrders.map((order) => (
                <tr key={order.id} className={`transition-colors ${isLightTheme ? 'hover:bg-zinc-50' : 'hover:bg-zinc-800/40'}`}>
                  <td className={`px-6 py-4 font-mono font-bold ${isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}`}>#{order.id}</td>
                  <td className={`px-6 py-4 font-medium ${isLightTheme ? 'text-zinc-600' : 'text-zinc-300'}`}>{order.client || order.customer}</td>
                  <td className={`px-6 py-4 font-bold ${isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}`}>R$ {Number(order.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${isLightTheme ? 'bg-zinc-100 text-zinc-600' : 'bg-zinc-800 text-zinc-300'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-xs text-right ${isLightTheme ? 'text-zinc-400' : 'text-zinc-500'}`}>{new Date(order.date).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-10">
        <button
          onClick={onCreateCollection}
          className={`flex items-center justify-between p-6 rounded-xl transition-all group ${
            isLightTheme
              ? 'bg-zinc-900 text-white hover:bg-black'
              : 'bg-zinc-100 text-zinc-900 hover:bg-white'
          }`}
        >
          <div className="text-left">
            <h4 className="font-bold">Criar Coleção</h4>
            <p className={`text-xs ${isLightTheme ? 'text-zinc-400' : 'text-zinc-600'}`}>Preparar novo drop</p>
          </div>
          <TrendingUp className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        </button>

        <button
          className={`flex items-center justify-between p-6 border-2 rounded-xl transition-all group ${
            isLightTheme
              ? 'bg-white border-zinc-100 hover:border-zinc-900'
              : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'
          }`}
        >
          <div className="text-left">
            <h4 className={`font-bold ${isLightTheme ? 'text-zinc-900' : 'text-zinc-100'}`}>Disparar Campanha</h4>
            <p className={`text-xs ${isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}`}>Notificar via E-mail/WhatsApp</p>
          </div>
          <Zap size={20} className={isLightTheme ? 'text-zinc-900' : 'text-zinc-100'} />
        </button>
      </div>
    </div>
  );
}

