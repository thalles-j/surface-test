import React, { useEffect, useState } from 'react';
import { LogOut, Menu, Moon, Sun } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { AdminThemeProvider, useAdminTheme } from '../../context/AdminThemeContext';
import './theme.css';

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

function AdminPageContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user, logout } = useAuth();
  const { theme, isLight, toggleTheme } = useAdminTheme();
  const [openCollectionsCreate, setOpenCollectionsCreate] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isCompactLayout, setIsCompactLayout] = useState(false);

  useEffect(() => {
    const updateViewport = () => {
      setIsCompactLayout(window.innerWidth < 1400);
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

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
        return <Dashboard />;
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
    <div className={`admin-theme admin-theme-${theme} min-h-screen flex font-sans`}>
      {!isCompactLayout && <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} theme={theme} />}
      {isCompactLayout && (
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          theme={theme}
          mobile
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />
      )}

      <main className="flex-1 p-12 admin-main-content">
        <div className="flex justify-between items-center mb-10 gap-4 admin-header-wrap">
          <div>
            {isCompactLayout && (
              <button
                className="admin-menu-btn mb-4"
                onClick={() => setMobileSidebarOpen((prev) => !prev)}
                title="Abrir menu"
              >
                <Menu size={18} />
                Menu
              </button>
            )}
            <h2 className="text-3xl font-black uppercase tracking-tight">{getPageTitle()}</h2>
            <p className="text-sm text-zinc-500 font-medium mt-1">Dados atualizados em tempo real.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="admin-theme-toggle px-3 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors flex items-center gap-2"
              title={`Alternar para modo ${isLight ? 'escuro' : 'claro'}`}
            >
              {isLight ? <Moon size={16} /> : <Sun size={16} />}
              <span className="text-xs font-bold uppercase tracking-wider">{isLight ? 'Dark' : 'Light'}</span>
            </button>

            <div className="flex items-center gap-3 bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-800">
              <div className="w-8 h-8 rounded-full bg-zinc-700" />
              <div>
                <p className="text-xs font-bold text-zinc-200">{displayName}</p>
                <p className="text-[11px] text-zinc-500">{displayEmail}</p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 p-1 text-zinc-500 hover:text-red-400 transition-colors"
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

export default function AdminPage() {
  return (
    <AdminThemeProvider>
      <AdminPageContent />
    </AdminThemeProvider>
  );
}
