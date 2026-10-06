import React, { useEffect, useState } from 'react';
import { Modal } from '../../../components/common/Modal';
import { Vehicle, VehicleType } from '../../../types';
import { CreateVehicleData, UpdateVehicleData } from '../services/vehicleService';
import { useToast } from '../../../context/ToastContext';
import { formatPlate } from '../utils/vehicleFormat';

interface VehicleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'CREATE' | 'EDIT';
  vehicle: Vehicle | null;
  onSubmit: (data: CreateVehicleData | UpdateVehicleData) => Promise<void>;
}

const VEHICLE_TYPE_LABELS: Record<VehicleType, { long: string; short: string }> = {
  SEDAN: { long: 'Sedan (4-5 chỗ)', short: 'Sedan' },
  SUV: { long: 'SUV / Crossover (5-7 chỗ)', short: 'SUV' },
  PICKUP: { long: 'Xe bán tải (Pickup)', short: 'Pickup' },
  VAN: { long: 'Xe chở khách (Van 16 chỗ)', short: 'Van' },
  TRUCK: { long: 'Xe tải hàng hóa', short: 'Truck' },
};

export const VehicleFormModal: React.FC<VehicleFormModalProps> = ({
  isOpen,
  onClose,
  mode,
  vehicle,
  onSubmit,
}) => {
  const { showToast } = useToast();
  const isCreate = mode === 'CREATE';

  const [licensePlate, setLicensePlate] = useState('');
  const [brand, setBrand] = useState('Toyota');
  const [model, setModel] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('SEDAN');
  const [seatCapacity, setSeatCapacity] = useState(5);
  const [manufactureYear, setManufactureYear] = useState(new Date().getFullYear());
  const [initialOdometer, setInitialOdometer] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (isCreate || !vehicle) {
      setLicensePlate('');
      setBrand('Toyota');
      setModel('');
      setVehicleType('SEDAN');
      setSeatCapacity(5);
      setManufactureYear(new Date().getFullYear());
      setInitialOdometer(0);
      setImageUrl('');
      return;
    }
    setBrand(vehicle.brand);
    setModel(vehicle.model);
    setVehicleType(vehicle.vehicleType);
    setSeatCapacity(vehicle.seatCapacity);
    setManufactureYear(vehicle.manufactureYear);
    setImageUrl(vehicle.imageUrl || '');
  }, [isOpen, mode, vehicle]);

  useEffect(() => {
    if (isOpen) return;
    setLicensePlate('');
    setImageUrl('');
    setIsSubmitting(false);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreate && !licensePlate.trim()) {
      showToast('error', 'Vui lòng nhập biển số xe');
      return;
    }

    const data: CreateVehicleData | UpdateVehicleData = isCreate
      ? {
          licensePlate: formatPlate(licensePlate),
          brand,
          model,
          vehicleType,
          seatCapacity,
          manufactureYear,
          initialOdometer,
          imageUrl: imageUrl.trim() || undefined,
        }
      : {
          brand,
          model,
          vehicleType,
          seatCapacity,
          manufactureYear,
          imageUrl: imageUrl.trim() || undefined,
        };

    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCreate ? 'Thêm phương tiện mới vào đội xe' : `Chỉnh sửa xe: ${vehicle?.licensePlate ?? ''}`}
    >
      <form onSubmit={handleSubmit}>
        {isCreate ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">
                  Biển số xe <span style={{ color: 'var(--accent-rose)' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: 29A-888.88"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(formatPlate(e.target.value))}
                  className="form-input mono"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Hãng xe</label>
                <input
                  type="text"
                  placeholder="Toyota, Ford, VinFast..."
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Dòng xe (Model)</label>
                <input
                  type="text"
                  placeholder="Camry, Ranger, VF8..."
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phân loại xe</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                  className="form-select"
                >
                  {(Object.keys(VEHICLE_TYPE_LABELS) as VehicleType[]).map((type) => (
                    <option key={type} value={type}>
                      {VEHICLE_TYPE_LABELS[type].long}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Số chỗ ngồi</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={seatCapacity}
                  onChange={(e) => setSeatCapacity(parseInt(e.target.value, 10) || 5)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Năm sản xuất</label>
                <input
                  type="number"
                  min="1990"
                  max={new Date().getFullYear()}
                  value={manufactureYear}
                  onChange={(e) => setManufactureYear(parseInt(e.target.value, 10) || 2023)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Km ban đầu</label>
                <input
                  type="number"
                  min="0"
                  value={initialOdometer}
                  onChange={(e) => setInitialOdometer(parseInt(e.target.value, 10) || 0)}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Đường dẫn ảnh xe (URL)</label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="form-input"
              />
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Hãng xe</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Dòng xe (Model)</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Phân loại xe</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                  className="form-select"
                >
                  {(Object.keys(VEHICLE_TYPE_LABELS) as VehicleType[]).map((type) => (
                    <option key={type} value={type}>
                      {VEHICLE_TYPE_LABELS[type].short}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Số chỗ</label>
                <input
                  type="number"
                  min="1"
                  value={seatCapacity}
                  onChange={(e) => setSeatCapacity(parseInt(e.target.value, 10))}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Năm SX</label>
                <input
                  type="number"
                  min="1990"
                  value={manufactureYear}
                  onChange={(e) => setManufactureYear(parseInt(e.target.value, 10))}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">URL Ảnh xe</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="form-input"
              />
            </div>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
            Hủy bỏ
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting
              ? isCreate ? 'Đang thêm...' : 'Đang cập nhật...'
              : isCreate ? 'Thêm phương tiện' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default VehicleFormModal;