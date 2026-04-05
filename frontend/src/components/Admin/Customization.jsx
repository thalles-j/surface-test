import React, { useState } from 'react';
import { Upload, Palette, Edit, Save } from 'lucide-react';

export default function Customization() {
  const [settings, setSettings] = useState({
    bannerTitle: 'Black Friday 2024',
    bannerSubtitle: 'Até 50% de desconto',
    primaryColor: '#000000',
    secondaryColor: '#FBFBFB',
    heroImage: 'Black Friday Banner',
    homeText: 'Bem-vindo à Surface - Streetwear Minimalista',
  });

  const [editing, setEditing] = useState(false);

  const handleSave = () => {
    setEditing(false);
    alert('Customizações atualizadas com sucesso!');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* PREVIEW */}
      <div className="bg-gradient-to-b from-zinc-800 to-zinc-900 p-12 rounded-xl border border-zinc-800 min-h-64">
        <div className="max-w-2xl mx-auto text-center">
          <div style={{ backgroundColor: settings.primaryColor }} className="p-8 rounded-lg mb-6 text-white">
            <h1 className="text-3xl font-bold mb-2">{settings.bannerTitle}</h1>
            <p className="text-lg">{settings.bannerSubtitle}</p>
          </div>
          <p className="text-zinc-400 mb-4">{settings.homeText}</p>
          <div className="aspect-video bg-zinc-700 rounded-lg flex items-center justify-center">
            <p className="text-zinc-400 font-bold">{settings.heroImage}</p>
          </div>
        </div>
      </div>

      {/* FORMULÁRIO */}
      <div className="bg-zinc-900 p-8 border border-zinc-800 rounded-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Editar Customizações</h2>
          <button
            onClick={() => setEditing(!editing)}
            className={`px-4 py-2 rounded-lg font-bold transition-colors ${editing
              ? 'bg-white text-black'
              : 'border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500'
              }`}
          >
            {editing ? 'Salvar Alterações' : 'Editar'}
          </button>
        </div>

        {editing ? (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 block text-zinc-300">Título do Banner</label>
              <input
                type="text"
                value={settings.bannerTitle}
                onChange={(e) => setSettings({ ...settings, bannerTitle: e.target.value })}
                className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg outline-none focus:border-zinc-500 text-white"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block text-zinc-300">Subtítulo</label>
              <input
                type="text"
                value={settings.bannerSubtitle}
                onChange={(e) => setSettings({ ...settings, bannerSubtitle: e.target.value })}
                className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg outline-none focus:border-zinc-500 text-white"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block text-zinc-300">Texto da Home</label>
              <textarea
                value={settings.homeText}
                onChange={(e) => setSettings({ ...settings, homeText: e.target.value })}
                rows="3"
                className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg outline-none focus:border-zinc-500 text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block text-zinc-300">Cor Primária</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    className="w-12 h-12 rounded-lg cursor-pointer border border-zinc-700"
                  />
                  <input
                    type="text"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    className="flex-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg outline-none focus:border-zinc-500 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block text-zinc-300">Cor Secundária</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.secondaryColor}
                    onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                    className="w-12 h-12 rounded-lg cursor-pointer border border-zinc-700"
                  />
                  <input
                    type="text"
                    value={settings.secondaryColor}
                    onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                    className="flex-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg outline-none focus:border-zinc-500 text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block text-zinc-300">Banner/Imagem Hero</label>
              <div className="flex items-center gap-2 border border-zinc-700 rounded-lg p-3 bg-zinc-800">
                <Upload size={18} className="text-zinc-500" />
                <input
                  type="file"
                  accept="image/*"
                  className="flex-1 text-zinc-400"
                />
              </div>
              <p className="text-xs text-zinc-500 mt-2">Recomendado: 1920x1080px</p>
            </div>

            <button
              onClick={handleSave}
              className="w-full bg-white text-black py-3 font-bold hover:bg-zinc-200 transition-colors rounded-lg flex items-center justify-center gap-2"
            >
              <Save size={18} /> Salvar Customizações
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-zinc-400">
            <div>
              <p className="text-sm font-bold mb-1 text-zinc-300">Título do Banner</p>
              <p>{settings.bannerTitle}</p>
            </div>
            <div>
              <p className="text-sm font-bold mb-1 text-zinc-300">Subtítulo</p>
              <p>{settings.bannerSubtitle}</p>
            </div>
            <div className="flex gap-4">
              <div>
                <p className="text-sm font-bold mb-1 text-zinc-300">Cor Primária</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded" style={{ backgroundColor: settings.primaryColor }}></div>
                  <p className="font-mono text-sm">{settings.primaryColor}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-bold mb-1 text-zinc-300">Cor Secundária</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded border border-zinc-700" style={{ backgroundColor: settings.secondaryColor }}></div>
                  <p className="font-mono text-sm">{settings.secondaryColor}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
