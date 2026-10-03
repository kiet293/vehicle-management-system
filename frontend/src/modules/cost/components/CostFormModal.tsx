import React, { useState, useEffect } from 'react';
import { CostRecord, CostFormData, CostType, VehicleOption, COST_TYPE_LABELS } from '../types';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { DollarSign, AlertCircle, Calendar, FileText, Car, Check } from 'lucide-react';
import { formatVND } from './CostSummaryCards';

interface CostFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CostFormData) => Promise<void>;
  initialData?: CostRecord | null;
  vehicles: VehicleOption[];
}

export const CostFormModal: React.FC<CostFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  vehicles
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<CostFormData>({
    vehicleId: '',
    costType: 'FUEL',
    amount: '',
    costDate: todayStr,
    description: ''
  });

  const [rawAmountInput, setRawAmountInput] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        vehicleId: initialData.vehicleId,
        costType: initialData.costType,
        amount: initialData.amount,
        costDate: initialData.costDate,
        description: initialData.description || ''
      });
      setRawAmountInput(initialData.amount ? initialData.amount.toString() : '');
    } else {
      setFormData({
        vehicleId: vehicles.length > 0 ? vehicles[0].id : '',
        costType: 'FUEL',
        amount: '',
        costDate: todayStr,
        description: ''
      });
      setRawAmountInput('');
    }
    setErrors({});
  }, [initialData, isOpen, vehicles]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Keep only digits
    const cleaned = e.target.value.replace(/\D/g, '');
    setRawAmountInput(cleaned);
    const num = cleaned ? parseInt(cleaned, 10) : '';
    setFormData(prev => ({ ...prev, amount: num }));
    if (errors.amount) {
      setErrors(prev => ({ ...prev, amount: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.vehicleId) {
      newErrors.vehicleId = 'Vui lòng chọn phương tiện phát sinh chi phí';
    }

    if (!formData.costType) {
      newErrors.costType = 'Vui lòng chọn loại chi phí';
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      newErrors.amount = 'Số tiền chi phí phải lớn hơn 0 ₫';
    }

    if (!formData.costDate) {
      newErrors.costDate = 'Vui lòng chọn ngày phát sinh';
    } else if (formData.costDate > todayStr) {
      newErrors.costDate = 'Ngày chi phí không được vượt quá ngày hiện tại';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setErrors(prev => ({ ...prev, submit: err.message || 'Lưu phiếu chi thất bại. Vui lòng thử lại.' }));
    } finally {
      setSubmitting(false);
    }
  };

  const costTypes: CostType[] = ['FUEL', 'MAINTENANCE', 'TOLL', 'INSURANCE', 'OTHER'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Chỉnh Sửa Phiếu Chi Phí' : 'Kê Khai Chi Phí Mới (Tạo Phiếu Chi)'}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {errors.submit && (
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} />
            <span>{errors.submit}</span>
          </div>
        )}

        {/* Vehicle Selection */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.375rem' }}>
            <Car size={16} color="var(--accent-cyan)" />
            <span>Phương tiện <span style={{ color: 'var(--accent-rose)' }}>*</span></span>
          </label>
          <select
            value={formData.vehicleId}
            onChange={(e) => {
              setFormData({ ...formData, vehicleId: e.target.value ? Number(e.target.value) : '' });
              if (errors.vehicleId) setErrors({ ...errors, vehicleId: '' });
            }}
            style={{
              width: '100%',
              backgroundColor: '#111827',
              border: `1px solid ${errors.vehicleId ? 'var(--accent-rose)' : 'var(--border-color)'}`,
              borderRadius: '8px',
              padding: '0.625rem 0.875rem',
              color: 'var(--text-main)',
              fontSize: '0.875rem'
            }}
          >
            <option value="">-- Chọn xe phát sinh chi phí --</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.licensePlate} • {v.model}
              </option>
            ))}
          </select>
          {errors.vehicleId && (
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-rose)', marginTop: '0.25rem', display: 'block' }}>
              {errors.vehicleId}
            </span>
          )}
        </div>

        {/* Cost Type Selection Buttons */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Loại chi phí <span style={{ color: 'var(--accent-rose)' }}>*</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem' }}>
            {costTypes.map((type) => {
              const meta = COST_TYPE_LABELS[type];
              const isSelected = formData.costType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, costType: type })}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: `1px solid ${isSelected ? meta.color : 'var(--border-color)'}`,
                    backgroundColor: isSelected ? meta.bg : 'rgba(0, 0, 0, 0.2)',
                    color: isSelected ? meta.color : 'var(--text-muted)',
                    fontSize: '0.8125rem',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.375rem',
                    transition: 'all 0.2s'
                  }}
                >
                  {isSelected && <Check size={14} />}
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Amount Input with Live Currency Masking */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.375rem' }}>
            <DollarSign size={16} color="var(--accent-amber)" />
            <span>Số tiền (VNĐ) <span style={{ color: 'var(--accent-rose)' }}>*</span></span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Nhập số tiền (VD: 850000)"
              value={rawAmountInput ? Number(rawAmountInput).toLocaleString('vi-VN') : ''}
              onChange={handleAmountChange}
              style={{
                width: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                border: `1px solid ${errors.amount ? 'var(--accent-rose)' : 'var(--border-color)'}`,
                borderRadius: '8px',
                padding: '0.625rem 3rem 0.625rem 0.875rem',
                color: 'var(--accent-amber)',
                fontSize: '1.125rem',
                fontWeight: 700,
                letterSpacing: '0.02em'
              }}
            />
            <span style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-dim)',
              fontSize: '0.875rem',
              fontWeight: 600
            }}>
              ₫ VNĐ
            </span>
          </div>
          {rawAmountInput && Number(rawAmountInput) > 0 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Bằng chữ / Quy đổi: <strong>{formatVND(Number(rawAmountInput))}</strong>
            </div>
          )}
          {errors.amount && (
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-rose)', marginTop: '0.25rem', display: 'block' }}>
              {errors.amount}
            </span>
          )}
        </div>

        {/* Date of expense */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.375rem' }}>
            <Calendar size={16} color="var(--accent-blue)" />
            <span>Ngày phát sinh <span style={{ color: 'var(--accent-rose)' }}>*</span></span>
          </label>
          <input
            type="date"
            max={todayStr}
            value={formData.costDate}
            onChange={(e) => {
              setFormData({ ...formData, costDate: e.target.value });
              if (errors.costDate) setErrors({ ...errors, costDate: '' });
            }}
            style={{
              width: '100%',
              backgroundColor: '#111827',
              border: `1px solid ${errors.costDate ? 'var(--accent-rose)' : 'var(--border-color)'}`,
              borderRadius: '8px',
              padding: '0.625rem 0.875rem',
              color: 'var(--text-main)',
              fontSize: '0.875rem'
            }}
          />
          {errors.costDate && (
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-rose)', marginTop: '0.25rem', display: 'block' }}>
              {errors.costDate}
            </span>
          )}
        </div>

        {/* Description / Notes */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.375rem' }}>
            <FileText size={16} color="var(--text-dim)" />
            <span>Nội dung chi / Ghi chú hóa đơn</span>
          </label>
          <textarea
            rows={3}
            placeholder="VD: Đổ đầy bình xăng RON 95 Petrolimex số 3, thay dầu nhớt động cơ..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            style={{
              width: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '0.625rem 0.875rem',
              color: 'var(--text-main)',
              fontSize: '0.875rem',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Hủy bỏ
          </Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? 'Đang lưu...' : initialData ? 'Cập nhật phiếu chi' : 'Lưu phiếu chi'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
