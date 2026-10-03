import React from 'react';
import { Mail } from 'lucide-react';

export const EmailPage: React.FC = () => {
  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <Mail size={24} color="var(--accent-purple)" />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Notification & Email Service</h2>
      </div>
      <p style={{ color: 'var(--text-muted)' }}>
        Email module placeholder. Ready for TV4 implementation.
      </p>
    </div>
  );
};

export default EmailPage;
