import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Car,
  Receipt,
  Users,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  currentPath: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    {
      path: '/',
      label: 'Tổng quan',
      icon: <LayoutDashboard size={20} />,
      roles: ['ADMIN', 'MANAGER'],
    },
    {
      path: '/vehicles',
      label: 'Đội xe',
      icon: <Car size={20} />,
      roles: ['ADMIN', 'MANAGER', 'DRIVER'],
    },
    {
      path: '/costs',
      label: 'Chi phí vận hành',
      icon: <Receipt size={20} />,
      roles: ['ADMIN', 'MANAGER', 'DRIVER'],
    },
    {
      path: '/users',
      label: 'Nhân sự & Tài xế',
      icon: <Users size={20} />,
      roles: ['ADMIN', 'MANAGER'],
    },
    {
      path: '/emails',
      label: 'Nhật ký Cảnh báo',
      icon: <Bell size={20} />,
      roles: ['ADMIN', 'MANAGER'],
    },
  ];

  const visibleItems = navItems.filter((item) => {
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  const handleNavigate = (path: string) => {
    navigate(path);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 90,
          }}
        />
      )}

      <aside
        style={{
          width: isCollapsed ? '76px' : '260px',
          background: 'rgba(10, 14, 23, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 95,
          flexShrink: 0,
        }}
      >
        {/* Brand Area */}
        <div
          style={{
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            borderBottom: '1px solid var(--border-color)',
            cursor: 'pointer',
          }}
          onClick={() => handleNavigate(user?.role === 'DRIVER' ? '/vehicles' : '/')}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'var(--gradient-brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-glow)',
              flexShrink: 0,
            }}
          >
            <Car size={22} color="#ffffff" />
          </div>
          {!isCollapsed && (
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <h1 style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                VMS Fleet
              </h1>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', margin: 0 }}>
                Enterprise Cloud System
              </p>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav style={{ padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.375rem', flex: 1 }}>
          {visibleItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => handleNavigate(item.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.625rem 0.875rem',
                  borderRadius: '10px',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  background: isActive ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(139, 92, 246, 0.15) 100%)' : 'transparent',
                  border: isActive ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.875rem',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ color: isActive ? 'var(--accent-blue)' : 'inherit', flexShrink: 0 }}>
                  {item.icon}
                </div>
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User Card & Collapse Toggle */}
        <div style={{ borderTop: '1px solid var(--border-color)', padding: '0.75rem' }}>
          {user && !isCollapsed && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.5rem',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                marginBottom: '0.5rem',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: 'var(--accent-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                }}
              >
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {user.fullName}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                  {user.role}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.375rem' }}>
            <button
              onClick={onToggleCollapse}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '0.5rem', justifyContent: 'center' }}
              title={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            <button
              onClick={logout}
              className="btn btn-danger"
              style={{ padding: '0.5rem', justifyContent: 'center' }}
              title="Đăng xuất"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
