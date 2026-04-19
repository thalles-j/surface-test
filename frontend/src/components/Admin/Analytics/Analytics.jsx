import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, Zap } from 'lucide-react';
import { api } from '../../../services/api';

const CustomBarChart = ({ data }) => {
  if (!Array.isArray(data) || data.length === 0) return <div className="text-center py-8 text-sm text-zinc-500">Sem dados suficientes</div>;
  const maxVal = Math.max(...data.map(d => Number(d.value || 0)));
  return (
    <div className="flex items-end justify-between h-48 gap-2 pt-4">
      {data.map((item, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
          <div
            className="w-full bg-zinc-700 group-hover:bg-white transition-all duration-300 rounded-t-sm relative"
            style={{ height: `${(item.value / maxVal) * 100}%` }}
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold z-10">
              {item.value}
            </div>
          </div>
          <span className="text-[10px] font-bold text-zinc-500 uppercase">{item.month}</span>
        </div>
      ))}
    </div>
  );
};

export default function Analytics() {
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [channels, setChannels] = useState([]);
  const [funnel, setFunnel] = useState(null);
  const [overview, setOverview] = useState(null);
  const [categorySales, setCategorySales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revenuePeriod, setRevenuePeriod] = useState(12);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [revRes, chanRes, funnelRes, overviewRes, catRes] = await Promise.all([
          api.get(`/admin/dashboard/revenue?months=${revenuePeriod}`),
          api.get('/admin/analytics/channels'),
          api.get('/admin/analytics/conversion-funnel'),
          api.get('/admin/analytics/overview'),
          api.get('/admin/analytics/category-sales'),
        ]);
        if (!mounted) return;
        setMonthlyRevenue(revRes.data || []);
        setChannels(chanRes.data || []);
        setFunnel(funnelRes.data || null);
        setOverview(overviewRes.data || null);
        setCategorySales(catRes.data || []);
      } catch (err) {
        console.error('Erro ao carregar analytics:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [revenuePeriod]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GRÁFICO RECEITA */}
        <div className="lg:col-span-2 bg-zinc-900 p-8 border border-zinc-800 rounded-xl">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-lg font-bold">Desempenho de Vendas</h3>
              <p className="text-sm text-zinc-500">Comparativo de faturamento mensal</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setRevenuePeriod(6)} className={`text-[10px] font-bold border px-3 py-1 rounded ${revenuePeriod === 6 ? 'bg-white text-black border-white' : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}>6 MESES</button>
              <button onClick={() => setRevenuePeriod(12)} className={`text-[10px] font-bold border px-3 py-1 rounded ${revenuePeriod === 12 ? 'bg-white text-black border-white' : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}>12 MESES</button>
            </div>
          </div>
          {loading ? <div className="text-center py-12">Carregando...</div> : <CustomBarChart data={monthlyRevenue} />}
        </div>

        {/* PIE CHART CATEGORIAS (dados reais) */}
        <div className="bg-zinc-900 p-8 border border-zinc-800 rounded-xl">
          <h3 className="text-lg font-bold mb-6">Vendas por Categoria</h3>
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative w-40 h-40 mb-6">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="16" fill="none" stroke="var(--app-border)" strokeWidth="3" />
                {(() => {
                  const total = categorySales.reduce((s, c) => s + c.value, 0);
                  const colors = ['var(--app-text)', 'var(--app-muted-text)', '#71717a', '#52525b', '#3f3f46'];
                  let offset = 0;
                  return categorySales.map((cat, i) => {
                    const pct = total > 0 ? (cat.value / total) * 100 : 0;
                    const el = <circle key={i} cx="18" cy="18" r="16" fill="none" stroke={colors[i % colors.length]} strokeWidth="3" strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={`-${offset}`} />;
                    offset += pct;
                    return el;
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-xl font-black">{overview ? overview.totalCustomers || '—' : '—'}</span>
                <span className="text-[10px] text-zinc-500 font-bold uppercase">Clientes</span>
              </div>
            </div>
            <div className="w-full space-y-2">
              {(() => {
                const total = categorySales.reduce((s, c) => s + c.value, 0);
                const colors = ['var(--app-text)', 'var(--app-muted-text)', '#71717a', '#52525b', '#3f3f46'];
                const cats = categorySales.length > 0 ? categorySales : [{ name: 'Sem dados', value: 0 }];
                return cats.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[i % colors.length] }}></div>
                      <span className="text-zinc-400 font-medium">{cat.name}</span>
                    </div>
                    <span className="font-bold">{total > 0 ? `${((cat.value / total) * 100).toFixed(0)}%` : '—'}</span>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-zinc-900 p-6 border border-zinc-800 rounded-xl">
          <h4 className="font-bold mb-4 flex items-center gap-2">
            <TrendingUp size={16} /> Canais de Origem
          </h4>
          <div className="space-y-4">
            {(channels && channels.length > 0 ? channels : [{ name: 'Instagram', value: '55%', color: 'bg-white' }, { name: 'Tráfego Pago', value: '30%', color: 'bg-zinc-400' }, { name: 'Orgânico/Google', value: '15%', color: 'bg-zinc-600' }]).map((ch, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1 font-bold uppercase">
                  <span>{ch.name}</span>
                  <span>{ch.value}</span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`${ch.color}`} style={{ width: typeof ch.value === 'string' ? ch.value : `${ch.value}%`, height: '100%' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 p-6 border border-zinc-800 rounded-xl">
          <h4 className="font-bold mb-4 flex items-center gap-2">
            <Target size={16} /> Funil de Conversão
          </h4>
          <div className="space-y-3">
            { (funnel ? [
              { label: 'Visitantes', val: funnel.visits || '—', perc: '100%' },
              { label: 'Add Carrinho', val: funnel.addedToCart || '—', perc: funnel.addedToCart ? `${((funnel.addedToCart / funnel.visits) * 100).toFixed(1)}%` : '—' },
              { label: 'Checkouts', val: funnel.checkouts || '—', perc: funnel.checkouts ? `${((funnel.checkouts / funnel.visits) * 100).toFixed(1)}%` : '—' },
              { label: 'Compras', val: funnel.purchases || '—', perc: funnel.purchases ? `${((funnel.purchases / funnel.visits) * 100).toFixed(1)}%` : '—' },
            ] : [
              { label: 'Visitantes', val: '12.4k', perc: '100%' },
              { label: 'Add Carrinho', val: '1.2k', perc: '9.6%' },
              { label: 'Checkouts', val: '450', perc: '3.6%' },
              { label: 'Compras', val: '128', perc: '1.0%' },
            ]).map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-12 text-[10px] font-bold text-zinc-500">{step.perc}</div>
                <div className="flex-1 bg-zinc-800 border border-zinc-700 p-2 rounded flex justify-between items-center">
                  <span className="text-xs font-medium">{step.label}</span>
                  <span className="text-xs font-black">{step.val}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-black text-white p-6 rounded-lg relative overflow-hidden">
          <Zap className="absolute -right-4 -top-4 w-24 h-24 text-zinc-800" />
          <h4 className="font-bold mb-4 relative z-10">Insights de IA</h4>
          <div className="space-y-4 relative z-10">
            <p className="text-xs text-gray-400 leading-relaxed">
              O <span className="text-white font-bold">Drop 01</span> teve uma taxa de conversão 15% maior que a média. Recomendamos focar em <span className="text-white font-bold">Instagram</span> entre 19h-21h.
            </p>
            <div className="pt-4 border-t border-zinc-800">
              <div className="text-[10px] font-bold uppercase text-zinc-500 mb-1">Sugestão</div>
              <div className="text-xs font-bold font-mono bg-zinc-900 px-1 rounded">SRF-CAM-LOG-01-M</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
