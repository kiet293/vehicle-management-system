import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { Vehicle } from '../../../types';

interface ReturnVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
  onReturn: (newOdometer: number, notes: string) => Promise<void>;
}

export const ReturnVehicleModal: React.FC<ReturnVehicleModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  onReturn,
}) => {
  const [returnKm, setReturnKm] = useState('');
  const [returnNotes, setReturnNotes] = useState('');
  const [kmError, setKmError] = useState<string | null>(null);
  const [kmWarning, setKmWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setReturnKm('');
      setReturnNotes('');
      setKmError(null);
      setKmWarning(null);
      setIsSubmitting(false);
      return;
    }
    if (vehicle) {
      setReturnKm(String(vehicle.currentOdometer));
      setReturnNotes('');
      setKmError(null);
      setKmWarning(null);
    }
  }, [isOpen, vehicle]);

  const handleKmChange = (valStr: string) => {
    setReturnKm(valStr);
    const val = parseInt(valStr.replace(/\D/g, ''), 10);
    if (isNaN(val)) {
      setKmError('Vui lòng nhập số km hợp lệ');
      setKmWarning(null);
      return;
    }
    if (vehicle && val < vehicle.currentOdometer) {
      setKmError(
        `Số km cập nhật (${val.toLocaleString('vi-VN')} km) không thể nhỏ hơn số km hiện tại (${vehicle.currentOdometer.toLocaleString('vi-VN')} km). Vui lòng kiểm tra lại công-tơ-mét trên xe.`
      );
      setKmWarning(null);
    } else {
      setKmError(null);
      if (vehicle && val - vehicle.currentOdometer > 1000) {
        setKmWarning('Quãng đường ghi nhận tăng hơn 1.000 km, bạn có chắc chắn số liệu này chính xác không?');
      } else {
        setKmWarning(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const km = parseInt(returnKm.replace(/\D/g, ''), 10);
    if (isNaN(km) || (vehicle && km < vehicle.currentOdometer)) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onReturn(km, returnNotes);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen && !!vehicle}
      onClose={onClose}
      title={`Bàn giao lại xe / Kết thúc chuyến: ${vehicle?.licensePlate ?? ''}`}
    >
      <form onSubmit={handleSubmit}>
        <div
          style={{
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Số km lúc nhận bàn giao:</span>
            <span className="mono" style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
              {vehicle?.currentOdometer.toLocaleString('vi-VN')} km
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Mốc bảo dưỡng trước:</span>
            <span className="mono" style={{ fontSize: '0.8125rem', color: 'var(--text-dim)' }}>
              {vehicle?.lastMaintenanceOdometer.toLocaleString('vi-VN')} km
            </span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            Số km công-tơ-mét hiện tại <span style={{ color: 'var(--accent-rose)' }}>*</span>
          </label>
          <input
            type="number"
            placeholder="Nhập số km mới"
            value={returnKm}
            onChange={(e) => handleKmChange(e.target.value)}
            className={`form-input mono ${kmError ? 'input-error' : ''}`}
            style={{ fontSize: '1.125rem', fontWeight: 700 }}
            required
          />
          {kmError && <div className="form-error-msg">{kmError}</div>}
          {kmWarning && (
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '8px',
                padding: '0.5rem 0.75rem',
                fontSize: '0.75rem',
                color: 'var(--accent-amber)',
                marginTop: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
              }}
            >
              <AlertTriangle size={14} />
              <span>{kmWarning}</span>
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Ghi chú tình trạng bàn giao</label>
          <textarea
            rows={3}
            placeholder="Xe hoạt động ổn định, đã vệ sinh sạch sẽ trước khi bàn giao..."
            value={returnNotes}
            onChange={(e) => setReturnNotes(e.target.value)}
            className="form-textarea"
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
            Hủy bỏ
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting || !!kmError}>
            {isSubmitting ? 'Đang cập nhật...' : 'Hoàn thành bàn giao'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ReturnVehicleModal;