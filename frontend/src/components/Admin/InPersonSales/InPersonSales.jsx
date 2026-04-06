import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, Plus, Trash2, Loader2, CheckCircle } from 'lucide-react';
import { api } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';

const inputCls = 'w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg outline-none focus:border-zinc-500 transition-colors text-white placeholder-zinc-500';

const PAYMENT_METHODS = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'cartao_debito', label: 'Cartão de Débito' },
  { value: 'transferencia', label: 'Transferência' },
];

export default function InPersonSales() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [recentSales, setRecentSales] = useState([]);

  const [form, setForm] = useState({
    nome_cliente: '',
    metodo_pagamento: 'pix',
    data_pedido: new Date().toISOString().slice(0, 16),
    observacoes_internas: '',
  });

  const [items, setItems] = useState([{ id_produto: '', tamanho: '', quantidade: 1, preco_unitario: '' }]);

  // Load products for selection
  useEffect(() => {
    api.get('/products?oculto=all').then(res => {
      const data = res.data?.data || res.data || [];
      setProducts(data);
    }).catch(() => toast.error('Erro ao carregar produtos'));
  }, []);

  // Load recent in-person sales
  const loadRecentSales = useCallback(() => {
    api.get('/admin/sales?limit=5&page=1').then(res => {
      const all = res.data?.data || [];
      setRecentSales(all.filter(o => o.origem === 'presencial').slice(0, 5));
    }).catch(() => {});
  }, []);

  useEffect(() => { loadRecentSales(); }, [loadRecentSales]);

  const getProduct = (id) => products.find(p => p.id_produto === Number(id));
  const getVariations = (id) => {
    const p = getProduct(id);
    return Array.isArray(p?.variacoes_estoque) ? p.variacoes_estoque : [];
  };

  const handleItemChange = (index, field, value) => {
    setItems(prev => {
      const n = [...prev];
      n[index] = { ...n[index], [field]: value };

      // Auto-fill price when product selected
      if (field === 'id_produto' && value) {
        const p = products.find(pp => pp.id_produto === Number(value));
        if (p) n[index].preco_unitario = Number(p.preco);
      }
      return n;
    });
  };

  const addItem = () => setItems(prev => [...prev, { id_produto: '', tamanho: '', quantidade: 1, preco_unitario: '' }]);
  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const total = items.reduce((sum, i) => sum + (Number(i.preco_unitario || 0) * Number(i.quantidade || 0)), 0);

  const handleSubmit = async () => {
    if (!form.nome_cliente.trim()) { toast.error('Nome do cliente é obrigatório'); return; }
    if (items.some(i => !i.id_produto || !i.tamanho)) { toast.error('Preencha produto e tamanho de todos os itens'); return; }

    setSaving(true);
    try {
      await api.post('/admin/sales/in-person', {
        nome_cliente: form.nome_cliente,
        metodo_pagamento: form.metodo_pagamento,
        data_pedido: form.data_pedido,
        observacoes_internas: form.observacoes_internas,
        items: items.map(i => ({
          id_produto: Number(i.id_produto),
          tamanho: i.tamanho,
          sku_variacao: i.tamanho,
          quantidade: Number(i.quantidade),
          preco_unitario: Number(i.preco_unitario),
        })),
      });

      setSuccess(true);
      toast.success('Venda registrada com sucesso!');
      setTimeout(() => {
        setSuccess(false);
        setForm({ nome_cliente: '', metodo_pagamento: 'pix', data_pedido: new Date().toISOString().slice(0, 16), observacoes_internas: '' });
        setItems([{ id_produto: '', tamanho: '', quantidade: 1, preco_unitario: '' }]);
        loadRecentSales();
      }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.mensagem || 'Erro ao registrar venda');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <ShoppingBag size={24} />
        <div>
          <h3 className="text-xl font-black uppercase">Venda Presencial</h3>
          <p className="text-sm text-zinc-500">Registre vendas feitas pessoalmente ou por boca a boca</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FORM */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
            <h4 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Dados da Venda</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block text-zinc-300">Nome do Cliente *</label>
                <input type="text" value={form.nome_cliente}
                  onChange={e => setForm(f => ({ ...f, nome_cliente: e.target.value }))}
                  placeholder="Ex: João Silva" className={inputCls} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block text-zinc-300">Forma de Pagamento</label>
                <select value={form.metodo_pagamento}
                  onChange={e => setForm(f => ({ ...f, metodo_pagamento: e.target.value }))}
                  className={inputCls}>
                  {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block text-zinc-300">Data e Hora</label>
                <input type="datetime-local" value={form.data_pedido}
                  onChange={e => setForm(f => ({ ...f, data_pedido: e.target.value }))}
                  className={inputCls} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block text-zinc-300">Observações</label>
                <input type="text" value={form.observacoes_internas}
                  onChange={e => setForm(f => ({ ...f, observacoes_internas: e.target.value }))}
                  placeholder="Opcional..." className={inputCls} />
              </div>
            </div>
          </div>

          {/* ITEMS */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
            <h4 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Itens da Venda</h4>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-end bg-zinc-800 p-3 rounded-lg border border-zinc-700">
                  <div className="flex-1">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase mb-1 block">Produto</label>
                    <select value={item.id_produto} onChange={e => handleItemChange(idx, 'id_produto', e.target.value)}
                      className="w-full p-2 bg-zinc-700 border border-zinc-600 rounded text-sm text-white">
                      <option value="">Selecione...</option>
                      {products.map(p => (
                        <option key={p.id_produto} value={p.id_produto}>{p.nome_produto} — R$ {Number(p.preco).toFixed(2)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase mb-1 block">Tamanho</label>
                    <select value={item.tamanho} onChange={e => handleItemChange(idx, 'tamanho', e.target.value)}
                      className="w-full p-2 bg-zinc-700 border border-zinc-600 rounded text-center font-bold text-sm text-white">
                      <option value="">—</option>
                      {getVariations(item.id_produto).map(v => (
                        <option key={v.tamanho} value={v.tamanho} disabled={v.estoque === 0}>
                          {v.tamanho} ({v.estoque || 0})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-20">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase mb-1 block">Qtd</label>
                    <input type="number" min="1" value={item.quantidade}
                      onChange={e => handleItemChange(idx, 'quantidade', e.target.value)}
                      className="w-full p-2 bg-zinc-700 border border-zinc-600 rounded text-sm text-center text-white" />
                  </div>
                  <div className="w-28">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase mb-1 block">Valor Un.</label>
                    <input type="number" min="0" step="0.01" value={item.preco_unitario}
                      onChange={e => handleItemChange(idx, 'preco_unitario', e.target.value)}
                      className="w-full p-2 bg-zinc-700 border border-zinc-600 rounded text-sm text-white" />
                  </div>
                  {items.length > 1 && (
                    <button onClick={() => removeItem(idx)} className="p-2 text-red-400 hover:bg-red-950 rounded transition-colors">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button onClick={addItem}
              className="flex items-center gap-2 bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg text-xs font-bold hover:bg-zinc-700 transition-colors border border-zinc-700">
              <Plus size={14} /> Adicionar Item
            </button>
          </div>

          {/* TOTAL + SUBMIT */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-bold text-zinc-300">Total</span>
              <span className="text-2xl font-black text-white">R$ {total.toFixed(2)}</span>
            </div>

            <button onClick={handleSubmit} disabled={saving || success}
              className={`w-full py-3 font-bold rounded-lg flex items-center justify-center gap-2 transition-colors ${
                success ? 'bg-emerald-600 text-white' : 'bg-white text-black hover:bg-zinc-200 disabled:opacity-50'
              }`}>
              {saving && <Loader2 size={18} className="animate-spin" />}
              {success && <CheckCircle size={18} />}
              {saving ? 'Registrando...' : success ? 'Venda Registrada!' : 'Registrar Venda'}
            </button>
          </div>
        </div>

        {/* RECENT SALES SIDEBAR */}
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h4 className="text-sm font-bold text-zinc-300 uppercase tracking-wider mb-4">Vendas Presenciais Recentes</h4>
            {recentSales.length === 0 ? (
              <p className="text-sm text-zinc-500">Nenhuma venda presencial ainda.</p>
            ) : (
              <div className="space-y-3">
                {recentSales.map(s => (
                  <div key={s.id_pedido} className="bg-zinc-800 p-3 rounded-lg border border-zinc-700">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold text-white">{s.nome_cliente || 'Cliente'}</p>
                        <p className="text-xs text-zinc-500">{new Date(s.data_pedido).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <span className="text-sm font-bold text-emerald-400">R$ {Number(s.total).toFixed(2)}</span>
                    </div>
                    {s.metodo_pagamento && (
                      <p className="text-xs text-zinc-500 mt-1 capitalize">{s.metodo_pagamento.replace('_', ' ')}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
