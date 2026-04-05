import React, { useState } from 'react';
import { Plus, Trash2, Edit, Percent, Clock } from 'lucide-react';
import Modal from '../Modal';
import AlertModal from '../AlertModal';

export default function Marketing() {
  const [coupons, setCoupons] = useState([
    { id: 1, code: 'BLACK20', discount: 20, type: 'Porcentagem', expiry: '2024-11-30', uses: 45 },
    { id: 2, code: 'FRETE10', discount: 10, type: 'Frete', expiry: '2024-12-25', uses: 12 },
    { id: 3, code: 'VIPONLY', discount: 30, type: 'Porcentagem', expiry: '2024-11-15', uses: 8 },
  ]);

  const [campaigns, setCampaigns] = useState([
    { id: 1, name: 'Black Friday 2024', status: 'Planejada', startDate: '2024-11-29', endDate: '2024-12-02', reach: 0 },
    { id: 2, name: 'Promoção Natal', status: 'Ativa', startDate: '2024-12-01', endDate: '2024-12-25', reach: 15420 },
    { id: 3, name: 'Carrinho Abandonado', status: 'Ativa', startDate: '2024-10-15', endDate: undefined, reach: 2840 },
  ]);

  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponData, setCouponData] = useState({
    code: '',
    discount: '',
    type: 'Porcentagem',
    expiry: '',
  });

  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, kind: 'coupon' });

  const handleAddCoupon = () => {
    if (couponData.code && couponData.discount) {
      setCoupons([...coupons, { ...couponData, id: Date.now(), uses: 0 }]);
      setCouponData({ code: '', discount: '', type: 'Porcentagem', expiry: '' });
      setShowCouponForm(false);
    }
  };

  const handleDeleteCoupon = (id) => {
    setConfirmDelete({ isOpen: true, id, kind: 'coupon' });
  };

  const handleDeleteCampaign = (id) => {
    setConfirmDelete({ isOpen: true, id, kind: 'campaign' });
  };

  const performConfirmDelete = () => {
    if (!confirmDelete.id) return;
    if (confirmDelete.kind === 'coupon') {
      setCoupons(coupons.filter(c => c.id !== confirmDelete.id));
    } else {
      setCampaigns(campaigns.filter(c => c.id !== confirmDelete.id));
    }
    setConfirmDelete({ isOpen: false, id: null, kind: 'coupon' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 p-6 border border-zinc-800 rounded-xl">
          <p className="text-zinc-500 text-sm font-medium">Cupons Ativos</p>
          <h3 className="text-3xl font-bold mt-2">{coupons.length}</h3>
        </div>
        <div className="bg-zinc-900 p-6 border border-zinc-800 rounded-xl">
          <p className="text-zinc-500 text-sm font-medium">Campanhas Ativas</p>
          <h3 className="text-3xl font-bold mt-2">{campaigns.filter(c => c.status === 'Ativa').length}</h3>
        </div>
        <div className="bg-zinc-900 p-6 border border-zinc-800 rounded-xl">
          <p className="text-zinc-500 text-sm font-medium">Alcance Total</p>
          <h3 className="text-3xl font-bold mt-2">{(campaigns.reduce((sum, c) => sum + c.reach, 0)).toLocaleString()}</h3>
        </div>
      </div>

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

        <Modal isOpen={showCouponForm} onClose={() => setShowCouponForm(false)} title="Criar Novo Cupom">
          <div className="p-2">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                value={couponData.code}
                onChange={(e) => setCouponData({ ...couponData, code: e.target.value.toUpperCase() })}
                placeholder="Código"
                maxLength="20"
                className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg outline-none focus:border-zinc-500 font-mono font-bold text-white placeholder-zinc-500"
              />
              <input
                type="number"
                value={couponData.discount}
                onChange={(e) => setCouponData({ ...couponData, discount: e.target.value })}
                placeholder="Desconto"
                className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg outline-none focus:border-zinc-500 text-white placeholder-zinc-500"
              />
              <select
                value={couponData.type}
                onChange={(e) => setCouponData({ ...couponData, type: e.target.value })}
                className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg outline-none focus:border-zinc-500 text-white"
              >
                <option>Porcentagem</option>
                <option>Valor Fixo</option>
                <option>Frete</option>
              </select>
              <input
                type="date"
                value={couponData.expiry}
                onChange={(e) => setCouponData({ ...couponData, expiry: e.target.value })}
                className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg outline-none focus:border-zinc-500 text-white"
              />
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleAddCoupon}
                className="flex-1 bg-emerald-600 text-white py-2 font-bold hover:bg-emerald-700 rounded-lg"
              >
                Criar Cupom
              </button>
              <button
                onClick={() => setShowCouponForm(false)}
                className="px-6 py-2 border border-zinc-700 text-zinc-400 font-bold hover:text-white hover:border-zinc-500 rounded-lg"
              >
                Cancelar
              </button>
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
                <td className="px-6 py-4 text-right space-x-2">
                  <button className="p-2 text-zinc-500 hover:text-white transition-colors">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDeleteCoupon(c.id)} className="p-2 text-zinc-500 hover:text-red-400 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CAMPANHAS */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-lg font-bold">Campanhas de Marketing</h2>
        </div>

        <table className="w-full">
          <thead>
            <tr className="bg-zinc-800/50 text-xs font-bold uppercase text-zinc-500 border-b border-zinc-800">
              <th className="px-6 py-4">Nome da Campanha</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Data Início</th>
              <th className="px-6 py-4">Data Fim</th>
              <th className="px-6 py-4">Alcance</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {campaigns.map((c) => (
              <tr key={c.id} className="hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4 font-bold text-sm">{c.name}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${c.status === 'Ativa' ? 'bg-emerald-950 text-emerald-400' : 'bg-yellow-950 text-yellow-400'}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">{new Date(c.startDate).toLocaleDateString('pt-BR')}</td>
                <td className="px-6 py-4 text-sm">{c.endDate ? new Date(c.endDate).toLocaleDateString('pt-BR') : 'Contínua'}</td>
                <td className="px-6 py-4 font-bold text-sm">{c.reach.toLocaleString()}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button className="p-2 text-zinc-500 hover:text-white transition-colors">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDeleteCampaign(c.id)} className="p-2 text-zinc-500 hover:text-red-400 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* confirm delete for coupons/campaigns */}
      <AlertModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, id: null, kind: 'coupon' })}
        title="Confirmar exclusão"
        message="Deseja realmente excluir este item?"
        type="warning"
        actionLabel="Excluir"
        actionCallback={performConfirmDelete}
      />
    </div>
  );
}
