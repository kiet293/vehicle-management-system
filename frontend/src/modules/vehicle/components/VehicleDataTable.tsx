import React from 'react';
import { Mail, Phone, User as UserIcon } from 'lucide-react';
import { Vehicle, VehicleStatus, User } from '../../../types';
import { StatusBadge } from './StatusBadge';
import { VehicleRowActions } from './VehicleRowActions';
import { VehicleStatusMenu } from './VehicleStatusMenu';

interface VehicleDataTableProps {
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

export const VehicleDataTable: React.FC<VehicleDataTableProps> = ({
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
  <div className="data-table-container">
    <table className="data-table">
      <thead>
        <tr>
          <th>Biển số xe</th>
          <th>Hãng & Dòng xe</th>
          <th>Phân loại</th>
          <th>Số chỗ</th>
          <th>Năm SX</th>
          <th>Odometer</th>
          <th>Tài xế phụ trách</th>
          <th>Tình trạng xe</th>
          <th style={{ textAlign: 'right' }}>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        {vehicles.map((v) => {
          const driver = v.assignedDriverId && driversMap ? driversMap[v.assignedDriverId] : null;
          const driverName = v.assignedDriverName || driver?.fullName;
          const driverPhone = driver?.phone;
          const driverEmail = driver?.email;
          const driverLicense = driver?.driverLicenseClass;

          return (
            <tr key={v.id}>
              <td
                className="mono"
                style={{ fontWeight: 700, color: 'var(--accent-cyan)', cursor: onViewDetail ? 'pointer' : 'default' }}
                onClick={() => onViewDetail?.(v)}
                title="Bấm để xem thông tin chi tiết xe và tài xế"
              >
                <span style={{ textDecoration: onViewDetail ? 'underline dotted' : 'none' }}>
                  {v.licensePlate}
                </span>
              </td>
              <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                {v.brand} {v.model}
              </td>
              <td>
                <span className="badge badge-neutral">{v.vehicleType}</span>
              </td>
              <td>{v.seatCapacity} chỗ</td>
              <td className="mono">{v.manufactureYear}</td>
              <td className="mono" style={{ fontWeight: 600 }}>
                {v.currentOdometer.toLocaleString('vi-VN')} km
              </td>
              <td>
                {driverName ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <UserIcon size={13} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
                      <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem' }}>
                        {driverName}
                      </span>
                      {driverLicense && (
                        <span className="badge badge-neutral" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                          {driverLicense}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {driverPhone && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Phone size={11} style={{ color: 'var(--accent-emerald)' }} />
                          <a href={`tel:${driverPhone}`} style={{ color: 'inherit', textDecoration: 'none' }} title="Gọi tài xế">
                            {driverPhone}
                          </a>
                        </span>
                      )}
                      {driverEmail && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }} title={driverEmail}>
                          <Mail size={11} style={{ color: 'var(--accent-blue)' }} />
                          <span style={{ maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {driverEmail}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <span className="badge badge-neutral" style={{ opacity: 0.6 }}>Chưa phân bổ</span>
                )}
              </td>
              <td>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <StatusBadge status={v.status} />
                    {!isDriver && <VehicleStatusMenu vehicle={v} onChangeStatus={onChangeStatus} />}
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
                        width: 'fit-content',
                      }}
                    >
                      ⚠️ Quá hạn BD
                    </span>
                  )}
                </div>
              </td>
              <td style={{ textAlign: 'right' }}>
                <div style={{ display: 'inline-flex', gap: '0.375rem' }}>
                  <VehicleRowActions
                    vehicle={v}
                    isDriver={isDriver}
                    compact
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
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

export default VehicleDataTable;