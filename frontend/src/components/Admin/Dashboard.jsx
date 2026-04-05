import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Lock, Unlock, TrendingUp, Zap, Clock, Eye } from 'lucide-react';
import { api } from '../../services/api';
import { resolveImageUrl } from '../../utils/resolveImageUrl';
import { useToast } from '../../context/ToastContext';

const StatCard = ({ title, value, change, isPositive }) => (
  <div className="bg-zinc-900 p-6 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all duration-300">
    <p className="text-zinc-500 text-sm font-medium">{title}</p>
    <div className="flex items-end justify-between mt-3">
      <h3 className="text-3xl font-bold text-white">{value}</h3>
      <span className={`flex items-center gap-1 text-xs font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
        {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {change}
      </span>
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, topRes, ordersRes, settingsRes] = await Promise.all([
          api.get('/admin/dashboard/stats'),
          api.get('/admin/dashboard/top-products'),
          api.get('/admin/analytics/recent-orders').catch(() => ({ data: [] })),
          api.get('/admin/settings').catch(() => ({ data: {} })),
        ]);

        setRecentOrders(ordersRes.data || []);
        setIsDropLocked(settingsRes.data?.loja_ativa === false);

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

        setDashboardData(prev => ({
          ...prev,
          monthlyRevenue: Number(stats.monthlyRevenue || 0),
          orders: stats.ordersCount || stats.orders || 0,
          avgTicket: Number(stats.avgTicket || 0),
          conversionRate: stats.conversionRate || 0,
          revenueGrowth: stats.revenueGrowth || '0%',
          ordersGrowth: stats.ordersGrowth || '0%',
          avgTicketGrowth: stats.avgTicketGrowth || '0%',
          topProducts,
        }));

        try {
          await api.post('/admin/analytics/visits/hit', { path: '/admin/dashboard' });
        } catch (e) { /* ignore */ }

        try {
          const v = await api.get('/admin/analytics/visits');
          const total = (v.data || []).reduce((s, it) => s + (it.count || 0), 0);
          setVisitsCount(total);
        } catch (e) { /* ignore */ }

        try {
          const catRes = await api.get('/admin/analytics/category-sales');
          setCategorySales(catRes.data || []);
        } catch (e) { /* ignore */ }
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
        toast.error('Erro ao carregar dados do dashboard');
      }
    };
    fetchData();
  }, []);

  if (!dashboardData) {
    return <div className="text-center py-12">Carregando...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* CHARTS E STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PRODUTOS MAIS VENDIDOS */}
        <div className="bg-zinc-900 p-8 border border-zinc-800 rounded-xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-white">Produtos Mais Vendidos</h3>
            <button className="text-xs text-zinc-500 hover:text-white transition-colors">Ver tudo →</button>
          </div>
          <div className="space-y-4">
            {dashboardData.topProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between pb-4 border-b border-zinc-800 last:border-0">
                <div className="flex items-center gap-3">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-12 h-12 object-cover rounded-lg bg-zinc-800" />
                  ) : (
                    <div className="w-12 h-12 bg-zinc-800 rounded-lg"></div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-white">{p.name}</p>
                    <span className="text-[10px] bg-zinc-800 px-2 py-1 rounded font-mono text-zinc-500">
                      {p.sku}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">R$ {p.price.toFixed(2)}</p>
                  <p className="text-[10px] text-zinc-500">{p.sold} vendidos</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* STATUS DO DROP */}
        <div className="bg-zinc-900 p-8 border border-zinc-800 rounded-xl">
          <h3 className="font-bold text-lg mb-6 text-white">Status do Próximo Drop</h3>
          <div className="flex flex-col items-center justify-center py-8">
            <div className={`p-4 rounded-full mb-4 ${isDropLocked ? 'bg-red-950 text-red-400' : 'bg-emerald-950 text-emerald-400'}`}>
              {isDropLocked ? <Lock size={32} /> : <Unlock size={32} />}
            </div>
            <p className="text-sm font-medium text-zinc-500 uppercase tracking-widest mb-2">Modo Coming Soon</p>
            <h4 className="text-2xl font-bold mb-6 text-white">{isDropLocked ? 'Site Travado' : 'Site Aberto'}</h4>
            <button
              onClick={async () => {
                try {
                  const res = await api.patch('/admin/settings/toggle-store', { loja_ativa: isDropLocked });
                  setIsDropLocked(!res.data.loja_ativa);
                } catch (err) {
                  console.error('Erro ao alternar status:', err);
                  toast.error('Erro ao alternar status da loja');
                }
              }}
              className={`px-8 py-3 rounded-lg text-sm font-bold transition-all ${isDropLocked
                ? 'bg-white text-black hover:bg-zinc-200'
                : 'border-2 border-zinc-600 text-zinc-300 hover:bg-zinc-800'
                }`}
            >
              {isDropLocked ? '🔓 Liberar Acesso' : '🔒 Travar Site'}
            </button>
          </div>
        </div>
      </div>

      {/* CONTADOR DE ACESSOS */}
      <div className="bg-zinc-900 p-6 border border-zinc-800 rounded-xl flex items-center gap-4">
        <div className="p-3 bg-blue-950 rounded-lg">
          <Eye size={24} className="text-blue-400" />
        </div>
        <div>
          <p className="text-zinc-500 text-sm font-medium">Total de Acessos</p>
          <h3 className="text-3xl font-bold text-white">{visitsCount.toLocaleString('pt-BR')}</h3>
          <p className="text-xs text-zinc-500 mt-1">acessos registrados no site</p>
        </div>
      </div>

      {/* VENDAS POR CATEGORIA */}
      {categorySales.length > 0 && (
        <div className="bg-zinc-900 p-8 border border-zinc-800 rounded-xl">
          <h3 className="text-lg font-bold mb-6 text-white">Vendas por Categoria</h3>
          <div className="space-y-4">
            {categorySales.map((cat) => {
              const maxValue = Math.max(...categorySales.map(c => c.value), 1);
              return (
                <div key={cat.name} className="flex items-center gap-4">
                  <div className="w-28 text-sm font-medium text-zinc-300 truncate">{cat.name}</div>
                  <div className="flex-1 bg-zinc-800 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-white h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max((cat.value / maxValue) * 100, 2)}%` }}
                    />
                  </div>
                  <div className="text-right min-w-[120px]">
                    <span className="text-sm font-bold text-white">R$ {Number(cat.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span className="text-xs text-zinc-500 ml-2">({cat.items} itens)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PEDIDOS RECENTES */}
      <div className="bg-zinc-900 p-8 border border-zinc-800 rounded-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg flex items-center gap-2 text-white"><Clock size={18} /> Pedidos Recentes</h3>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-8">Nenhum pedido encontrado</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500 uppercase">
                  <th className="pb-3 font-medium">Pedido</th>
                  <th className="pb-3 font-medium">Cliente</th>
                  <th className="pb-3 font-medium">Itens</th>
                  <th className="pb-3 font-medium">Total</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => {
                  const statusColors = {
                    pendente: 'bg-yellow-950 text-yellow-400',
                    confirmado: 'bg-blue-950 text-blue-400',
                    em_separacao: 'bg-purple-950 text-purple-400',
                    enviado: 'bg-indigo-950 text-indigo-400',
                    finalizado: 'bg-emerald-950 text-emerald-400',
                    cancelado: 'bg-red-950 text-red-400',
                  };
                  return (
                    <tr key={order.id} className="border-b border-zinc-800/50 last:border-0">
                      <td className="py-3 font-mono font-bold text-white">#{order.id}</td>
                      <td className="py-3 text-zinc-300">{order.client || order.customer}</td>
                      <td className="py-3 text-center text-zinc-400">{order.itemCount}</td>
                      <td className="py-3 font-bold text-white">R$ {Number(order.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusColors[order.status] || 'bg-zinc-800 text-zinc-400'}`}>
                          {order.status?.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 text-zinc-500 text-xs">{new Date(order.date).toLocaleDateString('pt-BR')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div onClick={() => onCreateCollection && onCreateCollection()} className="bg-white text-black p-6 rounded-xl hover:bg-zinc-200 transition-all duration-300 cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-black/10 rounded-lg">
              <TrendingUp size={24} />
            </div>
          </div>
          <h4 className="font-bold mb-2">Criar uma Coleção</h4>
          <p className="text-xs text-zinc-500">Abra a criação de coleção</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl hover:border-zinc-700 transition-all duration-300 cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-zinc-800 rounded-lg">
              <Zap size={24} className="text-zinc-300" />
            </div>
          </div>
          <h4 className="font-bold mb-2 text-white">Ativar Drop</h4>
          <p className="text-xs text-zinc-500">Configure e lance uma nova coleção</p>
        </div>
      </div>
    </div>
  );
}
