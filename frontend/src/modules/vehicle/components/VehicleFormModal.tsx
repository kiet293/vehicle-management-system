import React, { useEffect, useState } from 'react';
import {
  Car,
  User as UserIcon,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { Vehicle, VehicleType, VehicleStatus, User } from '../../../types';
import { CreateVehicleData, UpdateVehicleData } from '../services/vehicleService';
import { useToast } from '../../../context/ToastContext';
import { formatPlate } from '../utils/vehicleFormat';

interface VehicleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'CREATE' | 'EDIT';
  vehicle: Vehicle | null;
  onSubmit: (
    data: CreateVehicleData | UpdateVehicleData,
    driverId?: number | null,
    status?: VehicleStatus
  ) => Promise<void>;
  drivers?: User[];
  driversMap?: Record<number, User>;
}

const VEHICLE_TYPE_LABELS: Record<
  VehicleType,
  { long: string; short: string; defaultSeats: number; sampleImage: string }
> = {
  SEDAN: {
    long: 'Sedan (4-5 chỗ)',
    short: 'Sedan',
    defaultSeats: 5,
    sampleImage: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&auto=format&fit=crop&q=60',
  },
  SUV: {
    long: 'SUV / Crossover (5-7 chỗ)',
    short: 'SUV',
    defaultSeats: 7,
    sampleImage: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=60',
  },
  PICKUP: {
    long: 'Xe bán tải (Pickup)',
    short: 'Pickup',
    defaultSeats: 5,
    sampleImage: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=60',
  },
  VAN: {
    long: 'Xe chở khách 16 chỗ (Van)',
    short: 'Van',
    defaultSeats: 16,
    sampleImage: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop&q=60',
  },
  TRUCK: {
    long: 'Xe tải vận chuyển hàng (Truck)',
    short: 'Truck',
    defaultSeats: 3,
    sampleImage: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&auto=format&fit=crop&q=60',
  },
};

const POPULAR_BRANDS = [
  'Toyota',
  'Ford',
  'Hyundai',
  'VinFast',
  'Mercedes-Benz',
  'Mitsubishi',
  'Mazda',
  'Honda',
  'Kia',
  'Isuzu',
  'BMW',
  'Lexus',
];

const STATUS_OPTIONS: {
  value: VehicleStatus;
  label: string;
  badgeText: string;
  color: string;
  desc: string;
}[] = [
  {
    value: 'AVAILABLE',
    label: 'Sẵn sàng vận hành (Bình thường)',
    badgeText: 'SẴN SÀNG',
    color: '#10b981',
    desc: 'Xe đạt chuẩn an toàn kỹ thuật, sạch sẽ và sẵn sàng nhận lệnh điều động mới',
  },
  {
    value: 'IN_USE',
    label: 'Đang hoạt động / Đang sử dụng',
    badgeText: 'ĐANG CHẠY',
    color: '#06b6d4',
    desc: 'Xe đang thực hiện chuyến đi trên đường hoặc đã giao cho tài xế phụ trách',
  },
  {
    value: 'MAINTENANCE',
    label: 'Bảo dưỡng / Đang gặp sự cố kỹ thuật',
    badgeText: 'BẢO DƯỠNG / SỰ CỐ',
    color: '#f59e0b',
    desc: 'Xe đang sửa chữa, nằm xưởng hoặc quá hạn kiểm định (Có nút gửi mail sự cố cho chủ xe)',
  },
  {
    value: 'DECOMMISSIONED',
    label: 'Ngừng khai thác / Thanh lý',
    badgeText: 'NGỪNG KHAI THÁC',
    color: '#ef4444',
    desc: 'Xe hỏng hóc nặng hoặc hết hạn lưu hành, không còn hoạt động trong hạm đội',
  },
];

export const VehicleFormModal: React.FC<VehicleFormModalProps> = ({
  isOpen,
  onClose,
  mode,
  vehicle,
  onSubmit,
  drivers = [],
  driversMap = {},
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
  const [currentOdometer, setCurrentOdometer] = useState(0);
  const [lastMaintenanceOdometer, setLastMaintenanceOdometer] = useState(0);
  const [status, setStatus] = useState<VehicleStatus>('AVAILABLE');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
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
      setCurrentOdometer(0);
      setLastMaintenanceOdometer(0);
      setStatus('AVAILABLE');
      setImageUrl('');
      setSelectedDriverId(null);
      return;
    }

    setBrand(vehicle.brand);
    setModel(vehicle.model);
    setVehicleType(vehicle.vehicleType);
    setSeatCapacity(vehicle.seatCapacity);
    setManufactureYear(vehicle.manufactureYear);
    setCurrentOdometer(vehicle.currentOdometer);
    setLastMaintenanceOdometer(vehicle.lastMaintenanceOdometer);
    setStatus(vehicle.status);
    setImageUrl(vehicle.imageUrl || '');
    setSelectedDriverId(vehicle.assignedDriverId || null);
  }, [isOpen, mode, vehicle]);

  // Handle vehicle type change to suggest appropriate seats & photo
  const handleTypeChange = (newType: VehicleType) => {
    setVehicleType(newType);
    setSeatCapacity(VEHICLE_TYPE_LABELS[newType].defaultSeats);
    if (!imageUrl || isCreate) {
      setImageUrl(VEHICLE_TYPE_LABELS[newType].sampleImage);
    }
  };

  const handleUseSampleImage = () => {
    const sample = VEHICLE_TYPE_LABELS[vehicleType]?.sampleImage;
    if (sample) {
      setImageUrl(sample);
      showToast('info', 'Đã áp dụng ảnh mẫu chất lượng cao cho phân khúc xe!');
    }
  };

  const selectedDriver = selectedDriverId
    ? drivers.find((d) => d.id === selectedDriverId) || driversMap[selectedDriverId]
    : null;

  // Validation warning for driver license class vs vehicle type
  const getLicenseWarning = () => {
    if (!selectedDriver) return null;
    const licenseClass = selectedDriver.driverLicenseClass?.toUpperCase();
    if (!licenseClass) return null;

    if (vehicleType === 'VAN' && seatCapacity > 9 && ['B1', 'B2', 'C'].includes(licenseClass)) {
      return `Tài xế có bằng hạng ${licenseClass}. Lưu ý: Xe chở khách trên 9 chỗ (Van 16 chỗ) theo luật giao thông yêu cầu bằng lái hạng D hoặc E.`;
    }
    if (vehicleType === 'TRUCK' && ['B1', 'B2'].includes(licenseClass)) {
      return `Tài xế có bằng hạng ${licenseClass}. Lưu ý: Xe tải chở hàng thương mại thường yêu cầu bằng lái hạng C trở lên.`;
    }
    return null;
  };

  const licenseWarning = getLicenseWarning();

  // Tính khoảng cách bảo dưỡng để cảnh báo tình trạng
  const effectiveOdo = isCreate ? initialOdometer : currentOdometer;
  const kmSinceMaintenance = Math.max(0, effectiveOdo - lastMaintenanceOdometer);
  const isMaintenanceOverdue = kmSinceMaintenance >= 5000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreate && !licensePlate.trim()) {
      showToast('error', 'Vui lòng nhập biển số xe');
      return;
    }
    if (!model.trim()) {
      showToast('error', 'Vui lòng nhập dòng xe (Model)');
      return;
    }

    const data: CreateVehicleData | UpdateVehicleData = isCreate
      ? {
          licensePlate: formatPlate(licensePlate),
          brand: brand.trim(),
          model: model.trim(),
          vehicleType,
          seatCapacity,
          manufactureYear,
          initialOdometer,
          imageUrl: imageUrl.trim() || undefined,
        }
      : {
          brand: brand.trim(),
          model: model.trim(),
          vehicleType,
          seatCapacity,
          manufactureYear,
          currentOdometer,
          lastMaintenanceOdometer,
          imageUrl: imageUrl.trim() || undefined,
        };

    setIsSubmitting(true);
    try {
      await onSubmit(data, selectedDriverId, status);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCreate ? 'Thêm phương tiện mới vào đội xe' : `Chỉnh sửa thông tin xe: ${vehicle?.licensePlate ?? ''}`}
      maxWidth="800px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* KHỐI 1: THÔNG TIN CHI TIẾT CỦA XE */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem', color: 'var(--accent-cyan)' }}>
            <Car size={18} />
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Thông số chi tiết phương tiện
            </h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {isCreate ? (
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
                  style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--accent-cyan)' }}
                  required
                />
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Biển số xe (Cố định)</label>
                <input
                  type="text"
                  value={vehicle?.licensePlate || ''}
                  className="form-input mono"
                  style={{ fontWeight: 700, opacity: 0.8 }}
                  disabled
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                Hãng xe <span style={{ color: 'var(--accent-rose)' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Toyota, Ford, VinFast..."
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="form-input"
                  list="brand-suggestions"
                  required
                />
                <datalist id="brand-suggestions">
                  {POPULAR_BRANDS.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label">
                Dòng xe (Model) <span style={{ color: 'var(--accent-rose)' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="VD: Camry 2.5Q, Ranger Wildtrak, VF8 Plus..."
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
                onChange={(e) => handleTypeChange(e.target.value as VehicleType)}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
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
                onChange={(e) => setManufactureYear(parseInt(e.target.value, 10) || new Date().getFullYear())}
                className="form-input"
                required
              />
            </div>

            {isCreate ? (
              <div className="form-group">
                <label className="form-label">Km ban đầu (Odometer)</label>
                <input
                  type="number"
                  min="0"
                  value={initialOdometer}
                  onChange={(e) => setInitialOdometer(parseInt(e.target.value, 10) || 0)}
                  className="form-input mono"
                  required
                />
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Km hiện tại (Odometer)</label>
                <input
                  type="number"
                  min="0"
                  value={currentOdometer}
                  onChange={(e) => setCurrentOdometer(parseInt(e.target.value, 10) || 0)}
                  className="form-input mono"
                  required
                />
              </div>
            )}
          </div>

          {!isCreate && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Km bảo dưỡng gần nhất</label>
                <input
                  type="number"
                  min="0"
                  value={lastMaintenanceOdometer}
                  onChange={(e) => setLastMaintenanceOdometer(parseInt(e.target.value, 10) || 0)}
                  className="form-input mono"
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px', display: 'block' }}>
                  Chu kỳ bảo dưỡng tiếp theo sẽ được tính sau mỗi 5.000 km.
                </span>
              </div>
            </div>
          )}

          {/* Đường dẫn ảnh xe */}
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label className="form-label" style={{ margin: 0 }}>Đường dẫn ảnh xe (URL)</label>
              <button
                type="button"
                onClick={handleUseSampleImage}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <Sparkles size={12} color="var(--accent-cyan)" /> Dùng ảnh mẫu chuẩn
              </button>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="form-input"
                style={{ flex: 1 }}
              />
              {imageUrl && (
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid var(--border-color)',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={imageUrl}
                    alt="Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KHỐI 2: TÌNH TRẠNG XE & TRẠNG THÁI VẬN HÀNH */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-amber)' }}>
              <ShieldAlert size={18} />
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Tình trạng xe & Trạng thái vận hành
              </h4>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              {isCreate ? 'Thiết lập tình trạng ban đầu' : 'Cập nhật tình trạng hiện tại'}
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">
              Tình trạng vận hành xe <span style={{ color: 'var(--accent-rose)' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {STATUS_OPTIONS.map((opt) => {
                const isSelected = status === opt.value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => setStatus(opt.value)}
                    style={{
                      border: isSelected ? `2px solid ${opt.color}` : '1px solid var(--border-color)',
                      background: isSelected ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '10px',
                      padding: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: isSelected ? opt.color : 'var(--text-main)' }}>
                        {opt.label}
                      </span>
                      <input
                        type="radio"
                        name="vehicle-status"
                        checked={isSelected}
                        onChange={() => setStatus(opt.value)}
                        style={{ accentColor: opt.color }}
                      />
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                      {opt.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Đánh giá tình trạng kỹ thuật & định mức bảo dưỡng */}
          <div
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              background: isMaintenanceOverdue ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.08)',
              border: isMaintenanceOverdue ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            {isMaintenanceOverdue ? (
              <>
                <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, color: '#f87171', fontSize: '0.85rem' }}>
                    Tình trạng kỹ thuật: QUÁ HẠN BẢO DƯỠNG ĐỊNH KỲ
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                    Xe đã vận hành <strong>{kmSinceMaintenance.toLocaleString('vi-VN')} km</strong> kể từ lần bảo dưỡng gần nhất (vượt định mức 5.000 km). Hệ thống sẽ kích hoạt tính năng gửi mail thông báo sự cố cho chủ xe.
                  </div>
                </div>
              </>
            ) : (
              <>
                <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, color: '#34d399', fontSize: '0.85rem' }}>
                    Tình trạng kỹ thuật: AN TOÀN / ĐẠT CHUẨN KIỂM ĐỊNH
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                    Xe đã đi {kmSinceMaintenance.toLocaleString('vi-VN')} km. Còn lại {Math.max(0, 5000 - kmSinceMaintenance).toLocaleString('vi-VN')} km nữa tới kỳ bảo dưỡng định kỳ tiếp theo.
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* KHỐI 3: THÔNG TIN CHI TIẾT TÀI XẾ PHỤ TRÁCH */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-emerald)' }}>
              <UserIcon size={18} />
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Thông tin phân công tài xế phụ trách
              </h4>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              {isCreate ? 'Tùy chọn gán tài xế ngay' : 'Có thể thay đổi hoặc thu hồi'}
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Chọn tài xế phụ trách</label>
            <select
              value={selectedDriverId || ''}
              onChange={(e) => setSelectedDriverId(e.target.value ? parseInt(e.target.value, 10) : null)}
              className="form-select"
            >
              <option value="">-- Chưa phân công (Để trống phương tiện) --</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName} {d.driverLicenseClass ? `[Bằng ${d.driverLicenseClass}]` : ''} - {d.phone || d.email}
                </option>
              ))}
            </select>
          </div>

          {/* DRIVER PREVIEW CARD THỜI GIAN THỰC */}
          {selectedDriver ? (
            <div
              style={{
                marginTop: '1rem',
                background: 'rgba(16, 185, 129, 0.06)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '10px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      color: '#fff',
                      fontSize: '0.9rem',
                    }}
                  >
                    {selectedDriver.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                      {selectedDriver.fullName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Tài xế chuyên nghiệp hệ thống VMS
                    </div>
                  </div>
                </div>

                {selectedDriver.driverLicenseClass && (
                  <span
                    className="badge badge-neutral"
                    style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#34d399',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      fontWeight: 700,
                      padding: '3px 8px',
                    }}
                  >
                    Bằng lái hạng {selectedDriver.driverLicenseClass}
                  </span>
                )}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.75rem',
                  fontSize: '0.8125rem',
                  borderTop: '1px dashed rgba(16, 185, 129, 0.2)',
                  paddingTop: '0.75rem',
                }}
              >
                <div>
                  <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                    <Phone size={12} style={{ color: 'var(--accent-emerald)' }} /> Điện thoại:
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                    {selectedDriver.phone || 'Chưa cập nhật'}
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                    <Mail size={12} style={{ color: 'var(--accent-blue)' }} /> Email:
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedDriver.email}
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                    <FileText size={12} /> Số GPLX:
                  </div>
                  <div className="mono" style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                    {selectedDriver.driverLicenseNumber || 'Đang cập nhật'}
                  </div>
                </div>
              </div>

              {/* Cảnh báo hạng bằng lái nếu có */}
              {licenseWarning && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--accent-amber)',
                    fontSize: '0.75rem',
                    background: 'rgba(245, 158, 11, 0.1)',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                  }}
                >
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  <span>{licenseWarning}</span>
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.5rem', fontStyle: 'italic' }}>
              Xe sẽ ở trạng thái chưa phân công và có thể bàn giao cho tài xế bất kỳ lúc nào sau này.
            </div>
          )}
        </div>

        {/* NÚT THAO TÁC */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
            Hủy bỏ
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting
              ? isCreate ? 'Đang thêm phương tiện...' : 'Đang cập nhật...'
              : isCreate ? 'Thêm phương tiện vào đội xe' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default VehicleFormModal;