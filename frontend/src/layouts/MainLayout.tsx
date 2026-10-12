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
    if (path.startsWith('/profile')) return 'Hồ sơ cá nhân & Cài đặt tài khoản';
    return 'Hệ thống Quản lý Đội xe VMS';
  };

  return (
    <div className="vms-layout-root">
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

      <div className="vms-content-column">
        <Navbar
          onToggleMobileMenu={() => setIsOpenMobile((prev) => !prev)}
          pageTitle={getPageTitle(currentPath)}
        />

        <main className="vms-main-content">
          {children}
        </main>

        <footer className="vms-footer">
          <div className="vms-footer-content">
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
