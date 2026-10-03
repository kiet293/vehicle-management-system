import React, { useState, useEffect } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { DashboardPage } from '../modules/report/pages/DashboardPage';
import { CostPage } from '../modules/cost/pages/CostPage';
import { VehiclePage } from '../modules/vehicle/pages/VehiclePage';
import { UserPage } from '../modules/user/pages/UserPage';
import { LayoutDashboard, DollarSign, Car, Users } from 'lucide-react';

type TabKey = 'dashboard' | 'cost' | 'vehicle' | 'user';

export const AppRoutes: React.FC = () => {
  const getInitialTab = (): TabKey => {
    const hash = window.location.hash.replace('#/', '').replace('#', '');
    if (hash === 'cost') return 'cost';
    if (hash === 'vehicle') return 'vehicle';
    if (hash === 'user') return 'user';
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState<TabKey>(getInitialTab);

  useEffect(() => {
    const handleHashChange = () => {
      setActiveTab(getInitialTab());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    window.location.hash = `#/${tab}`;
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; color: string }[] = [
    {
      key: 'dashboard',
      label: 'Tổng quan hệ thống',
      icon: <LayoutDashboard size={18} />,
      color: 'var(--accent-blue)'
    },
    {
      key: 'cost',
      label: 'Quản lý Chi phí (Cost)',
      icon: <DollarSign size={18} />,
      color: 'var(--accent-amber)'
    },
    {
      key: 'vehicle',
      label: 'Quản lý Đội xe (Vehicle)',
      icon: <Car size={18} />,
      color: 'var(--accent-cyan)'
    },
    {
      key: 'user',
      label: 'Tài khoản & Phân quyền (User)',
      icon: <Users size={18} />,
      color: 'var(--accent-purple)'
    }
  ];

  return (
    <MainLayout>
      {/* Navigation Sub-bar */}
      <div
        className="glass-panel"
        style={{
          padding: '0.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1.125rem',
                borderRadius: '10px',
                fontSize: '0.875rem',
                fontWeight: isActive ? 700 : 500,
                border: `1px solid ${isActive ? tab.color : 'transparent'}`,
                backgroundColor: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                color: isActive ? tab.color : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab View */}
      {activeTab === 'dashboard' && <DashboardPage />}
      {activeTab === 'cost' && <CostPage />}
      {activeTab === 'vehicle' && <VehiclePage />}
      {activeTab === 'user' && <UserPage />}
    </MainLayout>
  );
};

export default AppRoutes;
