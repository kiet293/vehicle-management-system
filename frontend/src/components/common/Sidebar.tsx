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
  X,
  User,
} from 'lucide-react';

interface SidebarProps {
  currentPath: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenProfile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isOpenMobile,
  onCloseMobile,
  onOpenProfile,
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
    {
      path: '/profile',
      label: 'Hồ sơ cá nhân',
      icon: <User size={20} />,
      roles: ['ADMIN', 'MANAGER', 'DRIVER'],
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
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          className="vms-sidebar-backdrop"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`vms-sidebar ${isCollapsed ? 'collapsed' : ''} ${isOpenMobile ? 'mobile-open' : ''}`}
      >
        {/* Brand Area */}
        <div
          style={{
            padding: isCollapsed && !isOpenMobile ? '1.25rem 0.5rem' : '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-color)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed && !isOpenMobile ? 'center' : 'flex-start',
              gap: '0.75rem',
              cursor: 'pointer',
              flex: 1,
              minWidth: 0,
            }}
            onClick={() => handleNavigate(user?.role === 'DRIVER' ? '/vehicles' : '/')}
            title="VMS Fleet"
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
            {(!isCollapsed || isOpenMobile) && (
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

          {/* Close button inside mobile drawer */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="btn btn-secondary btn-icon hide-desktop"
            style={{ width: '32px', height: '32px', flexShrink: 0 }}
            title="Đóng menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav
          style={{
            padding: isCollapsed && !isOpenMobile ? '1rem 0.5rem' : '1rem 0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.375rem',
            flex: 1,
            overflowY: 'auto',
            minHeight: 0,
          }}
        >
          {visibleItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => handleNavigate(item.path)}
                title={isCollapsed && !isOpenMobile ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed && !isOpenMobile ? 'center' : 'flex-start',
                  gap: isCollapsed && !isOpenMobile ? 0 : '0.75rem',
                  padding: isCollapsed && !isOpenMobile ? '0.625rem 0' : '0.625rem 0.875rem',
                  borderRadius: '10px',
                  color: isActive ? 'var(--accent-blue)' : 'var(--text-muted)',
                  background: isActive ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.12) 100%)' : 'transparent',
                  border: isActive ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.875rem',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'var(--bg-btn-secondary)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ color: isActive ? 'var(--accent-blue)' : 'inherit', flexShrink: 0 }}>
                  {item.icon}
                </div>
                {(!isCollapsed || isOpenMobile) && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User Card & Collapse Toggle */}
        <div style={{ borderTop: '1px solid var(--border-color)', padding: isCollapsed && !isOpenMobile ? '0.75rem 0.5rem' : '0.75rem', flexShrink: 0, marginTop: 'auto' }}>
          {user && (!isCollapsed || isOpenMobile) && (
            <div
              onClick={() => {
                if (onOpenProfile) onOpenProfile();
                else handleNavigate('/profile');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.5rem',
                borderRadius: '8px',
                background: 'var(--bg-user-card)',
                marginBottom: '0.5rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Bấm để xem và chỉnh sửa hồ sơ tài khoản"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-btn-secondary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--bg-user-card)';
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

          {user && isCollapsed && !isOpenMobile && (
            <div
              onClick={() => {
                if (onOpenProfile) onOpenProfile();
                else handleNavigate('/profile');
              }}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'rgba(59, 130, 246, 0.2)',
                color: 'var(--accent-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.875rem',
                margin: '0 auto 0.5rem auto',
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
              }}
              title={`Hồ sơ cá nhân: ${user.fullName} (${user.role})`}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: isCollapsed && !isOpenMobile ? 'column' : 'row', gap: '0.375rem' }}>
            <button
              onClick={onToggleCollapse}
              className="btn btn-secondary hide-mobile"
              style={{ flex: 1, padding: '0.5rem', justifyContent: 'center' }}
              title={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            <button
              onClick={logout}
              className="btn btn-danger"
              style={{ flex: 1, padding: '0.5rem', justifyContent: 'center' }}
              title="Đăng xuất"
            >
              <LogOut size={18} />
              {isOpenMobile && <span style={{ fontSize: '0.8125rem' }}>Đăng xuất</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
