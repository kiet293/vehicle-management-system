import React, { useCallback, useEffect, useState } from 'react';
import { Modal } from '../../../components/common/Modal';
import { Skeleton } from '../../../components/common/Skeleton';
import { EmptyState } from '../../../components/common/EmptyState';
import { vehicleService } from '../services/vehicleService';
import { TripStatus, Vehicle, VehicleTrip } from '../../../types';
import { AlertTriangle, Gauge, History, RotateCcw } from 'lucide-react';
import { formatDateTime, formatDuration, formatKm } from '../utils/vehicleFormat';

interface VehicleTripHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle;
}

const statusMeta: Record<TripStatus, { label: string; className: string }> = {
  IN_PROGRESS: { label: 'ĐANG CHẠY', className: 'badge badge-info' },
  COMPLETED: { label: 'HOÀN TẤT', className: 'badge badge-success' },
  CANCELLED: { label: 'ĐÃ HỦY', className: 'badge badge-danger' },
};

export const VehicleTripHistoryModal: React.FC<VehicleTripHistoryModalProps> = ({
  isOpen,
  onClose,
  vehicle,
}) => {
  const [trips, setTrips] = useState<VehicleTrip[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTrips = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await vehicleService.getTrips(vehicle.id);
      setTrips(data);
    } catch {
      setTrips([]);
      setError('Không thể tải nhật ký hành trình. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, [vehicle.id]);

  useEffect(() => {
    if (isOpen) {
      loadTrips();
    } else {
      setTrips([]);
      setError(null);
    }
  }, [isOpen, loadTrips]);

  const totalTrips = trips.length;
  const totalDistance = trips.reduce((sum, trip) => sum + (trip.distanceKm ?? 0), 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Nhật ký hành trình: ${vehicle.licensePlate}`}
      maxWidth="860px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              TỔNG SỐ CHUYẾN
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{totalTrips}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              TỔNG QUÃNG ĐƯỜNG
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{formatKm(totalDistance)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              HÃNG XE
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{vehicle.brand}</div>
          </div>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '0.875rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              color: '#f87171',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
            <button onClick={loadTrips} className="btn btn-secondary btn-sm">
              <RotateCcw size={14} /> Thử lại
            </button>
          </div>
        )}

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} height="48px" borderRadius="10px" />
            ))}
          </div>
        ) : trips.length === 0 ? (
          <EmptyState
            icon={<History size={28} />}
            title="Chưa có chuyến đi nào"
            description={`Xe ${vehicle.licensePlate} chưa từng được bàn giao cho tài xế. Lịch sử sẽ xuất hiện sau lần bàn giao đầu tiên.`}
          />
        ) : (
          <div className="data-table-container" style={{ maxHeight: '380px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bắt đầu</th>
                  <th>Kết thúc</th>
                  <th>Quãng đường</th>
                  <th>Thời lượng</th>
                  <th>Tài xế</th>
                  <th>Trạng thái</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((trip) => {
                  const meta = statusMeta[trip.status];
                  return (
                    <tr key={trip.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(trip.startedAt)}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(trip.endedAt)}</td>
                      <td className="mono">{formatKm(trip.distanceKm)}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDuration(trip.durationMinutes)}</td>
                      <td>{trip.driverName ?? '—'}</td>
                      <td>
                        <span className={meta.className}>{meta.label}</span>
                      </td>
                      <td style={{ maxWidth: '220px', fontSize: '0.8125rem' }}>
                        {trip.notes ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && trips.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            <Gauge size={14} />
            <span>Quãng đường tính từ chênh lệch công-tơ-mét giữa lúc bàn giao và lúc trả xe.</span>
          </div>
        )}
      </div>
    </Modal>
  );
};