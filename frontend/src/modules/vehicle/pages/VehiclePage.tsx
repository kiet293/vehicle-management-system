import React from 'react';
import { Car } from 'lucide-react';

export const VehiclePage: React.FC = () => {
  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <Car size={24} color="var(--accent-cyan)" />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Vehicle Fleet Management</h2>
      </div>
      <p style={{ color: 'var(--text-muted)' }}>
        Vehicle module placeholder. Ready for TV2 implementation.
      </p>
    </div>
  );
};

export default VehiclePage;
