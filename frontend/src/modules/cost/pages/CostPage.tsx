import React from 'react';
import { DollarSign } from 'lucide-react';

export const CostPage: React.FC = () => {
  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <DollarSign size={24} color="var(--accent-amber)" />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Cost & Expense Management</h2>
      </div>
      <p style={{ color: 'var(--text-muted)' }}>
        Cost module placeholder. Ready for TV3 implementation.
      </p>
    </div>
  );
};

export default CostPage;
