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
  Sun,
  Moon,
  CheckCheck,
  CheckCircle2,
  Car,
  Wrench,
  TrendingUp,
  RotateCcw,
  Trash2,
  MoreHorizontal,
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
  const [showOptions, setShowOptions] = useState(false);
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
        setShowOptions(false);
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
    setShowOptions(false);
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
    setShowOptions(false);
  };

  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await notificationService.deleteNotification(id);
  };

  const handleClearAll = async () => {
    if (!user) return;
    if (window.confirm('Bạn có chắc chắn muốn xóa tất cả thông báo không?')) {
      setNotifications([]);
      setShowOptions(false);
      await notificationService.clearAllNotifications(user.id, user.email, user.role);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
      if (diff < 60) return 'Vừa xong';
      if (diff < 3600) return `${Math.floor(diff / 60)} phút`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} giờ`;
      const days = Math.floor(diff / 86400);
      if (days < 7) return `${days} ngày`;
      return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  interface NotificationGroup {
    id: 'new' | 'today' | 'earlier';
    title: string;
    items: AppNotification[];
  }

  const getNotificationGroups = (items: AppNotification[]): NotificationGroup[] => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const groups: NotificationGroup[] = [
      { id: 'new', title: 'Mới', items: [] },
      { id: 'today', title: 'Hôm nay', items: [] },
      { id: 'earlier', title: 'Trước đó', items: [] },
    ];

    items.forEach((item) => {
      try {
        const itemTime = new Date(item.createdAt).getTime();
        const diffHours = (now.getTime() - itemTime) / (1000 * 60 * 60);

        // Mới: Trong vòng 2 giờ qua
        if (diffHours < 2) {
          groups[0].items.push(item);
        } else if (itemTime >= todayStart) {
          // Hôm nay: Trong ngày hôm nay
          groups[1].items.push(item);
        } else {
          // Trước đó: Trước ngày hôm nay
          groups[2].items.push(item);
        }
      } catch {
        groups[2].items.push(item);
      }
    });

    return groups.filter((g) => g.items.length > 0);
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
                width: '400px',
                maxWidth: '92vw',
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
                  padding: '1rem 1rem 0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                    Thông báo
                  </h3>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: 'var(--accent-blue)',
                      }}
                    >
                      {unreadCount} chưa đọc
                    </span>
                  )}
                </div>

                {/* More options menu (...) */}
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setShowOptions((prev) => !prev)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      border: 'none',
                      background: showOptions ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.06)',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    title="Tùy chọn thông báo"
                    aria-label="Tùy chọn thông báo"
                  >
                    <MoreHorizontal size={18} />
                  </button>

                  {showOptions && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        right: 0,
                        width: '210px',
                        background: 'var(--bg-modal)',
                        border: '1px solid var(--border-modal)',
                        borderRadius: '12px',
                        boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
                        zIndex: 120,
                        padding: '6px',
                        animation: 'fadeIn 0.15s ease',
                      }}
                    >
                      <button
                        type="button"
                        onClick={handleMarkAllAsRead}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 10px',
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--text-main)',
                          fontSize: '0.8125rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <CheckCheck size={16} color="var(--accent-blue)" /> Đánh dấu đã đọc hết
                      </button>

                      <button
                        type="button"
                        onClick={handleClearAll}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 10px',
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--accent-rose)',
                          fontSize: '0.8125rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(244, 63, 94, 0.12)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <Trash2 size={16} /> Xóa tất cả thông báo
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Tabs: Tất cả / Chưa đọc dạng pill Facebook */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0 1rem 0.75rem',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setFilterTab('all')}
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    borderRadius: '9999px',
                    border: 'none',
                    cursor: 'pointer',
                    background: filterTab === 'all' ? 'var(--accent-blue)' : 'rgba(255, 255, 255, 0.08)',
                    color: filterTab === 'all' ? '#ffffff' : 'var(--text-muted)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('unread')}
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    borderRadius: '9999px',
                    border: 'none',
                    cursor: 'pointer',
                    background: filterTab === 'unread' ? 'var(--accent-blue)' : 'rgba(255, 255, 255, 0.08)',
                    color: filterTab === 'unread' ? '#ffffff' : 'var(--text-muted)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Chưa đọc{unreadCount > 0 ? ` (${unreadCount})` : ''}
                </button>
              </div>

              {/* Notification list grouped by time: Mới, Hôm nay, Trước đó */}
              <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
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
                  getNotificationGroups(displayedNotifications).map((group) => (
                    <div key={group.id} style={{ marginBottom: '4px' }}>
                      {/* Tiêu đề nhóm thời gian: Mới / Hôm nay / Trước đó */}
                      <div
                        style={{
                          padding: '0.75rem 1rem 0.35rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.9375rem',
                            fontWeight: 700,
                            color: 'var(--text-main)',
                            letterSpacing: '-0.01em',
                          }}
                        >
                          {group.title}
                        </span>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>
                          {group.items.length} thông báo
                        </span>
                      </div>

                      {/* Danh sách thông báo trong nhóm */}
                      {group.items.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleMarkAsRead(item)}
                          style={{
                            padding: '0.75rem 1rem',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            cursor: 'pointer',
                            background: item.read ? 'transparent' : 'rgba(59, 130, 246, 0.05)',
                            position: 'relative',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
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
                                fontSize: '0.8125rem',
                                fontWeight: item.read ? 500 : 700,
                                color: item.read ? 'var(--text-muted)' : 'var(--text-main)',
                                lineHeight: 1.35,
                                marginBottom: '2px',
                              }}
                            >
                              {item.title}
                            </div>

                            <p
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-dim)',
                                margin: '0 0 4px 0',
                                lineHeight: 1.35,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {item.message}
                            </p>

                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.75rem',
                              }}
                            >
                              <span
                                style={{
                                  color: 'var(--accent-blue)',
                                  fontWeight: 600,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                }}
                              >
                                {formatTimeAgo(item.createdAt)}
                              </span>

                              {item.vehiclePlate && (
                                <span
                                  className="mono"
                                  style={{
                                    fontSize: '0.6875rem',
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

                          {/* Action bên phải: Dấu chấm chưa đọc & Nút Xóa thông báo */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              flexShrink: 0,
                            }}
                          >
                            {!item.read && (
                              <span
                                style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  background: 'var(--accent-blue)',
                                  boxShadow: '0 0 6px rgba(59, 130, 246, 0.8)',
                                }}
                                title="Chưa đọc"
                              />
                            )}

                            <button
                              type="button"
                              onClick={(e) => handleDeleteNotification(item.id, e)}
                              title="Xóa thông báo này"
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '6px',
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--text-dim)',
                                display: 'flex',
                                alignItems: 'center',
                                justifySelf: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = 'var(--accent-rose)';
                                e.currentTarget.style.background = 'rgba(244, 63, 94, 0.15)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'var(--text-dim)';
                                e.currentTarget.style.background = 'transparent';
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
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
