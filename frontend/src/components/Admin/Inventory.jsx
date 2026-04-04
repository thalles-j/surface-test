import React, { useState } from 'react';
import { AlertCircle, TrendingDown, Plus, Edit } from 'lucide-react';
import Modal from '../Modal';

export default function Inventory() {
  const [inventory, setInventory] = useState([
    { id: 1, name: 'Camiseta Boxy Logo', sku: 'SRF-CAM-LOG-01', stock: 45, minStock: 10, status: 'Em estoque' },
    { id: 2, name: 'Moletom Oversized Void', sku: 'SRF-MOL-VOI-10', stock: 5, minStock: 10, status: 'Baixo' },
    { id: 3, name: 'Calça Cargo Tech', sku: 'SRF-CAL-TEC-05', stock: 0, minStock: 10, status: 'Esgotado' },
    { id: 4, name: 'Jaqueta Bomber', sku: 'SRF-JAC-BOM-01', stock: 25, minStock: 5, status: 'Em estoque' },
  ]);

  const lowStockItems = inventory.filter(i => i.stock <= i.minStock);
  const totalValue = inventory.reduce((sum, i) => sum + i.stock, 0);

  const getStatusColor = (status) => {
    switch(status) {
      case 'Em estoque':
        return 'bg-green-100 text-green-700';
      case 'Baixo':
        return 'bg-yellow-100 text-yellow-700';
      case 'Esgotado':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleUpdateStock = (id, newStock) => {
    setInventory(inventory.map(i => i.id === id ? { ...i, stock: newStock, status: newStock === 0 ? 'Esgotado' : newStock <= i.minStock ? 'Baixo' : 'Em estoque' } : i));
  };

  const [stockModal, setStockModal] = useState({ isOpen: false, item: null, newStock: 0 });

  const openStockModal = (item) => setStockModal({ isOpen: true, item, newStock: item.stock });
  const closeStockModal = () => setStockModal({ isOpen: false, item: null, newStock: 0 });
  const saveStockModal = () => {
    if (stockModal.item) handleUpdateStock(stockModal.item.id, Number(stockModal.newStock));
    closeStockModal();
  };

  return (
    <>
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 border border-gray-100 rounded-lg">
          <p className="text-gray-500 text-sm font-medium">Total em Estoque</p>
          <h3 className="text-3xl font-bold mt-2">{totalValue}</h3>
          <p className="text-xs text-gray-400 mt-1">unidades</p>
        </div>
        <div className="bg-white p-6 border border-gray-100 rounded-lg">
          <p className="text-gray-500 text-sm font-medium">Produtos com Estoque Baixo</p>
          <h3 className="text-3xl font-bold mt-2 text-yellow-600">{lowStockItems.length}</h3>
          <p className="text-xs text-gray-400 mt-1">itens</p>
        </div>
        <div className="bg-white p-6 border border-gray-100 rounded-lg">
          <p className="text-gray-500 text-sm font-medium">Produtos Esgotados</p>
          <h3 className="text-3xl font-bold mt-2 text-red-600">{inventory.filter(i => i.status === 'Esgotado').length}</h3>
          <p className="text-xs text-gray-400 mt-1">itens</p>
        </div>
      </div>

      {/* ALERTAS */}
      {lowStockItems.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="text-yellow-600 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-bold text-yellow-900 mb-2">Atenção: Estoque Baixo</h3>
              <p className="text-sm text-yellow-700">Os seguintes produtos estão com estoque abaixo do mínimo:</p>
              <ul className="mt-3 space-y-1">
                {lowStockItems.map(item => (
                  <li key={item.id} className="text-sm text-yellow-700">
                    <span className="font-bold">{item.name}</span> ({item.stock} / {item.minStock} unidades)
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TABELA */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold">Gestão de Estoque</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-gray-100">
                <th className="px-6 py-4">Produto</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Estoque Atual</th>
                <th className="px-6 py-4">Mínimo</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-sm">{item.name}</td>
                  <td className="px-6 py-4">
                    <span className="font-mono bg-zinc-100 px-2 py-1 rounded text-xs text-zinc-600 font-semibold">
                      {item.sku}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-bold text-sm ${item.stock === 0 ? 'text-red-600' : item.stock <= item.minStock ? 'text-yellow-600' : 'text-green-600'}`}>
                      {item.stock} un
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">{item.minStock} un</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => openStockModal(item)}
                      className="p-2 text-gray-400 hover:text-black transition-colors"
                      title="Editar Estoque"
                    >
                      <Edit size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    {/* Stock Edit Modal */}
    <Modal isOpen={stockModal.isOpen} onClose={closeStockModal} title={`Editar estoque — ${stockModal.item?.name || ''}`} size="sm">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 border rounded" onClick={() => setStockModal(prev => ({ ...prev, newStock: Math.max(0, prev.newStock - 1) }))}>−</button>
          <input
            type="number"
            value={stockModal.newStock}
            onChange={(e) => setStockModal(prev => ({ ...prev, newStock: Number(e.target.value) }))}
            className="w-24 p-2 border rounded text-center"
          />
          <button className="px-3 py-2 border rounded" onClick={() => setStockModal(prev => ({ ...prev, newStock: Number(prev.newStock) + 1 }))}>+</button>
        </div>

        <div className="flex gap-2">
          <button onClick={saveStockModal} className="flex-1 bg-black text-white py-2 font-bold hover:bg-zinc-800 rounded-lg">Salvar</button>
          <button onClick={closeStockModal} className="px-4 py-2 border rounded-lg">Cancelar</button>
        </div>
      </div>
    </Modal>
    </>
  );
}
