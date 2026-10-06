import React from 'react';
import { Car, Plus } from 'lucide-react';

interface VehiclePageHeaderProps {
  canAdd: boolean;
  onAdd: () => void;
}

export const VehiclePageHeader: React.FC<VehiclePageHeaderProps> = ({ canAdd, onAdd }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'rgba(59, 130, 246, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-blue)',
        }}
      >
        <Car size={22} />
      </div>
      <div>
        <h2 style={{ fontSize: '1.375rem', fontWeight: 700, margin: 0 }}>
          Danh mục & Đội xe Doanh nghiệp
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
          Hồ sơ kỹ thuật, vòng đời trạng thái và công-tơ-mét vận hành
        </p>
      </div>
    </div>

    {canAdd && (
      <button onClick={onAdd} className="btn btn-primary" id="add-vehicle-btn">
        <Plus size={18} />
        <span>+ Thêm xe mới</span>
      </button>
    )}
  </div>
);

export default VehiclePageHeader;