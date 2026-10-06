import React from 'react';
import { ArrowRight, Edit, History, Send, Trash2, Wrench } from 'lucide-react';
import { Vehicle } from '../../../types';

interface VehicleRowActionsProps {
  vehicle: Vehicle;
  isDriver: boolean;
  compact?: boolean;
  onAssign: (v: Vehicle) => void;
  onReturn: (v: Vehicle) => void;
  onFinishMaintenance: (v: Vehicle) => void;
  onEdit: (v: Vehicle) => void;
  onDelete: (v: Vehicle) => void;
  onViewTrips: (v: Vehicle) => void;
}

export const VehicleRowActions: React.FC<VehicleRowActionsProps> = ({
  vehicle,
  isDriver,
  compact = false,
  onAssign,
  onReturn,
  onFinishMaintenance,
  onEdit,
  onDelete,
  onViewTrips,
}) => (
  <>
    {vehicle.status === 'AVAILABLE' && !isDriver && (
      <button
        onClick={() => onAssign(vehicle)}
        className="btn btn-primary btn-sm"
        style={compact ? undefined : { flex: 1 }}
        title={compact ? 'Bàn giao xe' : undefined}
      >
        {compact ? 'Bàn giao' : (
          <>
            <Send size={14} /> Bàn giao xe
          </>
        )}
      </button>
    )}

    {vehicle.status === 'IN_USE' && (
      <button
        onClick={() => onReturn(vehicle)}
        className="btn btn-primary btn-sm"
        style={
          compact
            ? { background: '#10b981' }
            : { flex: 1, background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)' }
        }
        title={compact ? 'Trả xe' : undefined}
      >
        {compact ? 'Trả xe' : (
          <>
            <ArrowRight size={14} /> Trả xe / Bàn giao
          </>
        )}
      </button>
    )}

    {vehicle.status === 'MAINTENANCE' && !isDriver && (
      <button
        onClick={() => onFinishMaintenance(vehicle)}
        className={compact ? 'btn btn-secondary btn-sm' : 'btn btn-primary btn-sm'}
        style={
          compact
            ? { color: 'var(--accent-amber)' }
            : { flex: 1, background: 'var(--accent-amber)', color: '#000' }
        }
        title={compact ? 'Xong bảo dưỡng' : undefined}
      >
        {compact ? 'Xong BD' : (
          <>
            <Wrench size={14} /> Bảo dưỡng xong
          </>
        )}
      </button>
    )}

    <button
      onClick={() => onViewTrips(vehicle)}
      className="btn btn-secondary btn-icon"
      style={compact ? undefined : { width: '32px', height: '32px' }}
      title="Nhật ký hành trình"
    >
      <History size={14} />
    </button>

    {!isDriver && (
      <button
        onClick={() => onEdit(vehicle)}
        className="btn btn-secondary btn-icon"
        style={compact ? undefined : { width: '32px', height: '32px' }}
        title="Sửa xe"
      >
        <Edit size={14} />
      </button>
    )}

    {!isDriver && vehicle.status !== 'DECOMMISSIONED' && (
      <button
        onClick={() => onDelete(vehicle)}
        className="btn btn-danger btn-icon"
        style={compact ? undefined : { width: '32px', height: '32px' }}
        title="Ngừng khai thác"
      >
        <Trash2 size={14} />
      </button>
    )}
  </>
);

export default VehicleRowActions;