import React from 'react';
import { ArrowRight, Edit, Eye, History, Mail, Send, Trash2, Wrench } from 'lucide-react';
import { Vehicle } from '../../../types';

interface VehicleRowActionsProps {
  vehicle: Vehicle;
  isDriver: boolean;
  compact?: boolean;
  onViewDetail?: (v: Vehicle) => void;
  onAssign: (v: Vehicle) => void;
  onReturn: (v: Vehicle) => void;
  onFinishMaintenance: (v: Vehicle) => void;
  onEdit: (v: Vehicle) => void;
  onDelete: (v: Vehicle) => void;
  onViewTrips: (v: Vehicle) => void;
  onSendIncidentEmail?: (v: Vehicle) => void;
}

export const VehicleRowActions: React.FC<VehicleRowActionsProps> = ({
  vehicle,
  isDriver,
  compact = false,
  onViewDetail,
  onAssign,
  onReturn,
  onFinishMaintenance,
  onEdit,
  onDelete,
  onViewTrips,
  onSendIncidentEmail,
}) => {
  const isIncident = vehicle.status === 'MAINTENANCE' || vehicle.maintenanceDue || vehicle.status === 'DECOMMISSIONED';

  return (
    <>
      {/* Nút gửi email sự cố - CHỈ HIỂN THỊ KHI XE GẶP SỰ CỐ */}
      {isIncident && onSendIncidentEmail && (
        <button
          onClick={() => onSendIncidentEmail(vehicle)}
          className="btn btn-sm"
          style={
            compact
              ? {
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }
              : {
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(245, 158, 11, 0.2) 100%)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.45)',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  padding: '0.4rem 0.75rem',
                }
          }
          title="Gửi email thông báo sự cố cho chủ xe / khách hàng"
        >
          <Mail size={13} />
          {compact ? 'Báo sự cố' : 'Gửi mail sự cố'}
        </button>
      )}
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

    {onViewDetail && (
      <button
        onClick={() => onViewDetail(vehicle)}
        className="btn btn-secondary btn-icon"
        style={compact ? undefined : { width: '32px', height: '32px' }}
        title="Xem chi tiết phương tiện & tài xế"
      >
        <Eye size={14} />
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
};

export default VehicleRowActions;