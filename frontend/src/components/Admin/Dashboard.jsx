import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Lock, Unlock, TrendingUp, Target, Zap } from 'lucide-react';
import { api } from '../../services/api';
import { resolveImageUrl } from '../../utils/resolveImageUrl';

const StatCard = ({ title, value, change, isPositive }) => (
  <div className="bg-white p-6 border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-shadow">
    <p className="text-gray-500 text-sm font-medium">{title}</p>
    <div className="flex items-end justify-between mt-3">
      <h3 className="text-3xl font-bold">{value}</h3>
      <span className={`flex items-center gap-1 text-xs font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {change}
      </span>
    </div>
  </div>
);

const CustomBarChart = ({ data }) => {
  const maxVal = Math.max(...data.map(d => d.value));
  return (
    <div className="flex items-end justify-between h-48 gap-2 pt-4">
      {data.map((item, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
          <div
            className="w-full bg-zinc-100 group-hover:bg-black transition-all duration-300 rounded-t-sm relative"
            style={{ height: `${(item.value / maxVal) * 100}%` }}
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold z-10">
              R$ {item.value.toLocaleString()}
            </div>
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase">{item.month}</span>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard({ onCreateCollection }) {
  const [isDropLocked, setIsDropLocked] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [visitsCount, setVisitsCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, revenueRes, topRes] = await Promise.all([
          api.get('/admin/dashboard/stats'),
          api.get('/admin/dashboard/revenue'),
          api.get('/admin/dashboard/top-products'),
        ]);

        const stats = statsRes.data || {};
        const monthlyData = Array.isArray(revenueRes.data) ? revenueRes.data : [];

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
          topProducts,
          monthlyData,
        });

        // Register a visit to the admin dashboard (public endpoint)
        try {
          await api.post('/admin/analytics/visits/hit', { path: '/admin/dashboard' });
        } catch (e) {
          // ignore
        }

        // Try to fetch visit counts (requires auth); ignore errors if unauthenticated
        try {
          const v = await api.get('/admin/analytics/visits');
          const total = (v.data || []).reduce((s, it) => s + (it.count || 0), 0);
          setVisitsCount(total);
        } catch (e) {
          // ignore
        }
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
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
          change="12.5%"
          isPositive={true}
        />
        <StatCard title="Pedidos" value={dashboardData.orders} change="8.2%" isPositive={true} />
        <StatCard
          title="Ticket Médio"
          value={`R$ ${dashboardData.avgTicket.toLocaleString('pt-BR')}`}
          change="2.1%"
          isPositive={false}
        />
        <StatCard title="Taxa de Conversão" value={`${dashboardData.conversionRate}%`} change="0.5%" isPositive={true} />
      </div>

      {/* CHARTS E STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PRODUTOS MAIS VENDIDOS */}
        <div className="bg-white p-8 border border-gray-100 rounded-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg">Produtos Mais Vendidos</h3>
            <button className="text-xs text-gray-400 hover:text-black transition-colors">Ver tudo →</button>
          </div>
          <div className="space-y-4">
            {dashboardData.topProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between pb-4 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg"></div>
                  <div>
                    <p className="text-sm font-bold">{p.name}</p>
                    <span className="text-[10px] bg-gray-100 px-2 py-1 rounded font-mono text-gray-500">
                      {p.sku}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">R$ {p.price.toFixed(2)}</p>
                  <p className="text-[10px] text-gray-400">{p.sold} vendidos</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* STATUS DO DROP */}
        <div className="bg-white p-8 border border-gray-100 rounded-lg">
          <h3 className="font-bold text-lg mb-6">Status do Próximo Drop</h3>
          <div className="flex flex-col items-center justify-center py-8">
            <div className={`p-4 rounded-full mb-4 ${isDropLocked ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
              {isDropLocked ? <Lock size={32} /> : <Unlock size={32} />}
            </div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-widest mb-2">Modo Coming Soon</p>
            <h4 className="text-2xl font-bold mb-6">{isDropLocked ? 'Site Travado' : 'Site Aberto'}</h4>
            <button
              onClick={() => setIsDropLocked(!isDropLocked)}
              className={`px-8 py-3 rounded-lg text-sm font-bold transition-all ${isDropLocked
                ? 'bg-black text-white hover:bg-zinc-800'
                : 'border-2 border-black hover:bg-gray-50'
                }`}
            >
              {isDropLocked ? '🔓 Liberar Acesso' : '🔒 Travar Site'}
            </button>
          </div>
        </div>
      </div>

      {/* GRÁFICO DE VENDAS */}
      <div className="bg-white p-8 border border-gray-100 rounded-lg">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-lg font-bold">Desempenho de Vendas</h3>
            <p className="text-sm text-gray-400">Comparativo de faturamento mensal</p>
          </div>
          <div className="flex gap-2">
            <button className="text-[10px] font-bold border border-gray-200 px-3 py-1 rounded hover:bg-gray-50">6 MESES</button>
            <button className="text-[10px] font-bold bg-black text-white px-3 py-1 rounded">12 MESES</button>
          </div>
        </div>
        <CustomBarChart data={dashboardData.monthlyData} />
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div onClick={() => onCreateCollection && onCreateCollection()} className="bg-black text-white p-6 rounded-lg hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-white/10 rounded-lg">
              <TrendingUp size={24} />
            </div>
          </div>
          <h4 className="font-bold mb-2">Criar uma Coleção</h4>
          <p className="text-xs text-gray-300">Abra a criação de coleção</p>
        </div>

        <div className="bg-white border border-gray-100 p-6 rounded-lg hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Zap size={24} />
            </div>
          </div>
          <h4 className="font-bold mb-2">Ativar Drop</h4>
          <p className="text-xs text-gray-400">Configure e lance uma nova coleção</p>
        </div>
      </div>
    </div>
  );
}
