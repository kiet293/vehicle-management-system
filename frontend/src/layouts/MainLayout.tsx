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

  interface PageInfo {
    title: string;
    subtitle: string;
  }

  const getPageInfo = (path: string): PageInfo => {
    if (path === '/') {
      return {
        title: 'Tổng quan Báo cáo & Hiệu suất',
        subtitle: 'Chỉ số đo lường hiệu suất (KPI), biến động chi phí 12 tháng và cơ cấu tài chính',
      };
    }
    if (path.startsWith('/vehicles')) {
      return {
        title: 'Quản lý Đội xe Doanh nghiệp',
        subtitle: 'Hồ sơ kỹ thuật, danh mục phương tiện, trạng thái vận hành và bảo dưỡng',
      };
    }
    if (path.startsWith('/costs')) {
      return {
        title: 'Kê khai & Chi phí Vận hành',
        subtitle: 'Theo dõi chi phí nhiên liệu, vé cầu đường, bảo dưỡng định kỳ và đối soát minh bạch',
      };
    }
    if (path.startsWith('/users')) {
      return {
        title: 'Quản lý Nhân sự & Phân quyền',
        subtitle: 'Danh sách cán bộ điều phối, hồ sơ tài xế, bằng lái và phân quyền hệ thống',
      };
    }
    if (path.startsWith('/emails')) {
      return {
        title: 'Nhật ký Cảnh báo & Thông báo Email',
        subtitle: 'Tự động gửi cảnh báo bảo dưỡng, thông báo sự cố và lịch sử gửi thư',
      };
    }
    if (path.startsWith('/profile')) {
      return {
        title: 'Hồ sơ Cá nhân & Cài đặt',
        subtitle: 'Thông tin tài khoản, giấy phép lái xe và cập nhật mật khẩu bảo mật',
      };
    }
    return {
      title: 'Hệ thống Quản lý Đội xe VMS',
      subtitle: 'Hệ thống quản lý đội xe phân tán Cloud VMS',
    };
  };

  const pageInfo = getPageInfo(currentPath);

  const handleToggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setIsOpenMobile((prev) => !prev);
    } else {
      toggleCollapse();
    }
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
          onToggleSidebar={handleToggleSidebar}
          isSidebarCollapsed={isCollapsed}
          pageTitle={pageInfo.title}
          pageSubtitle={pageInfo.subtitle}
        />

        <main className="vms-main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
