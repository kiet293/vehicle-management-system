import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
import { Navbar } from '../components/common/Navbar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('vms_sidebar_collapsed') === 'true';
  });
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);
  const location = useLocation();
  const currentPath = location.pathname;

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('vms_sidebar_collapsed', String(next));
      return next;
    });
  };

  const getPageTitle = (path: string): string => {
    if (path === '/') return 'Tổng quan Báo cáo & Hiệu suất';
    if (path.startsWith('/vehicles')) return 'Quản lý Hồ sơ & Đội xe Doanh nghiệp';
    if (path.startsWith('/costs')) return 'Kê khai & Đối soát Chi phí Vận hành';
    if (path.startsWith('/users')) return 'Quản lý Nhân sự & Phân quyền Tài xế';
    if (path.startsWith('/emails')) return 'Nhật ký Cảnh báo & Thông báo Email';
    return 'Hệ thống Quản lý Đội xe VMS';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', position: 'relative' }}>
      {/* Top subtle blue progress indicator */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'var(--gradient-brand)',
          zIndex: 99999,
        }}
      />

      <Sidebar
        currentPath={currentPath}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg-primary)' }}>
        <Navbar
          onToggleMobileMenu={() => setIsOpenMobile((prev) => !prev)}
          pageTitle={getPageTitle(currentPath)}
        />

        <main style={{ flex: 1, padding: '2rem', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
          {children}
        </main>

        <footer
          style={{
            borderTop: '1px solid var(--border-color)',
            padding: '1.25rem 2rem',
            backgroundColor: 'rgba(10, 14, 23, 0.95)',
            marginTop: 'auto',
          }}
        >
          <div
            style={{
              maxWidth: '1440px',
              margin: '0 auto',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.8125rem',
              color: 'var(--text-dim)',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              Vehicle Management System (VMS) • Cloud Computing & Microservices Architecture
            </div>
            <div>
              Spring Boot 3.3.4 • Java 21 • React 18 • MySQL 8.0 • Docker Compose
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;
