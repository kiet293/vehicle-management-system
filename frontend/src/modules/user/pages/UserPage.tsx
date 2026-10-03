import React from 'react';
import { Users } from 'lucide-react';

export const UserPage: React.FC = () => {
  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <Users size={24} color="var(--accent-blue)" />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>User Management</h2>
      </div>
      <p style={{ color: 'var(--text-muted)' }}>
        User module placeholder. Ready for TV1 implementation.
      </p>
    </div>
  );
};

export default UserPage;
