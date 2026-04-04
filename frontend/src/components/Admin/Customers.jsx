import React, { useState } from 'react';
import { Search, Crown, Sparkles } from 'lucide-react';

export default function Customers() {
  const [customers, setCustomers] = useState([
    { id: 1, name: 'João Silva', email: 'joao@email.com', phone: '11999999999', totalSpent: 1250.00, orders: 5, type: 'VIP', registered: '2023-06-15' },
    { id: 2, name: 'Maria Souza', email: 'maria@email.com', phone: '11988888888', totalSpent: 450.00, orders: 2, type: 'Recorrente', registered: '2023-08-20' },
    { id: 3, name: 'Pedro Rocha', email: 'pedro@email.com', phone: '11977777777', totalSpent: 89.90, orders: 1, type: 'Novo', registered: '2024-10-10' },
    { id: 4, name: 'Ana Costa', email: 'ana@email.com', phone: '11966666666', totalSpent: 890.50, orders: 4, type: 'VIP', registered: '2023-05-08' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('todos');

  const filteredCustomers = customers.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.includes(searchTerm) ||
      c.phone.includes(searchTerm);
    const matchType = selectedType === 'todos' || c.type === selectedType;
    return matchSearch && matchType;
  });

  const getTypeColor = (type) => {
    switch(type) {
      case 'VIP':
        return 'bg-purple-100 text-purple-700';
      case 'Recorrente':
        return 'bg-blue-100 text-blue-700';
      case 'Novo':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const stats = {
    total: customers.length,
    vip: customers.filter(c => c.type === 'VIP').length,
    novo: customers.filter(c => c.type === 'Novo').length,
    totalSpent: customers.reduce((sum, c) => sum + c.totalSpent, 0),
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 border border-gray-100 rounded-lg">
          <p className="text-gray-500 text-sm font-medium">Total de Clientes</p>
          <h3 className="text-3xl font-bold mt-2">{stats.total}</h3>
        </div>
        <div className="bg-white p-6 border border-gray-100 rounded-lg">
          <p className="text-gray-500 text-sm font-medium">Clientes VIP</p>
          <h3 className="text-3xl font-bold mt-2 text-purple-600">{stats.vip}</h3>
        </div>
        <div className="bg-white p-6 border border-gray-100 rounded-lg">
          <p className="text-gray-500 text-sm font-medium">Novos Clientes</p>
          <h3 className="text-3xl font-bold mt-2 text-green-600">{stats.novo}</h3>
        </div>
        <div className="bg-white p-6 border border-gray-100 rounded-lg">
          <p className="text-gray-500 text-sm font-medium">Receita Total</p>
          <h3 className="text-2xl font-bold mt-2">R$ {stats.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
      </div>

      {/* TABELA */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-black outline-none"
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-black bg-white"
          >
            <option value="todos">Todas as Categorias</option>
            <option value="VIP">VIP</option>
            <option value="Recorrente">Recorrente</option>
            <option value="Novo">Novo</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-gray-100">
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Telefone</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Pedidos</th>
                <th className="px-6 py-4">Total Gasto</th>
                <th className="px-6 py-4">Membro Desde</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-sm">{c.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.phone}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {c.type === 'VIP' && <Crown size={14} className="text-purple-600" />}
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${getTypeColor(c.type)}`}>
                        {c.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-sm">{c.orders}</td>
                  <td className="px-6 py-4 font-bold">R$ {c.totalSpent.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(c.registered).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="p-12 text-center text-gray-400">
            <p>Nenhum cliente encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
}
