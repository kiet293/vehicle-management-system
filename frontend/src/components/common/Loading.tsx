import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingProps {
  message?: string;
  size?: number;
}

export const Loading: React.FC<LoadingProps> = ({ message = 'Loading...', size = 24 }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      gap: '0.75rem',
      color: 'var(--text-muted)'
    }}>
      <Loader2 size={size} className="animate-spin" color="var(--accent-blue)" />
      <span style={{ fontSize: '0.875rem' }}>{message}</span>
    </div>
  );
};
