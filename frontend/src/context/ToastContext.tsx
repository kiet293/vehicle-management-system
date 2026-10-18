import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { useTheme } from './ThemeContext';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, durationMs?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useTheme();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, message: string, durationMs = 3500) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      removeToast(id);
    }, durationMs);
  }, [removeToast]);

  const isLight = theme === 'light';

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div
        className="toast-container"
        style={{
          position: 'fixed',
          top: '1.25rem',
          right: '1.25rem',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          pointerEvents: 'none',
          maxWidth: '420px',
          width: 'calc(100% - 2.5rem)',
        }}
      >
        {toasts.map((toast) => {
          const config = {
            success: {
              color: '#10b981',
              bg: isLight ? '#ffffff' : '#0f172a',
              border: isLight ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(16, 185, 129, 0.4)',
              accentBg: isLight ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.18)',
              icon: <CheckCircle2 size={18} color="#10b981" />,
              title: 'Thành công',
            },
            error: {
              color: '#ef4444',
              bg: isLight ? '#ffffff' : '#0f172a',
              border: isLight ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(239, 68, 68, 0.4)',
              accentBg: isLight ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.18)',
              icon: <AlertCircle size={18} color="#ef4444" />,
              title: 'Thông báo lỗi',
            },
            warning: {
              color: '#f59e0b',
              bg: isLight ? '#ffffff' : '#0f172a',
              border: isLight ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(245, 158, 11, 0.4)',
              accentBg: isLight ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.18)',
              icon: <AlertTriangle size={18} color="#f59e0b" />,
              title: 'Cảnh báo',
            },
            info: {
              color: '#3b82f6',
              bg: isLight ? '#ffffff' : '#0f172a',
              border: isLight ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid rgba(59, 130, 246, 0.4)',
              accentBg: isLight ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.18)',
              icon: <Info size={18} color="#3b82f6" />,
              title: 'Thông tin',
            },
          }[toast.type];

          return (
            <div
              key={toast.id}
              role="alert"
              style={{
                pointerEvents: 'auto',
                background: config.bg,
                border: config.border,
                borderLeft: `4px solid ${config.color}`,
                padding: '0.875rem 1rem',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                boxShadow: isLight
                  ? '0 10px 25px -5px rgba(15, 23, 42, 0.14), 0 4px 10px rgba(15, 23, 42, 0.06)'
                  : '0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 0 15px rgba(0, 0, 0, 0.4)',
                animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  backgroundColor: config.accentBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '1px',
                }}
              >
                {config.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: config.color,
                    marginBottom: '2px',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {config.title}
                </div>
                <div
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: isLight ? '#1e293b' : '#f8fafc',
                    lineHeight: 1.45,
                    wordBreak: 'break-word',
                  }}
                >
                  {toast.message}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isLight ? '#64748b' : '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  flexShrink: 0,
                }}
                title="Đóng thông báo"
                aria-label="Đóng thông báo"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
