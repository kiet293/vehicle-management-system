import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { emailService } from '../../modules/email/services/emailService';
import { EmailLog } from '../../types';
import {
  Bell,
  Menu,
  Shield,
  UserCheck,
  Truck,
  ExternalLink,
  AlertTriangle,
  Clock,
} from 'lucide-react';

interface NavbarProps {
  onToggleMobileMenu: () => void;
  pageTitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu, pageTitle = 'Dashboard' }) => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<EmailLog[]>([]);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    emailService.getLogs(30, 3)
      .then((data) => setAlerts(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsAlertOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    <header
      style={{
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'rgba(10, 14, 23, 0.85)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        padding: '0.75rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Mobile Hamburger */}
        <button
          onClick={onToggleMobileMenu}
          className="btn btn-secondary btn-icon"
          style={{ display: 'none' }}
          id="hamburger-btn"
        >
          <Menu size={20} />
        </button>

        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
            {pageTitle}
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Hệ thống quản lý đội xe phân tán Cloud VMS
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Notification Bell with Dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            onClick={() => setIsAlertOpen(!isAlertOpen)}
            className="btn btn-secondary btn-icon"
            style={{ position: 'relative' }}
            title="Cảnh báo & Thông báo"
          >
            <Bell size={18} />
            {alerts.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-rose)',
                  boxShadow: '0 0 8px var(--accent-rose)',
                }}
              />
            )}
          </button>

          {isAlertOpen && (
            <div
              className="glass-panel"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '360px',
                background: '#111827',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '16px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                zIndex: 100,
                overflow: 'hidden',
                animation: 'slideUp 0.2s ease-out',
              }}
            >
              <div
                style={{
                  padding: '0.875rem 1rem',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Cảnh báo gần đây
                </span>
                <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>
                  {alerts.length} mới
                </span>
              </div>

              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {alerts.length === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8125rem' }}>
                    Chưa có cảnh báo nào phát sinh. Đội xe đang vận hành ổn định.
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      style={{
                        padding: '0.875rem 1rem',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertTriangle size={14} color="var(--accent-amber)" />
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>
                          {alert.subject}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.3 }}>
                        {alert.content}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.25rem', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        <Clock size={12} />
                        <span>{new Date(alert.sentAt).toLocaleString('vi-VN')}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {user && (user.role === 'ADMIN' || user.role === 'MANAGER') && (
                <div style={{ padding: '0.625rem 1rem', background: 'rgba(0, 0, 0, 0.2)', textAlign: 'center' }}>
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
                    Xem toàn bộ nhật ký <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Info & Badge */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {user.fullName}
              </div>
              <div style={{ marginTop: '2px' }}>{getRoleBadge()}</div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
