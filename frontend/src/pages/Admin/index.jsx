import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import useAuth from '../../hooks/useAuth';

// Import Components
import Sidebar from '../../components/Admin/Sidebar';
import Dashboard from '../../components/Admin/Dashboard';
import Sales from '../../components/Admin/Sales';
import Products from '../../components/Admin/Products';
import Collections from '../../components/Admin/Collections';
import Categories from '../../components/Admin/Categories';
import Inventory from '../../components/Admin/Inventory';
import Customers from '../../components/Admin/Customers';
import Analytics from '../../components/Admin/Analytics';
import Customization from '../../components/Admin/Customization';
import AdminSettings from '../../components/Admin/AdminSettings';
import AdminPanel from '../../components/Admin/AdminPanel';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user, logout } = useAuth();
  const [openCollectionsCreate, setOpenCollectionsCreate] = useState(false);

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
    switch(activeTab) {
      case 'dashboard':
        return <Dashboard onCreateCollection={openCollectionsAndCreate} />;
      case 'sales':
        return <Sales />;
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
      products: 'Catálogo de Produtos',
      collections: 'Drops & Coleções',
      categories: 'Categorias',
      inventory: 'Gestão de Estoque',
      customers: 'Clientes',
      analytics: 'Relatórios e Dados',
      customization: 'Customização da Loja',
      settings: 'Configurações',
      admin: 'Painel Administrativo',
    };
    return titles[activeTab] || 'Painel de Controle';
  };

  return (
    <div className="min-h-screen bg-[#FBFBFB] flex font-sans text-black">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* MAIN CONTENT */}
      <main className="ml-64 flex-1 p-12">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight">
              {getPageTitle()}
            </h2>
            <p className="text-sm text-gray-400 font-medium mt-1">Dados atualizados em tempo real.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-gray-100">
              <div className="w-8 h-8 rounded-full bg-gray-300"></div>
              <div>
                <p className="text-xs font-bold">{displayName}</p>
                <p className="text-[11px] text-gray-400">{displayEmail}</p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
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