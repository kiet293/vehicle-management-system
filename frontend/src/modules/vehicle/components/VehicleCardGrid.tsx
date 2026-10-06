import React from 'react';
import { AlertTriangle, Gauge, UserCheck } from 'lucide-react';
import { Vehicle, VehicleStatus } from '../../../types';
import { FALLBACK_VEHICLE_IMAGE } from '../utils/vehicleFormat';
import { StatusBadge } from './StatusBadge';
import { VehicleRowActions } from './VehicleRowActions';
import { VehicleStatusMenu } from './VehicleStatusMenu';

interface VehicleCardGridProps {
  vehicles: Vehicle[];
  isDriver: boolean;
  onAssign: (v: Vehicle) => void;
  onReturn: (v: Vehicle) => void;
  onFinishMaintenance: (v: Vehicle) => void;
  onEdit: (v: Vehicle) => void;
  onDelete: (v: Vehicle) => void;
  onViewTrips: (v: Vehicle) => void;
  onChangeStatus: (v: Vehicle, status: VehicleStatus) => void;
}

export const VehicleCardGrid: React.FC<VehicleCardGridProps> = ({
  vehicles,
  isDriver,
  onAssign,
  onReturn,
  onFinishMaintenance,
  onEdit,
  onDelete,
  onViewTrips,
  onChangeStatus,
}) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
    {vehicles.map((v) => (
      <div
        key={v.id}
        className="glass-panel"
        style={{
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.25s ease',
        }}
      >
        {/* Photo & Status */}
        <div style={{ position: 'relative', height: '170px', width: '100%', background: '#1e293b' }}>
          <img
            src={v.imageUrl || FALLBACK_VEHICLE_IMAGE}
            alt={v.licensePlate}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = FALLBACK_VEHICLE_IMAGE;
            }}
          />
          <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <StatusBadge status={v.status} />
            {!isDriver && <VehicleStatusMenu vehicle={v} onChangeStatus={onChangeStatus} />}
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '12px',
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(8px)',
              padding: '0.25rem 0.625rem',
              borderRadius: '8px',
              color: '#ffffff',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: '0.9375rem',
              letterSpacing: '0.05em',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            {v.licensePlate}
          </div>
        </div>

        {/* Details Body */}
        <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              {v.brand} {v.model}
            </h3>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', marginTop: '2px' }}>
              <span>{v.vehicleType}</span> • <span>{v.seatCapacity} chỗ</span> • <span>Năm {v.manufactureYear}</span>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '0.75rem',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.5rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Gauge size={12} /> Odometer
              </div>
              <div className="mono" style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {v.currentOdometer.toLocaleString('vi-VN')} km
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <UserCheck size={12} /> Phụ trách
              </div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {v.assignedDriverName || 'Chưa bàn giao'}
              </div>
            </div>
          </div>

          {/* Maintenance Due Warning */}
          {v.maintenanceDue && (
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '8px',
                padding: '0.375rem 0.625rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.75rem',
                color: 'var(--accent-amber)',
                fontWeight: 600,
              }}
            >
              <AlertTriangle size={14} />
              <span>Đã đến hạn bảo dưỡng định kỳ (&ge;5.000 km)</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ marginTop: 'auto', paddingTop: '0.75rem', display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
            <VehicleRowActions
              vehicle={v}
              isDriver={isDriver}
              onAssign={onAssign}
              onReturn={onReturn}
              onFinishMaintenance={onFinishMaintenance}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewTrips={onViewTrips}
            />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default VehicleCardGrid;