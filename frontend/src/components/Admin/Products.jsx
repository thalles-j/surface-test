import React, { useState } from 'react';
import { Plus, Trash2, Edit, Search, Hash, Info } from 'lucide-react';
import Modal from '../Modal';

export default function Products() {
  const [products, setProducts] = useState([
    { id: 1, name: 'Camiseta Boxy Logo', price: 149.90, category: 'Exclusivo', sku: 'SRF-CAM-LOG-01', qty: 45, status: 'Ativo', featured: true },
    { id: 2, name: 'Moletom Oversized Void', price: 349.00, category: 'Drops', sku: 'SRF-MOL-VOI-10', qty: 12, status: 'Ativo', featured: false },
    { id: 3, name: 'Calça Cargo Tech', price: 289.00, category: 'Essentials', sku: 'SRF-CAL-TEC-05', qty: 0, status: 'Inativo', featured: false },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'Exclusivo',
    sku: '',
    qty: '',
    status: 'Ativo',
    featured: false,
  });
  const [variations, setVariations] = useState([
    { size: 'M', sku: '', stock: '' }
  ]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.includes(searchTerm)
  );

  const handleAddProduct = () => {
    if (editingId) {
      setProducts(products.map(p => p.id === editingId ? { ...formData, id: editingId } : p));
      setEditingId(null);
    } else {
      setProducts([...products, { ...formData, id: Date.now() }]);
    }
    setFormData({ name: '', price: '', category: 'Exclusivo', sku: '', qty: '', status: 'Ativo', featured: false });
    setShowForm(false);
    setVariations([{ size: 'M', sku: '', stock: '' }]);
  };

  const handleEditProduct = (p) => {
    setFormData(p);
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleDeleteProduct = (id) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const handleAddVariation = () => {
    setVariations([...variations, { size: '', sku: '', stock: '' }]);
  };

  const handleVariationChange = (index, field, value) => {
    const newVars = [...variations];
    newVars[index][field] = value;
    setVariations(newVars);
  };

  const handleRemoveVariation = (index) => {
    setVariations(variations.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
          {/* FORM (agora em modal) */}
          <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditingId(null); }} title={editingId ? 'Editar Produto' : 'Adicionar Novo Produto'} size="lg">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Nome do Produto</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Camiseta Boxy Off-White"
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Preço Base (R$)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Categoria</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-black bg-white"
                  >
                    <option>Exclusivo</option>
                    <option>Drops</option>
                    <option>Essentials</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">SKU Base</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Ex: SRF-CAM-BOXY"
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-black font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Quantidade</label>
                  <input
                    type="number"
                    value={formData.qty}
                    onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-black bg-white"
                  >
                    <option>Ativo</option>
                    <option>Inativo</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">Produto Destaque</span>
                  </label>
                </div>
              </div>

              {/* VARIAÇÕES */}
              <div className="border-t border-gray-200 pt-6">
                <label className="text-sm font-bold flex items-center gap-2 mb-4">
                  <Hash size={16} className="text-gray-400" />
                  Variações e SKUs
                </label>
                <div className="space-y-3">
                  {variations.map((v, i) => (
                    <div key={i} className="flex gap-2 items-end bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div className="w-20">
                        <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Tamanho</label>
                        <input
                          type="text"
                          value={v.size}
                          onChange={(e) => handleVariationChange(i, 'size', e.target.value)}
                          className="w-full p-2 border border-gray-200 rounded text-center font-bold text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">SKU</label>
                        <input
                          type="text"
                          value={v.sku}
                          onChange={(e) => handleVariationChange(i, 'sku', e.target.value)}
                          placeholder="Ex: SRF-CAM-BOXY-M"
                          className="w-full p-2 border border-gray-200 rounded font-mono text-sm uppercase"
                        />
                      </div>
                      <div className="w-24">
                        <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Stock</label>
                        <input
                          type="number"
                          value={v.stock}
                          onChange={(e) => handleVariationChange(i, 'stock', e.target.value)}
                          className="w-full p-2 border border-gray-200 rounded text-sm"
                        />
                      </div>
                      {variations.length > 1 && (
                        <button
                          onClick={() => handleRemoveVariation(i)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleAddVariation}
                  className="mt-3 flex items-center gap-2 bg-gray-100 text-black px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors border border-gray-200"
                >
                  <Plus size={14} /> Adicionar Variação
                </button>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={handleAddProduct}
                  className="flex-1 bg-black text-white py-3 font-bold hover:bg-zinc-800 transition-colors rounded-lg"
                >
                  {editingId ? 'Atualizar Produto' : 'Criar Produto'}
                </button>
                <button
                  onClick={() => { setShowForm(false); setEditingId(null); }}
                  className="px-6 py-3 border border-gray-300 font-bold hover:bg-gray-50 transition-colors rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </Modal>

      {/* LISTA */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex gap-4 justify-between items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por SKU ou nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-black outline-none"
            />
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-zinc-800 transition-colors"
          >
            <Plus size={18} /> Novo Produto
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-gray-100">
                <th className="px-6 py-4">Produto</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Estoque</th>
                <th className="px-6 py-4">Preço</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Destaque</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-sm">{p.name}</div>
                    <div className="text-[10px] text-gray-400 uppercase font-bold">{p.category}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono bg-zinc-100 px-2 py-1 rounded text-xs text-zinc-600 font-semibold border border-zinc-200">
                      {p.sku}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-medium text-sm ${p.qty === 0 ? 'text-red-600' : p.qty < 20 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {p.qty} un
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold">R$ {String(p.price).replace('.', ',')}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${p.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {p.featured ? '⭐' : '-'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleEditProduct(p)} className="p-2 text-gray-400 hover:text-black transition-colors">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="p-12 text-center text-gray-400">
            <p>Nenhum produto encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
}
