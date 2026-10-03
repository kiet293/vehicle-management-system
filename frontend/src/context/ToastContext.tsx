import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

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
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, message: string, durationMs = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      removeToast(id);
    }, durationMs);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div className="toast-container" style={{
        position: 'fixed',
        top: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        pointerEvents: 'none',
        maxWidth: '420px',
        width: 'calc(100% - 3rem)'
      }}>
        {toasts.map((toast) => {
          let bg = 'rgba(15, 23, 42, 0.95)';
          let border = '1px solid rgba(255, 255, 255, 0.1)';
          let icon = <Info size={18} color="var(--accent-blue)" />;

          if (toast.type === 'success') {
            border = '1px solid rgba(16, 185, 129, 0.4)';
            icon = <CheckCircle2 size={18} color="var(--accent-emerald)" />;
          } else if (toast.type === 'error') {
            border = '1px solid rgba(244, 63, 94, 0.4)';
            icon = <AlertCircle size={18} color="var(--accent-rose)" />;
          } else if (toast.type === 'warning') {
            border = '1px solid rgba(245, 158, 11, 0.4)';
            icon = <AlertTriangle size={18} color="var(--accent-amber)" />;
          }

          return (
            <div
              key={toast.id}
              className="glass-panel"
              style={{
                pointerEvents: 'auto',
                background: bg,
                border,
                padding: '0.875rem 1.125rem',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div style={{ flexShrink: 0 }}>{icon}</div>
              <div style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)', lineHeight: 1.4 }}>
                {toast.message}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} />
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
