import React, { useState } from 'react';
import { Search, Eye, Edit, Trash2, ChevronRight } from 'lucide-react';
import Modal from '../Modal';

export default function Sales() {
  const [orders, setOrders] = useState([
    { id: '#1024', client: 'João Silva', email: 'joao@email.com', total: 450.00, status: 'Pago', date: '2024-10-25', items: 2 },
    { id: '#1025', client: 'Maria Souza', email: 'maria@email.com', total: 149.90, status: 'Pendente', date: '2024-10-26', items: 1 },
    { id: '#1026', client: 'Pedro Rocha', email: 'pedro@email.com', total: 890.50, status: 'Enviado', date: '2024-10-26', items: 3 },
    { id: '#1027', client: 'Ana Costa', email: 'ana@email.com', total: 289.00, status: 'Entregue', date: '2024-10-24', items: 1 },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('todos');
  const [orderModal, setOrderModal] = useState({ isOpen: false, order: null });
  const [statusModal, setStatusModal] = useState({ isOpen: false, order: null, status: '' });

  const statusColors = {
    'Pago': 'bg-green-100 text-green-700',
    'Pendente': 'bg-yellow-100 text-yellow-700',
    'Enviado': 'bg-blue-100 text-blue-700',
    'Entregue': 'bg-gray-100 text-gray-700',
    'Cancelado': 'bg-red-100 text-red-700',
  };

  const filteredOrders = orders.filter(o => {
    const matchSearch = o.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.id.includes(searchTerm) ||
      o.email.includes(searchTerm);
    const matchStatus = selectedStatus === 'todos' || o.status === selectedStatus;
    return matchSearch && matchStatus;
  });

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);

  const openOrderModal = (order) => setOrderModal({ isOpen: true, order });
  const closeOrderModal = () => setOrderModal({ isOpen: false, order: null });

  const openStatusModal = (order) => setStatusModal({ isOpen: true, order, status: order.status });
  const closeStatusModal = () => setStatusModal({ isOpen: false, order: null, status: '' });

  const saveOrderStatus = () => {
    if (!statusModal.order) return;
    setOrders(orders.map(o => o.id === statusModal.order.id ? { ...o, status: statusModal.status } : o));
    closeStatusModal();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 border border-gray-100 rounded-lg">
          <p className="text-gray-500 text-sm font-medium">Total de Vendas</p>
          <h3 className="text-2xl font-bold mt-2">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
        <div className="bg-white p-6 border border-gray-100 rounded-lg">
          <p className="text-gray-500 text-sm font-medium">Pedidos</p>
          <h3 className="text-2xl font-bold mt-2">{filteredOrders.length}</h3>
        </div>
        <div className="bg-white p-6 border border-gray-100 rounded-lg">
          <p className="text-gray-500 text-sm font-medium">Ticket Médio</p>
          <h3 className="text-2xl font-bold mt-2">
            R$ {(totalRevenue / (filteredOrders.length || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
        </div>
        <div className="bg-white p-6 border border-gray-100 rounded-lg">
          <p className="text-gray-500 text-sm font-medium">Conversão</p>
          <h3 className="text-2xl font-bold mt-2">3.2%</h3>
        </div>
      </div>

      {/* TABELA DE PEDIDOS */}
      <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por cliente, email ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-black outline-none"
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-black bg-white"
          >
            <option value="todos">Todos os Status</option>
            <option value="Pago">Pago</option>
            <option value="Pendente">Pendente</option>
            <option value="Enviado">Enviado</option>
            <option value="Entregue">Entregue</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-gray-100">
                <th className="px-6 py-4">ID do Pedido</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Itens</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-sm">{order.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-sm">{order.client}</div>
                    <div className="text-[12px] text-gray-400">{order.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">{order.items} item{order.items !== 1 ? 's' : ''}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase ${statusColors[order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-sm">R$ {order.total.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(order.date).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => openOrderModal(order)} className="p-2 text-gray-400 hover:text-black transition-colors" title="Ver detalhes">
                      <Eye size={16} />
                    </button>
                    <button onClick={() => openStatusModal(order)} className="p-2 text-gray-400 hover:text-black transition-colors" title="Editar">
                      <Edit size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Order Details Modal */}
        <Modal isOpen={orderModal.isOpen} onClose={closeOrderModal} title={`Detalhes do pedido ${orderModal.order?.id || ''}`}>
          <div className="space-y-4">
            <p className="text-sm">Cliente: <strong>{orderModal.order?.client}</strong></p>
            <p className="text-sm">Email: {orderModal.order?.email}</p>
            <p className="text-sm">Total: R$ {orderModal.order?.total?.toFixed(2)}</p>
            <p className="text-sm">Itens: {orderModal.order?.items}</p>
            <div className="flex gap-2 mt-4">
              <button onClick={closeOrderModal} className="px-4 py-2 border rounded">Fechar</button>
            </div>
          </div>
        </Modal>

        {/* Update Status Modal */}
        <Modal isOpen={statusModal.isOpen} onClose={closeStatusModal} title={`Atualizar status ${statusModal.order?.id || ''}`}>
          <div className="space-y-4">
            <select value={statusModal.status} onChange={(e) => setStatusModal(prev => ({ ...prev, status: e.target.value }))} className="w-full p-2 border rounded">
              <option value="Pago">Pago</option>
              <option value="Pendente">Pendente</option>
              <option value="Enviado">Enviado</option>
              <option value="Entregue">Entregue</option>
              <option value="Cancelado">Cancelado</option>
            </select>
            <div className="flex gap-2">
              <button onClick={saveOrderStatus} className="flex-1 bg-black text-white py-2 rounded">Salvar</button>
              <button onClick={closeStatusModal} className="px-4 py-2 border rounded">Cancelar</button>
            </div>
          </div>
        </Modal>

        {filteredOrders.length === 0 && (
          <div className="p-12 text-center text-gray-400">
            <p>Nenhum pedido encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
}
