import React from 'react';
import { TrendingUp, Target, Zap } from 'lucide-react';

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
              {item.value}
            </div>
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase">{item.month}</span>
        </div>
      ))}
    </div>
  );
};

export default function Analytics() {
  const analyticsData = {
    monthlyRevenue: [
      { month: 'Jan', value: 32000 },
      { month: 'Fev', value: 28000 },
      { month: 'Mar', value: 45000 },
      { month: 'Abr', value: 38000 },
      { month: 'Mai', value: 52000 },
      { month: 'Jun', value: 61000 },
    ],
    categories: [
      { name: 'Camisetas', value: 45, color: '#000000' },
      { name: 'Moletons', value: 25, color: '#333333' },
      { name: 'Acessórios', value: 20, color: '#666666' },
      { name: 'Calças', value: 10, color: '#999999' },
    ],
    channels: [
      { name: 'Instagram', value: '55%', color: 'bg-black' },
      { name: 'Tráfego Pago', value: '30%', color: 'bg-zinc-600' },
      { name: 'Orgânico/Google', value: '15%', color: 'bg-zinc-300' },
    ]
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GRÁFICO RECEITA */}
        <div className="lg:col-span-2 bg-white p-8 border border-gray-100 rounded-lg">
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
          <CustomBarChart data={analyticsData.monthlyRevenue} />
        </div>

        {/* PIE CHART CATEGORIAS */}
        <div className="bg-white p-8 border border-gray-100 rounded-lg">
          <h3 className="text-lg font-bold mb-6">Vendas por Categoria</h3>
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative w-40 h-40 mb-6">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="16" fill="none" stroke="#f4f4f5" strokeWidth="3" />
                <circle cx="18" cy="18" r="16" fill="none" stroke="#000" strokeWidth="3" strokeDasharray="45 100" />
                <circle cx="18" cy="18" r="16" fill="none" stroke="#52525b" strokeWidth="3" strokeDasharray="25 100" strokeDashoffset="-45" />
                <circle cx="18" cy="18" r="16" fill="none" stroke="#a1a1aa" strokeWidth="3" strokeDasharray="20 100" strokeDashoffset="-70" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-xl font-black">100%</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase">Total</span>
              </div>
            </div>
            <div className="w-full space-y-2">
              {analyticsData.categories.map((cat, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></div>
                    <span className="text-gray-500 font-medium">{cat.name}</span>
                  </div>
                  <span className="font-bold">{cat.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 border border-gray-100 rounded-lg">
          <h4 className="font-bold mb-4 flex items-center gap-2">
            <TrendingUp size={16} /> Canais de Origem
          </h4>
          <div className="space-y-4">
            {analyticsData.channels.map((ch, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1 font-bold uppercase">
                  <span>{ch.name}</span>
                  <span>{ch.value}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${ch.color}`} style={{ width: ch.value }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 border border-gray-100 rounded-lg">
          <h4 className="font-bold mb-4 flex items-center gap-2">
            <Target size={16} /> Funil de Conversão
          </h4>
          <div className="space-y-3">
            {[
              { label: 'Visitantes', val: '12.4k', perc: '100%' },
              { label: 'Add Carrinho', val: '1.2k', perc: '9.6%' },
              { label: 'Checkouts', val: '450', perc: '3.6%' },
              { label: 'Compras', val: '128', perc: '1.0%' },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-12 text-[10px] font-bold text-gray-400">{step.perc}</div>
                <div className="flex-1 bg-zinc-50 border border-gray-100 p-2 rounded flex justify-between items-center">
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
