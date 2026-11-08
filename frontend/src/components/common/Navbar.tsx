import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { notificationService } from '../../services/notificationService';
import { AppNotification } from '../../types';
import {
  Bell,
  Menu,
  Shield,
  UserCheck,
  Truck,
  ExternalLink,
  AlertTriangle,
  Clock,
  Sun,
  Moon,
  CheckCheck,
  CheckCircle2,
  Car,
  Wrench,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
  pageTitle?: string;
  pageSubtitle?: string;
  isSidebarCollapsed?: boolean;
  onOpenProfile?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  pageTitle = 'Dashboard',
  pageSubtitle,
  isSidebarCollapsed = false,
  onOpenProfile,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filterTab, setFilterTab] = useState<'all' | 'unread'>('all');
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await notificationService.getNotifications(user.id, user.email, user.role);
      setNotifications(data);
    } catch {
      // Bỏ qua lỗi mạng nền
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();

    // Polling định kỳ mỗi 12 giây
    const interval = setInterval(fetchNotifications, 12000);

    // Lắng nghe sự kiện cập nhật tức thì khi có hành động Giao xe / Thu hồi / Trả xe
    const handleRefresh = () => fetchNotifications();
    window.addEventListener('vms-notification-refresh', handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('vms-notification-refresh', handleRefresh);
    };
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsAlertOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (item: AppNotification) => {
    if (!item.read) {
      await notificationService.markAsRead(item.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
      );
    }
    setIsAlertOpen(false);
    if (item.type === 'HIGH_COST_ALERT') {
      navigate('/costs');
    } else {
      navigate('/vehicles');
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    await notificationService.markAllAsRead(user.id, user.email, user.role);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
      if (diff < 60) return 'Vừa xong';
      if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
      if (diff < 172800) return 'Hôm qua';
      return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  const renderNotificationIcon = (type: string) => {
    switch (type) {
      case 'VEHICLE_ASSIGNED':
        return (
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'rgba(59, 130, 246, 0.15)',
              color: 'var(--accent-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Car size={18} />
          </div>
        );
      case 'VEHICLE_REVOKED':
        return (
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'rgba(244, 63, 94, 0.15)',
              color: 'var(--accent-rose)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <RotateCcw size={18} />
          </div>
        );
      case 'VEHICLE_RETURNED':
        return (
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--accent-emerald)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <CheckCircle2 size={18} />
          </div>
        );
      case 'MAINTENANCE_ALERT':
        return (
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.15)',
              color: 'var(--accent-amber)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Wrench size={18} />
          </div>
        );
      case 'HIGH_COST_ALERT':
        return (
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'rgba(168, 85, 247, 0.15)',
              color: 'var(--accent-purple)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <TrendingUp size={18} />
          </div>
        );
      default:
        return (
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={18} />
          </div>
        );
    }
  };

  const displayedNotifications = notifications.filter((n) =>
    filterTab === 'unread' ? !n.read : true
  );

  const getRoleBadge = () => {
    if (!user) return null;
    if (user.role === 'ADMIN') {
      return (
        <span className="badge badge-purple" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Shield size={12} /> ADMIN
        </span>
      );
    }
    if (user.role === 'MANAGER') {
      return (
        <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <UserCheck size={12} /> MANAGER
        </span>
      );
    }
    return (
      <span className="badge badge-warning" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Truck size={12} /> TÀI XẾ
      </span>
    );
  };

  return (
    <header className="vms-navbar">
      <div className="vms-navbar-brand-col">
        {/* Toggle Sidebar Button */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="btn btn-secondary btn-icon"
          id="hamburger-btn"
          title={isSidebarCollapsed ? 'Mở rộng bảng chức năng' : 'Thu gọn bảng chức năng'}
          aria-label="Thu gọn hoặc mở rộng bảng chức năng"
        >
          <Menu size={20} />
        </button>

        <div style={{ minWidth: 0 }}>
          <h2 className="navbar-page-title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
            {pageTitle}
          </h2>
          <span className="navbar-subtitle" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            {pageSubtitle || 'Hệ thống quản lý đội xe phân tán Cloud VMS'}
          </span>
        </div>
      </div>

      <div className="vms-navbar-actions">
        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="btn btn-secondary btn-icon"
          title={theme === 'dark' ? 'Chuyển sang chế độ Sáng (Light mode)' : 'Chuyển sang chế độ Tối (Dark mode)'}
          aria-label="Đổi giao diện Sáng / Tối"
          style={{ transition: 'all 0.25s ease' }}
        >
          {theme === 'dark' ? (
            <Sun size={18} color="var(--accent-amber)" />
          ) : (
            <Moon size={18} color="var(--accent-purple)" />
          )}
        </button>

        {/* Notification Bell with Badge & Dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            onClick={() => setIsAlertOpen(!isAlertOpen)}
            className="btn btn-secondary btn-icon"
            style={{ position: 'relative' }}
            title="Thông báo & Điều phối xe"
            aria-label="Thông báo hệ thống"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  minWidth: '18px',
                  height: '18px',
                  padding: '0 4px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--accent-rose)',
                  color: '#ffffff',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 10px rgba(244, 63, 94, 0.6)',
                  border: '2px solid var(--bg-surface)',
                  animation: 'pulse 2s infinite',
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isAlertOpen && (
            <div
              className="glass-panel navbar-alert-dropdown"
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: '380px',
                background: 'var(--bg-modal)',
                border: '1px solid var(--border-modal)',
                borderRadius: '16px',
                boxShadow: '0 20px 45px rgba(0,0,0,0.45)',
                zIndex: 100,
                overflow: 'hidden',
                animation: 'slideUp 0.2s ease-out',
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: '1rem 1.125rem 0.75rem',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Thông báo
                  </span>
                  {unreadCount > 0 && (
                    <span className="badge badge-danger" style={{ fontSize: '0.6875rem', padding: '2px 6px' }}>
                      {unreadCount} mới
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="btn btn-secondary"
                    style={{
                      fontSize: '0.6875rem',
                      padding: '4px 8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      borderRadius: '8px',
                    }}
                    title="Đánh dấu tất cả là đã đọc"
                  >
                    <CheckCheck size={13} /> Đã đọc hết
                  </button>
                )}
              </div>

              {/* Tabs: Tất cả / Chưa đọc */}
              <div
                style={{
                  display: 'flex',
                  borderBottom: '1px solid var(--border-color)',
                  background: 'rgba(0, 0, 0, 0.1)',
                  padding: '4px 8px',
                  gap: '6px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setFilterTab('all')}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    background: filterTab === 'all' ? 'var(--bg-surface)' : 'transparent',
                    color: filterTab === 'all' ? 'var(--text-main)' : 'var(--text-dim)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Tất cả ({notifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('unread')}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    background: filterTab === 'unread' ? 'var(--bg-surface)' : 'transparent',
                    color: filterTab === 'unread' ? 'var(--accent-rose)' : 'var(--text-dim)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Chưa đọc ({unreadCount})
                </button>
              </div>

              {/* Notification list */}
              <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                {displayedNotifications.length === 0 ? (
                  <div
                    style={{
                      padding: '2.5rem 1rem',
                      textAlign: 'center',
                      color: 'var(--text-dim)',
                      fontSize: '0.8125rem',
                    }}
                  >
                    <div style={{ marginBottom: '8px', opacity: 0.5 }}>
                      <Bell size={28} style={{ margin: '0 auto' }} />
                    </div>
                    {filterTab === 'unread'
                      ? 'Tuyệt vời! Bạn không có thông báo chưa đọc nào.'
                      : 'Chưa có thông báo nào phát sinh.'}
                  </div>
                ) : (
                  displayedNotifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleMarkAsRead(item)}
                      style={{
                        padding: '0.875rem 1rem',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        cursor: 'pointer',
                        background: item.read ? 'transparent' : 'rgba(59, 130, 246, 0.05)',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)')}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = item.read
                          ? 'transparent'
                          : 'rgba(59, 130, 246, 0.05)')
                      }
                    >
                      {renderNotificationIcon(item.type)}

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '2px',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.8125rem',
                              fontWeight: item.read ? 600 : 700,
                              color: item.read ? 'var(--text-muted)' : 'var(--text-main)',
                              lineHeight: 1.3,
                            }}
                          >
                            {item.title}
                          </span>
                          {!item.read && (
                            <span
                              style={{
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                background: 'var(--accent-blue)',
                                flexShrink: 0,
                                marginLeft: '6px',
                              }}
                            />
                          )}
                        </div>

                        <p
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            margin: '0 0 4px 0',
                            lineHeight: 1.35,
                          }}
                        >
                          {item.message}
                        </p>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.6875rem',
                            color: 'var(--text-dim)',
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Clock size={11} />
                            {formatTimeAgo(item.createdAt)}
                          </span>
                          {item.vehiclePlate && (
                            <span
                              className="mono"
                              style={{
                                background: 'rgba(255, 255, 255, 0.07)',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                color: 'var(--accent-cyan)',
                              }}
                            >
                              {item.vehiclePlate}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: '0.625rem 1rem',
                  background: 'rgba(0, 0, 0, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>
                  Đồng bộ thời gian thực
                </span>
                {user && (user.role === 'ADMIN' || user.role === 'MANAGER') && (
                  <a
                    href="/emails"
                    onClick={() => setIsAlertOpen(false)}
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--accent-blue)',
                      textDecoration: 'none',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    Toàn bộ nhật ký <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Info & Badge */}
        {user && (
          <div
            onClick={() => {
              if (onOpenProfile) onOpenProfile();
              else navigate('/profile');
            }}
            role="button"
            tabIndex={0}
            title="Nhấn để xem & chỉnh sửa hồ sơ tài khoản"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (onOpenProfile) onOpenProfile();
                else navigate('/profile');
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.35rem 0.65rem',
              borderRadius: '9999px',
              cursor: 'pointer',
              transition: 'background 0.2s ease, border-color 0.2s ease',
              border: '1px solid transparent',
              userSelect: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-card-hover)';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <div style={{ textAlign: 'right' }}>
              <div className="navbar-user-name" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {user.fullName || user.username}
              </div>
              <div style={{ marginTop: '2px' }}>{getRoleBadge()}</div>
            </div>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-blue), #8b5cf6)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                fontWeight: 700,
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)',
                flexShrink: 0,
              }}
            >
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : (user.username ? user.username.charAt(0).toUpperCase() : 'U')}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
