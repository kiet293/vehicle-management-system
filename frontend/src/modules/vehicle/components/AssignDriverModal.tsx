import React, { useEffect, useState } from 'react';
import { Modal } from '../../../components/common/Modal';
import { User, Vehicle } from '../../../types';
import { DriversStatus } from '../hooks/useVehicleActions';

interface AssignDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
  drivers: User[];
  driversStatus: DriversStatus;
  onRetryDrivers: () => void;
  onAssign: (driverId: number, driverName: string, driverEmail?: string) => Promise<void>;
}

export const AssignDriverModal: React.FC<AssignDriverModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  drivers,
  driversStatus,
  onRetryDrivers,
  onAssign,
}) => {
  const [selectedDriverId, setSelectedDriverId] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedDriverId('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const driver = drivers.find((item) => item.id === Number(selectedDriverId));
    if (!driver) return;

    setIsSubmitting(true);
    try {
      await onAssign(driver.id, driver.fullName, driver.email);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen && !!vehicle}
      onClose={onClose}
      title={`Bàn giao phương tiện: ${vehicle?.licensePlate ?? ''}`}
    >
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.25rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Bàn giao xe <strong>{vehicle?.brand} {vehicle?.model}</strong> cho tài xế chịu trách nhiệm vận hành. Trạng thái xe sẽ chuyển sang <strong>ĐANG CHẠY</strong>.
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">Chọn tài xế phụ trách</label>
          {driversStatus === 'loading' ? (
            <div
              style={{
                padding: '0.75rem',
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                color: 'var(--accent-blue, #3b82f6)',
                borderRadius: '10px',
                fontSize: '0.8125rem',
              }}
            >
              Đang tải danh sách tài xế...
            </div>
          ) : driversStatus === 'error' ? (
            <div
              style={{
                padding: '0.75rem',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                fontSize: '0.8125rem',
                color: '#f87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
              }}
            >
              <span>Không thể tải danh sách tài xế từ máy chủ. Vui lòng thử lại.</span>
              <button type="button" onClick={onRetryDrivers} className="btn btn-secondary btn-sm">
                Thử lại
              </button>
            </div>
          ) : drivers.length === 0 ? (
            <div style={{ padding: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-amber)', borderRadius: '10px', fontSize: '0.8125rem' }}>
              Hiện không có tài xế nào sẵn sàng. Vui lòng kiểm tra lại lịch trình nhân sự.
            </div>
          ) : (
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value ? Number(e.target.value) : '')}
              className="form-select"
              required
            >
              <option value="">-- Chọn tài xế từ danh sách --</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName} ({d.driverLicenseClass || 'B2'}) - {d.phone || d.email}
                </option>
              ))}
            </select>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
            Hủy bỏ
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || driversStatus !== 'ready' || drivers.length === 0 || !selectedDriverId}
          >
            {isSubmitting ? 'Đang bàn giao...' : 'Xác nhận bàn giao'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AssignDriverModal;