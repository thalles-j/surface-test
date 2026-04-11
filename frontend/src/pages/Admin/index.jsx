import React, { useState } from 'react';
import { ExternalLink, LogOut, Menu } from 'lucide-react';
import useAuth from '../../hooks/useAuth';

import Sidebar from '../../components/Admin/Sidebar/Sidebar';
import Dashboard from '../../components/Admin/Dashboard/Dashboard';
import Sales from '../../components/Admin/Sales/Sales';
import Products from '../../components/Admin/Products/Products';
import Collections from '../../components/Admin/Collections/Collections';
import Categories from '../../components/Admin/Categories/Categories';
import Inventory from '../../components/Admin/Inventory/Inventory';
import Customers from '../../components/Admin/Customers/Customers';
import Analytics from '../../components/Admin/Analytics/Analytics';
import Customization from '../../components/Admin/Customization/Customization';
import AdminSettings from '../../components/Admin/AdminSettings/AdminSettings';
import AdminPanel from '../../components/Admin/AdminPanel/AdminPanel';
import InPersonSales from '../../components/Admin/InPersonSales/InPersonSales';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user, logout } = useAuth();
  const [openCollectionsCreate, setOpenCollectionsCreate] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const displayName = user?.nome || 'Admin';
  const displayEmail = user?.email || '';

  const openCollectionsAndCreate = () => {
    setActiveTab('collections');
    setOpenCollectionsCreate(true);
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/entrar';
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onCreateCollection={openCollectionsAndCreate} />;
      case 'sales':
        return <Sales />;
      case 'in-person-sales':
        return <InPersonSales />;
      case 'products':
        return <Products />;
      case 'collections':
        return <Collections openCreate={openCollectionsCreate} onCloseCreate={() => setOpenCollectionsCreate(false)} />;
      case 'categories':
        return <Categories />;
      case 'inventory':
        return <Inventory />;
      case 'customers':
        return <Customers />;
      case 'analytics':
        return <Analytics />;
      case 'customization':
        return <Customization />;
      case 'settings':
        return <AdminSettings />;
      case 'admin':
        return <AdminPanel />;
      default:
        return <Dashboard onCreateCollection={openCollectionsAndCreate} />;
    }
  };

  const getPageTitle = () => {
    const titles = {
      dashboard: 'Painel de Controle',
      sales: 'Gerenciar Vendas',
      'in-person-sales': 'Vendas Presenciais',
      products: 'Catalogo de Produtos',
      collections: 'Drops e Colecoes',
      categories: 'Categorias',
      inventory: 'Gestao de Estoque',
      customers: 'Clientes',
      analytics: 'Relatorios e Dados',
      customization: 'Customizacao da Loja',
      settings: 'Configuracoes',
      admin: 'Painel Administrativo',
    };
    return titles[activeTab] || 'Painel de Controle';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex font-sans text-white overflow-x-hidden">
      <div className="hidden xl:block">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {mobileSidebarOpen && (
        <Sidebar
          mobile
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onClose={() => setMobileSidebarOpen(false)}
        />
      )}

      <main className="w-full xl:ml-64 flex-1 p-3 sm:p-5 lg:p-8 xl:p-10 2xl:p-12 overflow-x-hidden">
        <div className="flex flex-col gap-4 mb-6 sm:mb-8">
          <a
            href="/shop"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 text-sm font-semibold"
          >
            <ExternalLink size={16} />
            Voltar para loja
          </a>

          <div className="flex justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex items-start gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="xl:hidden p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200"
              aria-label="Abrir menu"
            >
              <Menu size={18} />
            </button>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-3xl font-black uppercase tracking-tight break-words">
                {getPageTitle()}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-1">Dados atualizados em tempo real.</p>
            </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 bg-zinc-900 px-2.5 sm:px-3 py-2 rounded-lg border border-zinc-800 max-w-full">
              <div className="w-8 h-8 rounded-full bg-zinc-700 shrink-0" />
              <div className="min-w-0 hidden sm:block">
                <p className="text-xs font-bold text-zinc-200 truncate">{displayName}</p>
                <p className="text-[11px] text-zinc-500 truncate">{displayEmail}</p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-0.5 sm:ml-1 p-1 text-zinc-500 hover:text-red-400 transition-colors"
                title="Sair"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>

        {renderContent()}
      </main>
    </div>
  );
}
