import React from 'react';
import { Plus } from 'lucide-react';

interface VehiclePageHeaderProps {
  canAdd: boolean;
  onAdd: () => void;
}

export const VehiclePageHeader: React.FC<VehiclePageHeaderProps> = ({ canAdd, onAdd }) => {
  if (!canAdd) return null;

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '-0.5rem' }}>
      <button onClick={onAdd} className="btn btn-primary" id="add-vehicle-btn">
        <Plus size={18} />
        <span>Thêm xe mới</span>
      </button>
    </div>
  );
};

export default VehiclePageHeader;