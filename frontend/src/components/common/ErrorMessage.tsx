import React from 'react';
import { AlertCircle } from 'lucide-react';

export interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.875rem 1.25rem',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      borderRadius: '10px',
      color: '#f87171',
      fontSize: '0.875rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <AlertCircle size={18} />
        <span>{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn btn-secondary"
          style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}
        >
          Retry
        </button>
      )}
    </div>
  );
};
