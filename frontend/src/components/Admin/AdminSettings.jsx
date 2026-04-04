import React, { useState } from 'react';
import { Save, HelpCircle } from 'lucide-react';
import AlertModal from '../AlertModal';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    storeName: 'Surface Streetwear',
    storeEmail: 'contato@surface.com',
    phone: '+55 11 99999-9999',
    address: 'São Paulo, SP',
    paymentMethods: ['Cartão de Crédito', 'PIX', 'Boleto'],
    shippingProvider: 'Correios',
    shippingFee: 15.00,
    freeShippingAbove: 200,
    currency: 'BRL',
    timezone: 'America/Sao_Paulo',
    language: 'pt-BR',
  });

  const [edited, setEdited] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChange = (field, value) => {
    setSettings({ ...settings, [field]: value });
    setEdited(true);
  };

  const handleSave = () => {
    setEdited(false);
    setSaved(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold">Configurações da Loja</h2>
          {edited && (
            <button
              onClick={() => setConfirmSave(true)}
              className="flex items-center gap-2 bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-zinc-800 transition-colors"
            >
              <Save size={16} /> Salvar Alterações
            </button>
          )}
        </div>

        <div className="p-8 space-y-8">
          {/* INFORMAÇÕES GERAIS */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-xl">🏪</span> Informações Gerais
            </h3>
            <div className="space-y-4 bg-gray-50 p-6 rounded-lg">
              <div>
                <label className="text-sm font-medium mb-2 block">Nome da Loja</label>
                <input
                  type="text"
                  value={settings.storeName}
                  onChange={(e) => handleChange('storeName', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-black"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Email</label>
                  <input
                    type="email"
                    value={settings.storeEmail}
                    onChange={(e) => handleChange('storeEmail', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Telefone</label>
                  <input
                    type="tel"
                    value={settings.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-black"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Endereço</label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-black"
                />
              </div>
            </div>
          </div>

          {/* PAGAMENTOS */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-xl">💳</span> Pagamentos
            </h3>
            <div className="space-y-4 bg-gray-50 p-6 rounded-lg">
              <div>
                <label className="text-sm font-medium mb-3 block">Métodos de Pagamento Aceitos</label>
                <div className="space-y-2">
                  {['Cartão de Crédito', 'PIX', 'Boleto', 'Transferência Bancária'].map((method) => (
                    <label key={method} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.paymentMethods.includes(method)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleChange('paymentMethods', [...settings.paymentMethods, method]);
                          } else {
                            handleChange('paymentMethods', settings.paymentMethods.filter(m => m !== method));
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium">{method}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* FRETE */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-xl">📦</span> Frete e Entrega
            </h3>
            <div className="space-y-4 bg-gray-50 p-6 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Provedor de Frete</label>
                  <select
                    value={settings.shippingProvider}
                    onChange={(e) => handleChange('shippingProvider', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-black bg-white"
                  >
                    <option>Correios</option>
                    <option>Sedex</option>
                    <option>Loggi</option>
                    <option>Logística Própria</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Taxa de Frete (R$)</label>
                  <input
                    type="number"
                    value={settings.shippingFee}
                    onChange={(e) => handleChange('shippingFee', parseFloat(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Frete Grátis Acima de (R$)</label>
                  <input
                    type="number"
                    value={settings.freeShippingAbove}
                    onChange={(e) => handleChange('freeShippingAbove', parseFloat(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-black"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* REGIONAIS */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-xl">🌍</span> Configurações Regionais
            </h3>
            <div className="space-y-4 bg-gray-50 p-6 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Moeda</label>
                  <select
                    value={settings.currency}
                    onChange={(e) => handleChange('currency', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-black bg-white"
                  >
                    <option value="BRL">Real (BRL)</option>
                    <option value="USD">Dólar (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Fuso Horário</label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => handleChange('timezone', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-black bg-white"
                  >
                    <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                    <option value="America/Rio_Branco">Rio Branco (GMT-5)</option>
                    <option value="America/Manaus">Manaus (GMT-4)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Idioma</label>
                  <select
                    value={settings.language}
                    onChange={(e) => handleChange('language', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-black bg-white"
                  >
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en-US">English</option>
                    <option value="es">Español</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Confirm Save Modal */}
      <AlertModal
        isOpen={confirmSave}
        onClose={() => setConfirmSave(false)}
        title="Salvar alterações"
        message="Deseja salvar as alterações nas configurações da loja?"
        type="info"
        actionLabel="Salvar"
        actionCallback={() => { handleSave(); setConfirmSave(false); }}
      />

      {/* Success */}
      <AlertModal
        isOpen={saved}
        onClose={() => setSaved(false)}
        title="Sucesso"
        message="Configurações salvas com sucesso."
        type="success"
      />
    </div>
  );
}
