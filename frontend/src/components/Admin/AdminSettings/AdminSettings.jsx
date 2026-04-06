import React, { useState, useEffect } from 'react';
import { Save, Power, AlertCircle } from 'lucide-react';
import AlertModal from '../../AlertModal';
import { api } from '../../../services/api';

const inputCls = 'w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg outline-none focus:border-zinc-500 text-white placeholder-zinc-500 transition-colors';
const labelCls = 'text-sm font-medium mb-1 block text-zinc-300';

function Field({ label, children, error }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
    </div>
  );
}

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    storeName: '', storeEmail: '', phone: '', address: '', cnpj: '', descricaoMarca: '',
    whatsapp: '', instagram: '', politicaAtendimento: '',
    lojaAtiva: true, shippingFee: 0, freeShippingAbove: 0, currency: 'BRL',
    prazoEnvio: '', msgCheckoutWhatsapp: '', paymentMethods: [],
    emailComercial: '', telefoneComercial: '', whatsappVendas: '', textoInstitucional: '',
    atualizadoEm: null,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [edited, setEdited] = useState(false);
  const [errors, setErrors] = useState({});
  const [confirmSave, setConfirmSave] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/admin/settings');
        const s = res.data || {};
        setSettings({
          storeName: s.nome_loja || '', storeEmail: s.email || '', phone: s.telefone || '',
          address: s.endereco || '', cnpj: s.cnpj || '', descricaoMarca: s.descricao_marca || '',
          whatsapp: s.whatsapp || '', instagram: s.instagram || '',
          politicaAtendimento: s.politica_atendimento || '',
          lojaAtiva: s.loja_ativa !== false,
          shippingFee: Number(s.frete) || 0, freeShippingAbove: Number(s.frete_gratis_acima) || 0,
          currency: s.moeda || 'BRL', prazoEnvio: s.prazo_envio || '',
          msgCheckoutWhatsapp: s.msg_checkout_whatsapp || '',
          paymentMethods: s.metodo_pagamento ? s.metodo_pagamento.split(',') : [],
          emailComercial: s.email_comercial || '', telefoneComercial: s.telefone_comercial || '',
          whatsappVendas: s.whatsapp_vendas || '', textoInstitucional: s.texto_institucional || '',
          atualizadoEm: s.atualizado_em || null,
        });
      } catch (err) {
        console.error('Erro ao carregar configurações:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setEdited(true);
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const e = {};
    if (!settings.storeName.trim()) e.storeName = 'Nome da loja é obrigatório';
    if (!settings.storeEmail.trim()) e.storeEmail = 'Email é obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.storeEmail)) e.storeEmail = 'Email inválido';
    if (settings.emailComercial && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.emailComercial)) e.emailComercial = 'Email comercial inválido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await api.patch('/admin/settings', {
        nome_loja: settings.storeName, email: settings.storeEmail, telefone: settings.phone,
        endereco: settings.address, cnpj: settings.cnpj, descricao_marca: settings.descricaoMarca,
        whatsapp: settings.whatsapp, instagram: settings.instagram,
        politica_atendimento: settings.politicaAtendimento,
        metodo_pagamento: settings.paymentMethods.join(','),
        frete: settings.shippingFee, frete_gratis_acima: settings.freeShippingAbove,
        moeda: settings.currency, prazo_envio: settings.prazoEnvio,
        msg_checkout_whatsapp: settings.msgCheckoutWhatsapp,
        email_comercial: settings.emailComercial, telefone_comercial: settings.telefoneComercial,
        whatsapp_vendas: settings.whatsappVendas, texto_institucional: settings.textoInstitucional,
      });
      setEdited(false);
      setSaved(true);
      if (res.data?.settings?.atualizado_em) {
        setSettings(prev => ({ ...prev, atualizadoEm: res.data.settings.atualizado_em }));
      }
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStore = async () => {
    try {
      const res = await api.patch('/admin/settings/toggle-store', { loja_ativa: !settings.lojaAtiva });
      setSettings(prev => ({ ...prev, lojaAtiva: res.data.loja_ativa }));
      setConfirmToggle(false);
    } catch (err) {
      console.error('Erro ao alterar status:', err);
    }
  };

  if (loading) return <div className="text-center py-12">Carregando...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-xl font-bold">Configurações da Loja</h2>
          {edited && (
            <button
              onClick={() => { if (validate()) setConfirmSave(true); }}
              disabled={saving}
              className="flex items-center gap-2 bg-white text-black px-6 py-2 rounded-lg font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              <Save size={16} /> {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          )}
        </div>

        <div className="p-8 space-y-10">

          {/* SEÇÃO 1 — INFORMAÇÕES DA LOJA */}
          <section>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-xl">🏪</span> Informações da Loja
            </h3>
            <div className="space-y-4 bg-zinc-800/50 p-6 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Nome da Loja *" error={errors.storeName}>
                  <input type="text" value={settings.storeName} onChange={e => handleChange('storeName', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Email Principal *" error={errors.storeEmail}>
                  <input type="email" value={settings.storeEmail} onChange={e => handleChange('storeEmail', e.target.value)} className={inputCls} />
                </Field>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Telefone">
                  <input type="tel" value={settings.phone} onChange={e => handleChange('phone', e.target.value)} className={inputCls} placeholder="+55 11 99999-9999" />
                </Field>
                <Field label="CNPJ">
                  <input type="text" value={settings.cnpj} onChange={e => handleChange('cnpj', e.target.value)} className={inputCls} placeholder="00.000.000/0000-00" />
                </Field>
              </div>
              <Field label="Endereço">
                <input type="text" value={settings.address} onChange={e => handleChange('address', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Descrição Curta da Marca">
                <textarea value={settings.descricaoMarca} onChange={e => handleChange('descricaoMarca', e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="Ex: Streetwear autoral de São Paulo" />
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="WhatsApp">
                  <input type="tel" value={settings.whatsapp} onChange={e => handleChange('whatsapp', e.target.value)} className={inputCls} placeholder="+55 11 99999-9999" />
                </Field>
                <Field label="Instagram">
                  <input type="text" value={settings.instagram} onChange={e => handleChange('instagram', e.target.value)} className={inputCls} placeholder="@surface" />
                </Field>
              </div>
              <Field label="Política de Atendimento">
                <textarea value={settings.politicaAtendimento} onChange={e => handleChange('politicaAtendimento', e.target.value)} rows={3} className={`${inputCls} resize-none`} placeholder="Horário de atendimento, prazos de resposta..." />
              </Field>
            </div>
          </section>

          {/* SEÇÃO 2 — OPERAÇÃO DA LOJA */}
          <section>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><span className="text-xl">⚙️</span> Operação da Loja</h3>
            <div className="space-y-4 bg-zinc-800/50 p-6 rounded-lg">
              {/* Toggle Loja Ativa */}
              <div className={`p-4 rounded-lg border-2 ${settings.lojaAtiva ? 'bg-emerald-950/50 border-emerald-800' : 'bg-red-950/50 border-red-800'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">{settings.lojaAtiva ? 'Loja Ativa' : 'Loja Desativada'}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {settings.lojaAtiva ? 'Aceitando pedidos normalmente.' : 'Em manutenção. Clientes verão indisponibilidade.'}
                    </p>
                  </div>
                  <button onClick={() => setConfirmToggle(true)}
                    className={`px-5 py-2 rounded-lg font-bold text-sm transition-all ${settings.lojaAtiva ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-600 text-white hover:bg-green-700'}`}>
                    <Power size={14} className="inline mr-1" />{settings.lojaAtiva ? 'Desativar' : 'Ativar'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Frete Padrão (R$)">
                  <input type="number" min="0" step="0.01" value={settings.shippingFee} onChange={e => handleChange('shippingFee', parseFloat(e.target.value) || 0)} className={inputCls} />
                </Field>
                <Field label="Frete Grátis Acima de (R$)">
                  <input type="number" min="0" step="0.01" value={settings.freeShippingAbove} onChange={e => handleChange('freeShippingAbove', parseFloat(e.target.value) || 0)} className={inputCls} />
                </Field>
                <Field label="Moeda">
                  <select value={settings.currency} onChange={e => handleChange('currency', e.target.value)} className={inputCls}>
                    <option value="BRL">Real (BRL)</option>
                    <option value="USD">Dólar (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Prazo Estimado de Envio">
                  <input type="text" value={settings.prazoEnvio} onChange={e => handleChange('prazoEnvio', e.target.value)} className={inputCls} placeholder="Ex: 3 a 7 dias úteis" />
                </Field>
                <Field label="Métodos de Pagamento">
                  <div className="flex flex-wrap gap-3 mt-1">
                    {['Cartão de Crédito', 'PIX', 'Boleto', 'Transferência'].map(m => (
                      <label key={m} className="flex items-center gap-1.5 cursor-pointer text-sm">
                        <input type="checkbox" checked={settings.paymentMethods.includes(m)}
                          onChange={e => {
                            handleChange('paymentMethods', e.target.checked
                              ? [...settings.paymentMethods, m]
                              : settings.paymentMethods.filter(x => x !== m));
                          }} className="w-4 h-4" />
                        {m}
                      </label>
                    ))}
                  </div>
                </Field>
              </div>

              <Field label="Mensagem Padrão do Checkout WhatsApp">
                <textarea value={settings.msgCheckoutWhatsapp} onChange={e => handleChange('msgCheckoutWhatsapp', e.target.value)} rows={3} className={`${inputCls} resize-none`}
                  placeholder="Olá! Gostaria de finalizar meu pedido: {itens}" />
              </Field>
            </div>
          </section>

          {/* SEÇÃO 3 — COMERCIAL */}
          <section>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><span className="text-xl">💼</span> Comercial</h3>
            <div className="space-y-4 bg-zinc-800/50 p-6 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Email Comercial" error={errors.emailComercial}>
                  <input type="email" value={settings.emailComercial} onChange={e => handleChange('emailComercial', e.target.value)} className={inputCls} placeholder="comercial@surface.com" />
                </Field>
                <Field label="Telefone Comercial">
                  <input type="tel" value={settings.telefoneComercial} onChange={e => handleChange('telefoneComercial', e.target.value)} className={inputCls} />
                </Field>
                <Field label="WhatsApp de Vendas">
                  <input type="tel" value={settings.whatsappVendas} onChange={e => handleChange('whatsappVendas', e.target.value)} className={inputCls} />
                </Field>
              </div>
              <Field label="Texto Institucional">
                <textarea value={settings.textoInstitucional} onChange={e => handleChange('textoInstitucional', e.target.value)} rows={3} className={`${inputCls} resize-none`}
                  placeholder="Texto curto para usar em automações, emails, rodapé..." />
              </Field>
            </div>
          </section>

          {/* SEÇÃO 4 — SISTEMA */}
          <section>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><span className="text-xl">🔧</span> Sistema</h3>
            <div className="bg-zinc-800/50 p-6 rounded-lg space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">Última atualização</span>
                <span className="font-mono font-bold">
                  {settings.atualizadoEm ? new Date(settings.atualizadoEm).toLocaleString('pt-BR') : '—'}
                </span>
              </div>
              <div className="border-t border-zinc-700 pt-3">
                <p className="text-xs text-zinc-500">Integrações futuras preparadas:</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['Pagamento (Stripe/MP)', 'Email (SendGrid)', 'Nota Fiscal (NF-e)', 'Logística'].map(i => (
                    <span key={i} className="text-[10px] font-bold px-3 py-1 bg-zinc-700 text-zinc-400 rounded-full">{i}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* MODAIS */}
      <AlertModal isOpen={confirmToggle} onClose={() => setConfirmToggle(false)}
        title={settings.lojaAtiva ? 'Desativar loja?' : 'Ativar loja?'}
        message={settings.lojaAtiva ? 'A loja ficará em modo manutenção.' : 'A loja voltará ao ar normalmente.'}
        type={settings.lojaAtiva ? 'warning' : 'info'} actionLabel={settings.lojaAtiva ? 'Desativar' : 'Ativar'}
        actionCallback={handleToggleStore} />

      <AlertModal isOpen={confirmSave} onClose={() => setConfirmSave(false)}
        title="Salvar alterações" message="Deseja salvar as alterações nas configurações?"
        type="info" actionLabel="Salvar"
        actionCallback={() => { handleSave(); setConfirmSave(false); }} />

      <AlertModal isOpen={saved} onClose={() => setSaved(false)}
        title="Sucesso" message="Configurações salvas com sucesso." type="success" />

      <AlertModal isOpen={saveError} onClose={() => setSaveError(false)}
        title="Erro" message="Não foi possível salvar as configurações. Tente novamente." type="error" />
    </div>
  );
}
