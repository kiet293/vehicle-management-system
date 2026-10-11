import React from 'react';
import { AlertTriangle, Gauge, Mail, Phone, UserCheck, Wrench } from 'lucide-react';
import { Vehicle, VehicleStatus, User } from '../../../types';
import { FALLBACK_VEHICLE_IMAGE } from '../utils/vehicleFormat';
import { StatusBadge } from './StatusBadge';
import { VehicleRowActions } from './VehicleRowActions';
import { VehicleStatusMenu } from './VehicleStatusMenu';

interface VehicleCardGridProps {
  vehicles: Vehicle[];
  isDriver: boolean;
  driversMap?: Record<number, User>;
  onViewDetail?: (v: Vehicle) => void;
  onAssign: (v: Vehicle) => void;
  onReturn: (v: Vehicle) => void;
  onFinishMaintenance: (v: Vehicle) => void;
  onEdit: (v: Vehicle) => void;
  onDelete: (v: Vehicle) => void;
  onViewTrips: (v: Vehicle) => void;
  onChangeStatus: (v: Vehicle, status: VehicleStatus) => void;
  onSendIncidentEmail?: (v: Vehicle) => void;
}

export const VehicleCardGrid: React.FC<VehicleCardGridProps> = ({
  vehicles,
  isDriver,
  driversMap,
  onViewDetail,
  onAssign,
  onReturn,
  onFinishMaintenance,
  onEdit,
  onDelete,
  onViewTrips,
  onChangeStatus,
  onSendIncidentEmail,
}) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
    {vehicles.map((v) => {
      const driver = v.assignedDriverId && driversMap ? driversMap[v.assignedDriverId] : null;
      const driverName = v.assignedDriverName || driver?.fullName;
      const driverPhone = driver?.phone;
      const driverEmail = driver?.email;
      const driverLicense = driver?.driverLicenseClass;

      const isIncident = v.status === 'MAINTENANCE' || v.maintenanceDue || v.status === 'DECOMMISSIONED';

      return (
        <div
          key={v.id}
          className="glass-panel"
          style={{
            borderRadius: '16px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.25s ease',
            border: isIncident ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-color)',
          }}
        >
          {/* Photo & Status */}
          <div
            style={{
              position: 'relative',
              height: '170px',
              width: '100%',
              background: '#1e293b',
              cursor: onViewDetail ? 'pointer' : 'default',
            }}
            onClick={() => onViewDetail?.(v)}
            title="Bấm để xem thông tin chi tiết xe và tài xế"
          >
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginTop: '4px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem' }}>
                  <span>{v.vehicleType}</span> • <span>{v.seatCapacity} chỗ</span> • <span>Năm {v.manufactureYear}</span>
                </div>
                {v.maintenanceDue && (
                  <span
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#f87171',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      borderRadius: '4px',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '1px 5px',
                      flexShrink: 0,
                    }}
                  >
                    ⚠️ Quá hạn BD
                  </span>
                )}
              </div>
            </div>

            {/* Thông số kỹ thuật & Thông tin tài xế phụ trách */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.625rem',
              }}
            >
              {/* Odometer & Lần bảo dưỡng trước */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Gauge size={12} /> Odometer hiện tại
                  </div>
                  <div className="mono" style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                    {v.currentOdometer.toLocaleString('vi-VN')} km
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Wrench size={12} /> BD lần trước
                  </div>
                  <div className="mono" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    {v.lastMaintenanceOdometer.toLocaleString('vi-VN')} km
                  </div>
                </div>
              </div>

              {/* Thông tin tài xế phụ trách đầy đủ */}
              <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '0.5rem' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <UserCheck size={12} /> Tài xế phụ trách:
                  </span>
                  {driverLicense && (
                    <span className="badge badge-neutral" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                      Hạng {driverLicense}
                    </span>
                  )}
                </div>

                {driverName ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {driverName}
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {driverPhone && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Phone size={11} style={{ color: 'var(--accent-emerald)' }} />
                          <a href={`tel:${driverPhone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            {driverPhone}
                          </a>
                        </span>
                      )}
                      {driverEmail && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Mail size={11} style={{ color: 'var(--accent-blue)' }} />
                          <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {driverEmail}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                    Chưa phân bổ tài xế
                  </div>
                )}
              </div>
            </div>

            {/* Cảnh báo sự cố & NÚT GỬI MAIL THÔNG BÁO CHO CHỦ XE - CHỈ HIỂN THỊ KHI XE CÓ SỰ CỐ */}
            {isIncident && (
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(245, 158, 11, 0.12) 100%)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: '10px',
                  padding: '0.625rem 0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171', fontSize: '0.75rem', fontWeight: 700 }}>
                  <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                  <span>
                    {v.status === 'MAINTENANCE'
                      ? '⚠️ Xe đang bảo trì kỹ thuật tại Gara'
                      : v.maintenanceDue
                      ? '⚠️ Quá hạn kiểm định bảo dưỡng (&ge;5.000 km)'
                      : '⚠️ Phương tiện ngừng khai thác'}
                  </span>
                </div>

                {onSendIncidentEmail && (
                  <button
                    type="button"
                    onClick={() => onSendIncidentEmail(v)}
                    className="btn btn-sm"
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '0.45rem 0.75rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)',
                    }}
                    title="Gửi email thông báo sự cố cho chủ xe / khách hàng"
                  >
                    <Mail size={14} />
                    <span>Gửi mail thông báo sự cố cho chủ xe</span>
                  </button>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ marginTop: 'auto', paddingTop: '0.75rem', display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
              <VehicleRowActions
                vehicle={v}
                isDriver={isDriver}
                onViewDetail={onViewDetail}
                onAssign={onAssign}
                onReturn={onReturn}
                onFinishMaintenance={onFinishMaintenance}
                onEdit={onEdit}
                onDelete={onDelete}
                onViewTrips={onViewTrips}
                onSendIncidentEmail={onSendIncidentEmail}
              />
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

export default VehicleCardGrid;