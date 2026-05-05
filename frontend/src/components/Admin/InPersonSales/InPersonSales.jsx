import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, Plus, Trash2, Loader2, CheckCircle, Package, Search, DollarSign, Calendar, Mail, User, FileText, ArrowRight } from 'lucide-react';
import { api } from '../../../services/api';

const useToast = () => ({
  success: (msg) => console.log('✅ SUCESSO:', msg),
  error: (msg) => console.error('❌ ERRO:', msg),
  info: (msg) => console.info('ℹ️ INFO:', msg),
});

const PAYMENT_METHODS = [
  { value: 'dinheiro', label: 'WhatsApp / Dinheiro' },
  { value: 'pix', label: 'PIX Presencial' },
  { value: 'cartao', label: 'Cartão de Crédito/Débito' },
];

export default function App() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [success, setSuccess] = useState(false);
  const [recentSales, setRecentSales] = useState([]);

  const [form, setForm] = useState({
    nome_cliente: '',
    email_cliente: '',
    metodo_pagamento: 'dinheiro',
    data_pedido: new Date().toISOString().slice(0, 16),
    observacoes_internas: '',
  });

  const [items, setItems] = useState([{ id_produto: '', tamanho: '', quantidade: 1, preco_unitario: '' }]);

  useEffect(() => {
    api.get('/products?oculto=all')
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setProducts(data);
      })
      .catch(() => toast.error('Erro ao carregar produtos'));
  }, [toast]);

  const loadRecentSales = useCallback(() => {
    api.get('/admin/sales?limit=5&page=1')
      .then((res) => {
        const all = res.data?.data || [];
        setRecentSales(all.filter((o) => o.origem === 'presencial').slice(0, 5));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadRecentSales();
  }, [loadRecentSales]);

  const getVariations = (id) => {
    const p = products.find((pp) => pp.id_produto === Number(id));
    return Array.isArray(p?.variacoes_estoque) ? p.variacoes_estoque : [];
  };

  const handleEmailLookup = async () => {
    const email = String(form.email_cliente || '').trim();
    if (!email) return;

    setSearchingCustomer(true);
    try {
      const { data } = await api.get(`/admin/customers/by-email?email=${encodeURIComponent(email)}`);
      if (data?.id_usuario) {
        setForm((prev) => ({
          ...prev,
          nome_cliente: data.nome || prev.nome_cliente,
          email_cliente: data.email || prev.email_cliente,
        }));
        toast.info('Cliente existente encontrado e reaproveitado.');
      }
    } catch {
      // fluxo segue normalmente quando e-mail nao existe
    } finally {
      setSearchingCustomer(false);
    }
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const n = [...prev];
      n[index] = { ...n[index], [field]: value };

      if (field === 'id_produto' && value) {
        const p = products.find((pp) => pp.id_produto === Number(value));
        if (p) n[index].preco_unitario = Number(p.preco);
      }
      return n;
    });
  };

  const addItem = () => setItems((prev) => [...prev, { id_produto: '', tamanho: '', quantidade: 1, preco_unitario: '' }]);
  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const total = items.reduce((sum, i) => sum + (Number(i.preco_unitario || 0) * Number(i.quantidade || 0)), 0);

  const handleSubmit = async () => {
    if (!form.nome_cliente.trim()) {
      toast.error('Nome do cliente é obrigatório');
      return;
    }
    if (items.some((i) => !i.id_produto || !i.tamanho)) {
      toast.error('Preencha produto e tamanho de todos os itens');
      return;
    }

    setSaving(true);
    try {
      await api.post('/admin/sales/in-person', {
        ...form,
        items: items.map((i) => ({
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
        setForm({
          nome_cliente: '',
          email_cliente: '',
          metodo_pagamento: 'dinheiro',
          data_pedido: new Date().toISOString().slice(0, 16),
          observacoes_internas: '',
        });
        setItems([{ id_produto: '', tamanho: '', quantidade: 1, preco_unitario: '' }]);
        loadRecentSales();
      }, 2000);
    } catch (err) {
      toast.error(err.response?.data?.mensagem || 'Erro ao registrar venda');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen text-gray-900 font-sans p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form Area */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Seção Dados do Cliente */}
            <div className="bg-white border border-gray-100 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.05)] rounded-2xl p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <User size={18} className="text-gray-400" />
                <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider">Dados do Cliente</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">Nome do Cliente *</label>
                  <input
                    type="text"
                    value={form.nome_cliente}
                    onChange={(e) => setForm((f) => ({ ...f, nome_cliente: e.target.value }))}
                    placeholder="Ex: João Silva"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    Email do Cliente
                    {searchingCustomer && <Loader2 size={12} className="animate-spin text-blue-500 ml-auto" />}
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={form.email_cliente}
                      onChange={(e) => setForm((f) => ({ ...f, email_cliente: e.target.value }))}
                      onBlur={handleEmailLookup}
                      placeholder="cliente@email.com"
                      className="w-full px-4 py-3 pl-11 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all shadow-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">Forma de Pagamento</label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                      value={form.metodo_pagamento}
                      onChange={(e) => setForm((f) => ({ ...f, metodo_pagamento: e.target.value }))}
                      className="w-full px-4 py-3 pl-11 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all shadow-sm appearance-none bg-no-repeat bg-[right_1rem_center]"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")` }}
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">Data e Hora do Pedido</label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="datetime-local"
                      value={form.data_pedido}
                      onChange={(e) => setForm((f) => ({ ...f, data_pedido: e.target.value }))}
                      className="w-full px-4 py-3 pl-11 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all shadow-sm"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">Observações Internas (Opcional)</label>
                  <div className="relative">
                    <FileText size={16} className="absolute left-4 top-4 text-gray-400" />
                    <textarea
                      rows={2}
                      value={form.observacoes_internas}
                      onChange={(e) => setForm((f) => ({ ...f, observacoes_internas: e.target.value }))}
                      placeholder="Alguma nota sobre esta venda..."
                      className="w-full px-4 py-3 pl-11 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all shadow-sm py-3 resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Seção Itens da Venda */}
            <div className="bg-white border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] rounded-2xl p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 mb-2">
                  <Package size={18} className="text-gray-400" />
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider">Itens da Venda</h4>
                </div>
                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                  {items.length} {items.length === 1 ? 'Item' : 'Itens'}
                </span>
              </div>

              <div className="space-y-4">
                {items.map((item, idx) => (
                  <div key={idx} className="flex flex-wrap md:flex-nowrap gap-3 items-end bg-gray-50/50 p-4 rounded-xl border border-gray-100 group transition-all hover:border-gray-200 hover:bg-gray-50">
                    <div className="w-full md:flex-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block">Produto</label>
                      <select
                        value={item.id_produto}
                        onChange={(e) => handleItemChange(idx, 'id_produto', e.target.value)}
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all shadow-sm"
                      >
                        <option value="">Selecione um produto...</option>
                        {products.map((p) => (
                          <option key={p.id_produto} value={p.id_produto}>
                            {p.nome_produto}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="w-full md:w-28">
                      <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block">Tamanho</label>
                      <select
                        value={item.tamanho}
                        onChange={(e) => handleItemChange(idx, 'tamanho', e.target.value)}
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-center text-gray-800 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all shadow-sm disabled:bg-gray-100"
                        disabled={!item.id_produto}
                      >
                        <option value="">-</option>
                        {getVariations(item.id_produto).map((v) => (
                          <option key={v.tamanho} value={v.tamanho} disabled={v.estoque === 0}>
                            {v.tamanho} {v.estoque > 0 ? `(${v.estoque})` : '(Esgotado)'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-1/2 md:w-20">
                      <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block">Qtd</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantidade}
                        onChange={(e) => handleItemChange(idx, 'quantidade', e.target.value)}
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm text-center font-bold text-gray-800 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all shadow-sm"
                      />
                    </div>

                    <div className="w-1/2 md:w-32">
                      <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block">Valor (R$)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.preco_unitario}
                        onChange={(e) => handleItemChange(idx, 'preco_unitario', e.target.value)}
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all shadow-sm"
                        placeholder="0.00"
                      />
                    </div>

                    {items.length > 1 && (
                      <div className="w-full md:w-auto mt-2 md:mt-0 flex justify-end">
                        <button 
                          onClick={() => removeItem(idx)} 
                          className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remover Item"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button onClick={addItem} className="flex items-center gap-2 text-gray-700 bg-white border border-gray-200 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
                  <Plus size={16} /> Adicionar Produto
                </button>
              </div>
            </div>

          </div>

          {/* Sidebar Area */}
            <div className="space-y-6">
              
              {/* Resumo da Compra */}
              <div className="bg-white border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] rounded-2xl p-6 md:p-8">
                <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-6">Resumo</h4>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Subtotal</span>
                    <span className="font-medium text-gray-900">R$ {total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Descontos</span>
                    <span className="font-medium text-gray-900">R$ 0.00</span>
                  </div>
                  <div className="h-px bg-gray-100 w-full my-4"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Final</span>
                    <span className="text-3xl font-black text-gray-900 tracking-tight">R$ {total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={saving || success}
                  className={`w-full py-4 font-bold text-sm uppercase tracking-wider rounded-xl flex items-center justify-center gap-3 transition-colors ${
                    success 
                      ? "bg-emerald-500 text-white" // <-- Verde quando dá sucesso
                      : "bg-white border border-gray-200 text-gray-700 hover:bg-black disabled:opacity-10 disabled:cursor-not-allowed" // <-- Cinza normal
                  }`}
                >
                  {saving ? (
                    <><Loader2 size={18} className="animate-spin" /> Processando...</>
                  ) : success ? (
                    <><CheckCircle size={18} /> Venda Concluída</>
                  ) : (
                    <>Finalizar Venda <ArrowRight size={18} /></>
                  )}
                </button>
              </div>

            {/* Vendas Recentes Widget */}
            <div className="bg-white border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] rounded-2xl p-6 md:p-8">
              <div className="flex items-center justify-between mb-5">
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Vendas Recentes</h4>
                <ShoppingBag size={16} className="text-gray-400" />
              </div>
              
              {recentSales.length === 0 ? (
                <div className="text-center py-6 text-sm text-gray-400">
                  <p className="text-sm text-gray-400">Nenhuma venda registrada hoje.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentSales.map((s) => (
                    <div key={s.id_pedido} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                      <div>
                        <p className="text-sm font-bold text-gray-900 leading-tight">
                          {s.nome_cliente || s.usuario?.nome || 'Cliente Local'}
                        </p>
                        <p className="text-[11px] font-medium text-gray-500 mt-0.5 flex items-center gap-1.5">
                          {new Date(s.data_pedido).toLocaleDateString('pt-BR')} 
                          <span className="w-1 h-1 rounded-full bg-gray-300"></span> 
                          <span className="capitalize">{s.metodo_pagamento.replace('_', ' ')}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-gray-900">R$ {Number(s.total).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}