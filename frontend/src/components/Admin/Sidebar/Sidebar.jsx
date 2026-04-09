import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  ShoppingBag,
  Package,
  Layers,
  Tag,
  Zap,
  Users,
  BarChart3,
  Palette,
  Settings,
  Shield,
  X,
  ExternalLink,
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, active, onClick, theme }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg mb-1 ${
      active
        ? theme === 'light'
          ? 'bg-black text-white'
          : 'bg-white text-black'
        : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
    }`}
  >
    <Icon size={18} />
    {label}
  </button>
);

export default function Sidebar({
  activeTab,
  setActiveTab,
  mobile = false,
  isOpen = true,
  onClose = () => {},
  theme = 'dark',
}) {
  const navigate = useNavigate();

  const menuGroups = [
    {
      title: 'PRINCIPAL',
      items: [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Visao Geral' },
        { id: 'sales', icon: ShoppingCart, label: 'Vendas' },
        { id: 'in-person-sales', icon: ShoppingBag, label: 'Venda Presencial' },
      ],
    },
    {
      title: 'CATALOGO',
      items: [
        { id: 'products', icon: Package, label: 'Produtos' },
        { id: 'collections', icon: Layers, label: 'Drops e Colecoes' },
        { id: 'categories', icon: Tag, label: 'Categorias' },
        { id: 'inventory', icon: Zap, label: 'Estoque' },
      ],
    },
    {
      title: 'NEGOCIO',
      items: [
        { id: 'customers', icon: Users, label: 'Clientes' },
        { id: 'analytics', icon: BarChart3, label: 'Analytics' },
      ],
    },
    {
      title: 'GERENCIAL',
      items: [
        { id: 'customization', icon: Palette, label: 'Customizacao' },
        { id: 'settings', icon: Settings, label: 'Configuracoes' },
        { id: 'admin', icon: Shield, label: 'Admin' },
      ],
    },
  ];

  if (mobile) {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <aside className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col h-screen overflow-y-auto">
          <div className="p-4 flex items-center justify-between border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-xs">S</span>
              </div>
              <h1 className="text-lg font-black tracking-tighter uppercase text-white">Surface</h1>
            </div>
            <button onClick={onClose} className="p-2 text-zinc-400">
              <X />
            </button>
          </div>

          <div className="p-6">
            <nav className="space-y-6">
              {menuGroups.map((group) => (
                <div key={group.title}>
                  <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">
                    {group.title}
                  </h3>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <SidebarItem
                        key={item.id}
                        icon={item.icon}
                        label={item.label}
                        active={activeTab === item.id}
                        theme={theme}
                        onClick={() => {
                          setActiveTab(item.id);
                          onClose();
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          <div className="mt-auto p-6 border-t border-zinc-800">
            <button
              onClick={() => {
                onClose();
                navigate('/');
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg mb-4 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all duration-200"
            >
              <ExternalLink size={18} />
              Ver Loja
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-zinc-600 to-zinc-700 rounded-full" />
              <div className="flex-1">
                <p className="text-sm font-bold text-zinc-200">Admin Surface</p>
                <p className="text-[10px] text-zinc-500">admin@surface.co</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    );
  }

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col fixed h-screen z-10 overflow-y-auto">
      <div className="p-8">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-black font-bold text-xs">S</span>
          </div>
          <h1 className="text-lg font-black tracking-tighter uppercase text-white">Surface Admin</h1>
        </div>

        <nav className="space-y-6">
          {menuGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <SidebarItem
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    active={activeTab === item.id}
                    theme={theme}
                    onClick={() => setActiveTab(item.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-8 border-t border-zinc-800">
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg mb-4 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all duration-200"
        >
          <ExternalLink size={18} />
          Ver Loja
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-zinc-600 to-zinc-700 rounded-full" />
          <div className="flex-1">
            <p className="text-sm font-bold text-zinc-200">Admin Surface</p>
            <p className="text-[10px] text-zinc-500">admin@surface.co</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
