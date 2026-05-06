import React, { useState, useEffect } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  Lock,
  Unlock,
  TrendingUp,
  Zap,
  Clock,
  Eye,
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
  <div className="admin-kpi-card h-full transition-all duration-300">
    <div className="flex items-start justify-between gap-3">
      <p className="admin-kpi-label pr-2">{title}</p>
      {change ? (
        <span className={`admin-badge ${isPositive ? 'admin-badge-success' : 'admin-badge-danger'}`}>
          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {change}
        </span>
      ) : (
        <span className="admin-badge admin-badge-neutral">Atual</span>
      )}
    </div>
    <div className="mt-5 space-y-2">
      <h3 className="admin-kpi-value break-words">{value}</h3>
      <p className="admin-kpi-meta">
        {change ? 'Comparado ao periodo anterior' : 'Acompanhamento em tempo real'}
      </p>
    </div>
  </div>
);

const getOrderStatusClass = (status) => {
  const normalizedStatus = String(status || '').toLowerCase();

  if (normalizedStatus.includes('cancel')) return 'admin-badge-danger';
  if (normalizedStatus.includes('pend')) return 'admin-badge-warning';
  if (
    normalizedStatus.includes('paid') ||
    normalizedStatus.includes('pago') ||
    normalizedStatus.includes('aprov')
  ) {
    return 'admin-badge-success';
  }

  return 'admin-badge-neutral';
};

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
    let hitSent = false;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Analytics hit — fire-and-forget, garante uma única vez por montagem real
        if (!hitSent) {
          hitSent = true;
          api.post('/admin/analytics/visits/hit', { path: '/admin/dashboard' }).catch(() => {});
        }

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
            image: prod.fotos && prod.fotos[0] ? resolveImageUrl(prod.fotos[0].url) : '',
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
          const status = err.response?.status;
          if (status === 429) {
            toast.error('Muitas requisicoes. Aguarde um momento e recarregue.');
          } else {
            console.error('Erro ao carregar dashboard:', err);
            toast.error('Erro ao carregar dados do dashboard');
          }
          setDashboardData(EMPTY_DASHBOARD_DATA);
          setRecentOrders([]);
          setCategorySales([]);
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
        <div className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
        <p className="text-zinc-500 font-medium animate-pulse">Sincronizando dados...</p>
      </div>
    );
  }

  const maxCategoryValue = Math.max(...categorySales.map((item) => Number(item.value || 0)), 1);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Faturamento (Mes)"
          value={`R$ ${dashboardData.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          change={dashboardData.revenueGrowth}
          isPositive={!dashboardData.revenueGrowth.startsWith('-')}
        />
        <StatCard
          title="Pedidos"
          value={dashboardData.orders}
          change={dashboardData.ordersGrowth}
          isPositive={!dashboardData.ordersGrowth.startsWith('-')}
        />
        <StatCard
          title="Ticket Medio"
          value={`R$ ${dashboardData.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          change={dashboardData.avgTicketGrowth}
          isPositive={!dashboardData.avgTicketGrowth.startsWith('-')}
        />
        <StatCard
          title="Taxa de Conversao"
          value={`${dashboardData.conversionRate}%`}
          change=""
          isPositive
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="admin-panel p-5 sm:p-8">
          <div className="flex justify-between items-start gap-3 mb-6">
            <div className="space-y-2">
              <p className="admin-section-kicker">Performance</p>
              <h3 className="admin-section-title">Produtos Mais Vendidos</h3>
            </div>
            <button className="admin-btn-ghost shrink-0">Ver tudo</button>
          </div>

          {dashboardData.topProducts.length ? (
            <div className="space-y-3">
              {dashboardData.topProducts.map((product, index) => (
                <div key={product.id} className="admin-panel-muted flex items-center justify-between gap-4 px-4 py-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <img
                      src={product.image || '/placeholder-prod.png'}
                      alt={product.name}
                      className="w-14 h-14 object-cover rounded-xl"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="admin-badge admin-badge-neutral">#{index + 1}</span>
                        {product.sku ? <span className="admin-badge admin-badge-neutral font-mono">{product.sku}</span> : null}
                      </div>
                      <p className="mt-3 text-sm sm:text-base font-semibold truncate" style={{ color: 'var(--app-text)' }}>
                        {product.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm sm:text-base font-bold" style={{ color: 'var(--app-text)' }}>
                      R$ {product.price.toFixed(2)}
                    </p>
                    <p className="admin-kpi-meta mt-1">{product.sold} vendidos</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="admin-empty-state admin-panel-muted">Nenhum produto disponivel para ranking.</div>
          )}
        </div>

        <div className="admin-panel p-5 sm:p-8">
          <div className="space-y-2 mb-6">
            <p className="admin-section-kicker">Operacao</p>
            <h3 className="admin-section-title">Status do Proximo Drop</h3>
          </div>
          <div className="admin-panel-muted flex flex-col items-center justify-center py-8 px-5 sm:px-8 text-center">
            <div className={`admin-badge mb-4 ${isDropLocked ? 'admin-badge-danger' : 'admin-badge-success'}`}>
              {isDropLocked ? <Lock size={32} /> : <Unlock size={32} />}
            </div>
            <p className="admin-section-kicker mb-2">Modo Coming Soon</p>
            <h4 className="text-xl sm:text-3xl font-bold tracking-tight mb-3" style={{ color: 'var(--app-text)' }}>
              {isDropLocked ? 'Site Travado' : 'Site Aberto'}
            </h4>
            <p className="admin-kpi-meta max-w-sm mb-6">
              {isDropLocked ? 'O acesso esta restrito enquanto o proximo drop esta em preparacao.' : 'A loja esta disponivel para compras e navegacao.'}
            </p>
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
              className={`w-full sm:w-auto ${isDropLocked ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            >
              {isDropLocked ? 'Liberar acesso' : 'Travar site'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 admin-kpi-card flex items-center gap-4 sm:gap-5">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: 'var(--app-info-soft)', color: 'var(--app-info)' }}
          >
            <Eye size={24} />
          </div>
          <div className="min-w-0">
            <p className="admin-kpi-label">Total de Acessos</p>
            <h3 className="admin-kpi-value">{visitsCount.toLocaleString('pt-BR')}</h3>
            <p className="admin-kpi-meta mt-2">Visitas acumuladas no painel administrativo</p>
          </div>
        </div>

        <div className="lg:col-span-2 admin-panel p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div className="space-y-2">
              <p className="admin-section-kicker">Categorias</p>
              <h3 className="admin-section-title">Vendas por Categoria</h3>
            </div>
            <span className="admin-badge admin-badge-info">Distribuicao</span>
          </div>
          <div className="space-y-4">
            {categorySales.map((cat) => {
              const value = Number(cat.value || 0);
              return (
                <div key={cat.name} className="grid grid-cols-[minmax(0,96px)_1fr_auto] items-center gap-3 sm:gap-4">
                  <div className="text-[11px] sm:text-xs font-semibold truncate" style={{ color: 'var(--app-text-secondary)' }}>
                    {cat.name}
                  </div>
                  <div
                    className="rounded-full h-3 overflow-hidden"
                    style={{ background: 'color-mix(in srgb, var(--app-surface-alt) 90%, transparent)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(value / maxCategoryValue) * 100}%`,
                        background: 'var(--app-primary-bg)',
                      }}
                    />
                  </div>
                  <div className="text-right text-[11px] sm:text-xs font-bold w-16 sm:w-20" style={{ color: 'var(--app-text)' }}>
                    R$ {value.toLocaleString('pt-BR')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="admin-panel admin-table-shell overflow-hidden">
        <div
          className="p-4 sm:p-6 border-b"
          style={{
            borderColor: 'var(--app-border)',
            background: 'color-mix(in srgb, var(--app-surface-alt) 74%, transparent)',
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <p className="admin-section-kicker">Atividade recente</p>
              <h3 className="admin-section-title flex items-center gap-2">
                <Clock size={18} />
                Pedidos Recentes
              </h3>
            </div>
            <span className="admin-badge admin-badge-neutral">{recentOrders.length} itens</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm text-left">
            <thead>
              <tr className="admin-table-header" style={{ borderBottom: '1px solid var(--app-border)' }}>
                <th className="admin-table-head-cell px-6 py-4">ID</th>
                <th className="admin-table-head-cell px-6 py-4">Cliente</th>
                <th className="admin-table-head-cell px-6 py-4">Total</th>
                <th className="admin-table-head-cell px-6 py-4">Status</th>
                <th className="admin-table-head-cell px-6 py-4 text-right">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--app-border)' }}>
              {recentOrders.map((order) => (
                <tr key={order.id} className="admin-table-row">
                  <td className="px-6 py-4 font-mono font-bold" style={{ color: 'var(--app-text)' }}>
                    #{order.id}
                  </td>
                  <td className="px-6 py-4 font-medium" style={{ color: 'var(--app-text-secondary)' }}>
                    {order.client || order.customer}
                  </td>
                  <td className="px-6 py-4 font-bold" style={{ color: 'var(--app-text)' }}>
                    R$ {Number(order.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`admin-badge ${getOrderStatusClass(order.status)}`}>{order.status}</span>
                  </td>
                  <td className="px-6 py-4 text-xs text-right" style={{ color: 'var(--app-muted-text)' }}>
                    {new Date(order.date).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-10">
        <button
          onClick={onCreateCollection}
          className="admin-kpi-card flex items-center justify-between gap-4 text-left group transition-all duration-200"
        >
          <div className="space-y-2">
            <p className="admin-section-kicker">Acao rapida</p>
            <h4 className="text-lg font-bold tracking-tight" style={{ color: 'var(--app-text)' }}>
              Criar Colecao
            </h4>
            <p className="admin-kpi-meta">Prepare o proximo drop com a mesma linguagem visual do painel.</p>
          </div>
          <TrendingUp className="shrink-0 transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1" />
        </button>

        <button className="admin-panel-muted flex items-center justify-between gap-4 p-5 sm:p-6 text-left group transition-all duration-200">
          <div className="space-y-2">
            <p className="admin-section-kicker">Marketing</p>
            <h4 className="text-lg font-bold tracking-tight" style={{ color: 'var(--app-text)' }}>
              Disparar Campanha
            </h4>
            <p className="admin-kpi-meta">Notifique sua base por email ou WhatsApp sem sair do fluxo administrativo.</p>
          </div>
          <Zap size={20} className="shrink-0" style={{ color: 'var(--app-text)' }} />
        </button>
      </div>
    </div>
  );
}
