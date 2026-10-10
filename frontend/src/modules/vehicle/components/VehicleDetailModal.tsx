import React, { useState } from 'react';
import {
  Car,
  Calendar,
  Users,
  Gauge,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  UserX,
  Phone,
  Mail,
  Edit,
  Send,
  ArrowRight,
  History,
  Copy,
  Check,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { StatusBadge } from './StatusBadge';
import { Vehicle, User, VehicleStatus } from '../../../types';
import { useToast } from '../../../context/ToastContext';

interface VehicleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
  driver?: User | null;
  isDriver: boolean;
  onChangeStatus?: (v: Vehicle, status: VehicleStatus) => void;
  onEdit: (v: Vehicle) => void;
  onAssign: (v: Vehicle) => void;
  onReturn: (v: Vehicle) => void;
  onFinishMaintenance: (v: Vehicle) => void;
  onViewTrips: (v: Vehicle) => void;
  onSendIncidentEmail?: (v: Vehicle) => void;
}

const VEHICLE_TYPE_MAP: Record<string, string> = {
  SEDAN: 'Sedan (4-5 chỗ)',
  SUV: 'SUV / Crossover (5-7 chỗ)',
  PICKUP: 'Xe bán tải (Pickup)',
  VAN: 'Xe chở khách 16 chỗ (Van)',
  TRUCK: 'Xe tải vận chuyển hàng',
};

export const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  driver,
  isDriver,
  onChangeStatus,
  onEdit,
  onAssign,
  onReturn,
  onFinishMaintenance,
  onViewTrips,
  onSendIncidentEmail,
}) => {
  const { showToast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!vehicle) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    showToast('success', `Đã sao chép ${label}: ${text}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isIncident =
    vehicle.status === 'MAINTENANCE' ||
    vehicle.maintenanceDue ||
    vehicle.status === 'DECOMMISSIONED';

  const kmSinceMaintenance = Math.max(0, vehicle.currentOdometer - vehicle.lastMaintenanceOdometer);
  const maintenanceProgress = Math.min(100, Math.round((kmSinceMaintenance / 5000) * 100));

  const driverName = vehicle.assignedDriverName || driver?.fullName;
  const driverPhone = driver?.phone;
  const driverEmail = driver?.email;
  const driverLicenseClass = driver?.driverLicenseClass;
  const driverLicenseNum = driver?.driverLicenseNumber;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Chi tiết phương tiện: ${vehicle.licensePlate}`}
      maxWidth="780px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Banner cảnh báo sự cố nếu có */}
        {isIncident && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.45)',
              borderRadius: '12px',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ef4444',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#f87171', fontSize: '0.95rem' }}>
                  {vehicle.status === 'MAINTENANCE'
                    ? 'Phương tiện đang trong xưởng bảo trì / sửa chữa sự cố'
                    : vehicle.maintenanceDue
                    ? 'Cảnh báo: Xe đã vượt định mức bảo dưỡng quy định (≥ 5.000 km)'
                    : 'Phương tiện đã ngừng khai thác vận hành'}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Đã vận hành <strong>{kmSinceMaintenance.toLocaleString('vi-VN')} km</strong> kể từ lần bảo dưỡng trước.
                </div>
              </div>
            </div>

            {onSendIncidentEmail && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSendIncidentEmail(vehicle);
                }}
                className="btn btn-sm"
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)',
                  cursor: 'pointer',
                }}
              >
                <Mail size={15} /> Gửi mail thông báo sự cố cho chủ xe
              </button>
            )}
          </div>
        )}

        {/* Hero header: Hình ảnh + Thông tin chính */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: vehicle.imageUrl ? '240px 1fr' : '1fr',
            gap: '1.25rem',
            alignItems: 'stretch',
          }}
        >
          {vehicle.imageUrl && (
            <div
              style={{
                position: 'relative',
                borderRadius: '14px',
                overflow: 'hidden',
                background: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid var(--border-color)',
                minHeight: '160px',
              }}
            >
              <img
                src={vehicle.imageUrl}
                alt={vehicle.model}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                }}
              >
                <StatusBadge status={vehicle.status} />
              </div>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.75rem',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                  <span
                    className="mono"
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      color: 'var(--accent-cyan)',
                      letterSpacing: '0.05em',
                      padding: '2px 8px',
                      background: 'rgba(6, 182, 212, 0.12)',
                      borderRadius: '6px',
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                    }}
                  >
                    {vehicle.licensePlate}
                  </span>
                  {!vehicle.imageUrl && <StatusBadge status={vehicle.status} />}
                </div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', margin: '4px 0 0 0' }}>
                  {vehicle.brand} {vehicle.model}
                </h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {VEHICLE_TYPE_MAP[vehicle.vehicleType] || vehicle.vehicleType} &bull; Sản xuất năm {vehicle.manufactureYear}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(vehicle.licensePlate, 'Biển số')}
                className="btn btn-secondary btn-icon"
                title="Sao chép biển số xe"
              >
                {copiedField === 'Biển số' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              </button>
            </div>

            {/* Thông số kỹ thuật nhanh */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.75rem',
                marginTop: '0.5rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border-color)',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={12} /> Sức chứa
                </div>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                  {vehicle.seatCapacity} chỗ ngồi
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} /> Năm SX
                </div>
                <div className="mono" style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                  {vehicle.manufactureYear} ({new Date().getFullYear() - vehicle.manufactureYear} năm)
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Car size={12} /> Phân khúc
                </div>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                  {vehicle.vehicleType}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2 Cột: Thông số Vận hành & Thông tin Tài xế */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          {/* CỘT 1: TÌNH TRẠNG XE & KỸ THUẬT BẢO DƯỠNG */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '1.125rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.875rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-amber)' }}>
                <Gauge size={18} />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Tình trạng xe & Kiểm định kỹ thuật
                </h4>
              </div>
              <StatusBadge status={vehicle.status} />
            </div>

            {/* Khối mô tả chi tiết tình trạng xe hiện tại */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '0.75rem',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.375rem',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                TÌNH TRẠNG VẬN HÀNH HIỆN TẠI:
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {vehicle.status === 'AVAILABLE' && '🟢 Sẵn sàng vận hành: Xe đạt chuẩn an toàn, sạch sẽ, sẵn sàng nhận chuyến.'}
                {vehicle.status === 'IN_USE' && '🔵 Đang hoạt động: Phương tiện đang trên tuyến hoặc đã giao cho tài xế điều khiển.'}
                {vehicle.status === 'MAINTENANCE' && '🟠 Bảo dưỡng / Gặp sự cố: Xe đang nằm gara bảo trì sửa chữa hoặc cần kiểm định.'}
                {vehicle.status === 'DECOMMISSIONED' && '🔴 Ngừng khai thác: Xe không còn tham gia hoạt động vận chuyển của đội xe.'}
              </div>

              {/* Thông báo tình trạng định mức kỹ thuật */}
              <div
                style={{
                  fontSize: '0.75rem',
                  color: kmSinceMaintenance >= 5000 ? '#f87171' : 'var(--text-muted)',
                  marginTop: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {kmSinceMaintenance >= 5000 ? (
                  <>
                    <AlertTriangle size={13} color="#ef4444" />
                    <strong>Cảnh báo kỹ thuật:</strong> Quá hạn kiểm định bảo dưỡng (+{(kmSinceMaintenance - 5000).toLocaleString('vi-VN')} km).
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={13} color="#10b981" />
                    <strong>Đạt chuẩn kỹ thuật:</strong> Còn {Math.max(0, 5000 - kmSinceMaintenance).toLocaleString('vi-VN')} km tới kỳ bảo dưỡng tiếp theo.
                  </>
                )}
              </div>
            </div>

            {/* Odometer số liệu */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Odometer hiện tại</div>
                <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '2px' }}>
                  {vehicle.currentOdometer.toLocaleString('vi-VN')} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>km</span>
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bảo dưỡng lần cuối</div>
                <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '2px' }}>
                  {vehicle.lastMaintenanceOdometer.toLocaleString('vi-VN')} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>km</span>
                </div>
              </div>
            </div>

            {/* Thanh tiến độ bảo dưỡng định mức 5.000 km */}
            <div style={{ marginTop: '0.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Đã chạy từ lần bảo dưỡng trước:</span>
                <span className="mono" style={{ fontWeight: 700, color: kmSinceMaintenance >= 5000 ? '#ef4444' : 'var(--text-main)' }}>
                  {kmSinceMaintenance.toLocaleString('vi-VN')} / 5.000 km ({maintenanceProgress}%)
                </span>
              </div>
              <div
                style={{
                  height: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${maintenanceProgress}%`,
                    background:
                      kmSinceMaintenance >= 5000
                        ? 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)'
                        : kmSinceMaintenance >= 4000
                        ? 'var(--accent-amber)'
                        : 'linear-gradient(90deg, #10b981 0%, #06b6d4 100%)',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>

            {/* Chuyển đổi nhanh tình trạng xe */}
            {!isDriver && onChangeStatus && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-color)' }}>
                {vehicle.status === 'AVAILABLE' && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onChangeStatus(vehicle, 'MAINTENANCE');
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, color: 'var(--accent-amber)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <Wrench size={13} /> Chuyển sang BẢO DƯỠNG / SỰ CỐ
                  </button>
                )}
                {vehicle.status === 'MAINTENANCE' && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onChangeStatus(vehicle, 'AVAILABLE');
                    }}
                    className="btn btn-sm"
                    style={{ flex: 1, background: 'var(--accent-amber)', color: '#000', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <CheckCircle2 size={13} /> Hoàn tất bảo dưỡng &rarr; SẴN SÀNG
                  </button>
                )}
              </div>
            )}
          </div>

          {/* CỘT 2: THÔNG TIN TÀI XẾ PHỤ TRÁCH */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '1.125rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.875rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-emerald)' }}>
                  <UserCheck size={18} />
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Tài xế phụ trách phương tiện
                  </h4>
                </div>
                {driverLicenseClass && (
                  <span className="badge badge-neutral" style={{ fontWeight: 700, fontSize: '0.75rem', padding: '2px 8px' }}>
                    Hạng {driverLicenseClass}
                  </span>
                )}
              </div>

              {driverName ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: '#fff',
                        flexShrink: 0,
                      }}
                    >
                      {driverName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                        {driverName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <BadgeCheck size={12} color="#10b981" /> Đang nhận nhiệm vụ lái xe
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      background: 'rgba(255, 255, 255, 0.03)',
                      padding: '0.75rem',
                      borderRadius: '10px',
                      fontSize: '0.8125rem',
                    }}
                  >
                    {driverPhone && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Phone size={13} style={{ color: 'var(--accent-emerald)' }} /> Điện thoại:
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <a
                            href={`tel:${driverPhone}`}
                            style={{ color: 'var(--accent-cyan)', fontWeight: 600, textDecoration: 'none' }}
                            title="Bấm để gọi"
                          >
                            {driverPhone}
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopy(driverPhone, 'SĐT')}
                            className="btn btn-secondary btn-icon"
                            style={{ width: '22px', height: '22px', padding: 0 }}
                          >
                            {copiedField === 'SĐT' ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                          </button>
                        </div>
                      </div>
                    )}

                    {driverEmail && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Mail size={13} style={{ color: 'var(--accent-blue)' }} /> Email:
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <a
                            href={`mailto:${driverEmail}`}
                            style={{ color: 'var(--text-main)', textDecoration: 'none', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            title={driverEmail}
                          >
                            {driverEmail}
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopy(driverEmail, 'Email')}
                            className="btn btn-secondary btn-icon"
                            style={{ width: '22px', height: '22px', padding: 0 }}
                          >
                            {copiedField === 'Email' ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                          </button>
                        </div>
                      </div>
                    )}

                    {driverLicenseNum && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <FileText size={13} /> Số GPLX:
                        </span>
                        <span className="mono" style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          {driverLicenseNum}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: '1.25rem 0.75rem',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '10px',
                    border: '1px dashed var(--border-color)',
                  }}
                >
                  <UserX size={32} style={{ color: 'var(--text-dim)', margin: '0 auto 6px auto' }} />
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Chưa phân công tài xế
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                    Xe đang trống và sẵn sàng bàn giao nhiệm vụ mới
                  </div>
                </div>
              )}
            </div>

            {/* Nút hành động nhanh về tài xế */}
            {!isDriver && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                {vehicle.status === 'AVAILABLE' && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onAssign(vehicle);
                    }}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                  >
                    <Send size={14} /> Bàn giao cho tài xế
                  </button>
                )}
                {vehicle.status === 'IN_USE' && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onReturn(vehicle);
                    }}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                  >
                    <ArrowRight size={14} /> Bàn giao lại / Trả xe
                  </button>
                )}
                {vehicle.status === 'MAINTENANCE' && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onFinishMaintenance(vehicle);
                    }}
                    className="btn btn-sm"
                    style={{ flex: 1, background: 'var(--accent-amber)', color: '#000', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                  >
                    <Wrench size={14} /> Hoàn tất bảo dưỡng
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer: Các nút điều hướng / thao tác */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-color)',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <button
            type="button"
            onClick={() => {
              onClose();
              onViewTrips(vehicle);
            }}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <History size={15} /> Nhật ký hành trình xe
          </button>

          <div style={{ display: 'flex', gap: '0.625rem' }}>
            {!isDriver && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(vehicle);
                }}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Edit size={15} /> Chỉnh sửa thông tin xe
              </button>
            )}
            <button type="button" onClick={onClose} className="btn btn-primary">
              Đóng
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default VehicleDetailModal;
