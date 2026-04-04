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
        <div className="bg-white p-6 border border-gray-100 rounded-lg">
          <p className="text-gray-500 text-sm font-medium">Cupons Ativos</p>
          <h3 className="text-3xl font-bold mt-2">{coupons.length}</h3>
        </div>
        <div className="bg-white p-6 border border-gray-100 rounded-lg">
          <p className="text-gray-500 text-sm font-medium">Campanhas Ativas</p>
          <h3 className="text-3xl font-bold mt-2">{campaigns.filter(c => c.status === 'Ativa').length}</h3>
        </div>
        <div className="bg-white p-6 border border-gray-100 rounded-lg">
          <p className="text-gray-500 text-sm font-medium">Alcance Total</p>
          <h3 className="text-3xl font-bold mt-2">{(campaigns.reduce((sum, c) => sum + c.reach, 0)).toLocaleString()}</h3>
        </div>
      </div>

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
                className="p-2 border border-gray-300 rounded-lg outline-none focus:border-black font-mono font-bold"
              />
              <input
                type="number"
                value={couponData.discount}
                onChange={(e) => setCouponData({ ...couponData, discount: e.target.value })}
                placeholder="Desconto"
                className="p-2 border border-gray-300 rounded-lg outline-none focus:border-black"
              />
              <select
                value={couponData.type}
                onChange={(e) => setCouponData({ ...couponData, type: e.target.value })}
                className="p-2 border border-gray-300 rounded-lg outline-none focus:border-black bg-white"
              >
                <option>Porcentagem</option>
                <option>Valor Fixo</option>
                <option>Frete</option>
              </select>
              <input
                type="date"
                value={couponData.expiry}
                onChange={(e) => setCouponData({ ...couponData, expiry: e.target.value })}
                className="p-2 border border-gray-300 rounded-lg outline-none focus:border-black"
              />
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleAddCoupon}
                className="flex-1 bg-green-600 text-white py-2 font-bold hover:bg-green-700 rounded-lg"
              >
                Criar Cupom
              </button>
              <button
                onClick={() => setShowCouponForm(false)}
                className="px-6 py-2 border border-gray-300 font-bold hover:bg-gray-50 rounded-lg"
              >
                Cancelar
              </button>
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
                <td className="px-6 py-4 text-right space-x-2">
                  <button className="p-2 text-gray-400 hover:text-black transition-colors">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDeleteCoupon(c.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CAMPANHAS */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold">Campanhas de Marketing</h2>
        </div>

        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-gray-100">
              <th className="px-6 py-4">Nome da Campanha</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Data Início</th>
              <th className="px-6 py-4">Data Fim</th>
              <th className="px-6 py-4">Alcance</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {campaigns.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-bold text-sm">{c.name}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${c.status === 'Ativa' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">{new Date(c.startDate).toLocaleDateString('pt-BR')}</td>
                <td className="px-6 py-4 text-sm">{c.endDate ? new Date(c.endDate).toLocaleDateString('pt-BR') : 'Contínua'}</td>
                <td className="px-6 py-4 font-bold text-sm">{c.reach.toLocaleString()}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button className="p-2 text-gray-400 hover:text-black transition-colors">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDeleteCampaign(c.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
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
