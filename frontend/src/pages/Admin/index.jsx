import React, { useState } from 'react';
import { ExternalLink, LogOut, Menu } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import styles from './adminTheme.module.css';
import ThemeToggle from '../../components/ThemeToggle';

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
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [openCollectionsCreate, setOpenCollectionsCreate] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const displayName = user?.nome || 'Admin';
  const displayEmail = user?.email || '';

  const openCollectionsAndCreate = () => {
    setActiveTab('collections');
    setOpenCollectionsCreate(true);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/entrar'); // sem reload
    } catch (error) {
      console.error('Erro ao deslogar:', error);
    }
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
        return (
          <Collections
            openCreate={openCollectionsCreate}
            onCloseCreate={() => setOpenCollectionsCreate(false)}
          />
        );
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
    <div data-admin-theme={theme} className={`${styles.adminRoot} flex font-sans overflow-x-hidden`}>
      
      {/* Sidebar Desktop */}
      <div className="hidden xl:block">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Sidebar Mobile */}
      {mobileSidebarOpen && (
        <Sidebar
          mobile
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onClose={() => setMobileSidebarOpen(false)}
        />
      )}

      <main className={`${styles.adminMain} w-full xl:ml-64 flex-1 p-3 sm:p-5 lg:p-8 xl:p-10 2xl:p-12 overflow-x-hidden`}>
        
        {/* HEADER */}
        <div className={`${styles.hero} mb-6 sm:mb-8`}>
          
          <div className={styles.topActions}>
            
            {/* 🔥 CORREÇÃO AQUI */}
            <a
            href="/shop"
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.shopLink} text-sm font-semibold`}
          >
            <ExternalLink size={16} />
            Voltar para loja
          </a>

            <ThemeToggle className={styles.adminTopToggle} />
          </div>

          <div className="flex justify-between items-start sm:items-center gap-3 sm:gap-4">
            
            <div className="flex items-start gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className={`${styles.mobileMenuButton} xl:hidden p-2`}
                aria-label="Abrir menu"
              >
                <Menu size={18} />
              </button>

              <div className="min-w-0">
                <p className="admin-kpi-label mb-1">Admin Surface</p>
                <h2 className={`${styles.heroTitle} text-xl sm:text-3xl font-black uppercase tracking-tight break-words`}>
                  {getPageTitle()}
                </h2>
                <p className={`${styles.heroSubtitle} text-xs sm:text-sm font-medium mt-1`}>
                  Dados atualizados em tempo real com controles, análise e operação em um único painel.
                </p>
              </div>
            </div>

            {/* PERFIL */}
            <div className={`${styles.profileCard} gap-2 sm:gap-3 px-2.5 sm:px-3 py-2`}>
              <div className={styles.avatar} />

              <div className="min-w-0 hidden sm:block">
                <p className={`${styles.userName} text-xs font-bold truncate`}>
                  {displayName}
                </p>
                <p className={`${styles.userEmail} text-[11px] truncate`}>
                  {displayEmail}
                </p>
              </div>

              <button
                onClick={handleLogout}
                className={`${styles.logoutButton} ml-0.5 sm:ml-1 p-1 transition-colors`}
                title="Sair"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* CONTEÚDO */}
        {renderContent()}
      </main>
    </div>
  );
}