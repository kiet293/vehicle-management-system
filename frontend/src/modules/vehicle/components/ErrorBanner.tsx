import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBannerProps {
  message: string | null;
  onRetry: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onRetry }) => {
  if (!message) return null;

  return (
    <div
      style={{
        background: 'rgba(245, 158, 11, 0.15)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: '12px',
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: '#fbbf24',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <AlertTriangle size={20} />
        <span>{message}</span>
      </div>
      <button onClick={onRetry} className="btn btn-secondary btn-sm" style={{ borderColor: 'rgba(245, 158, 11, 0.4)' }}>
        <RotateCcw size={14} /> Thử lại
      </button>
    </div>
  );
};

export default ErrorBanner;