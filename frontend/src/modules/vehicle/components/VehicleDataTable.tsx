import React from 'react';
import { Vehicle, VehicleStatus } from '../../../types';
import { StatusBadge } from './StatusBadge';
import { VehicleRowActions } from './VehicleRowActions';
import { VehicleStatusMenu } from './VehicleStatusMenu';

interface VehicleDataTableProps {
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

export const VehicleDataTable: React.FC<VehicleDataTableProps> = ({
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
          <th>Trạng thái</th>
          <th style={{ textAlign: 'right' }}>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        {vehicles.map((v) => (
          <tr key={v.id}>
            <td className="mono" style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
              {v.licensePlate}
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
              {v.assignedDriverName ? (
                <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{v.assignedDriverName}</span>
              ) : (
                <span style={{ color: 'var(--text-dim)' }}>—</span>
              )}
            </td>
            <td>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <StatusBadge status={v.status} />
                {!isDriver && <VehicleStatusMenu vehicle={v} onChangeStatus={onChangeStatus} />}
              </div>
            </td>
            <td style={{ textAlign: 'right' }}>
              <div style={{ display: 'inline-flex', gap: '0.375rem' }}>
                <VehicleRowActions
                  vehicle={v}
                  isDriver={isDriver}
                  compact
                  onAssign={onAssign}
                  onReturn={onReturn}
                  onFinishMaintenance={onFinishMaintenance}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onViewTrips={onViewTrips}
                />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default VehicleDataTable;