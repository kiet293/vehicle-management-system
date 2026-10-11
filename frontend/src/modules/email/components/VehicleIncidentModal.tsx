import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Send,
  Car,
  Wrench,
  ShieldAlert,
  User,
  UserCheck,
  Mail,
  Phone,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { emailService } from '../services/emailService';
import { Vehicle, User as UserType } from '../../../types';
import { useToast } from '../../../context/ToastContext';

interface VehicleIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vehicles: Vehicle[];
  initialVehicle?: Vehicle | null;
  driversMap?: Record<number, UserType>;
}

type IncidentType = 'MAINTENANCE_DUE' | 'TECHNICAL_BREAKDOWN' | 'TRIP_INCIDENT' | 'SAFETY_RECALL';

export const VehicleIncidentModal: React.FC<VehicleIncidentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  vehicles,
  initialVehicle = null,
  driversMap,
}) => {
  const { showToast } = useToast();

  // Selected vehicle & Incident details
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | ''>('');
  const [incidentType, setIncidentType] = useState<IncidentType>('MAINTENANCE_DUE');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter vehicles that have actual issues/incidents
  const incidentVehicles = vehicles.filter(
    (v) => v.maintenanceDue || v.status === 'MAINTENANCE' || v.status === 'DECOMMISSIONED'
  );

  // Pre-fill when modal opens or initialVehicle changes
  useEffect(() => {
    if (isOpen) {
      const targetVehicle =
        initialVehicle ||
        incidentVehicles[0] ||
        vehicles[0] ||
        null;

      if (targetVehicle) {
        setSelectedVehicleId(targetVehicle.id);
        const determinedType: IncidentType =
          targetVehicle.status === 'MAINTENANCE'
            ? 'TECHNICAL_BREAKDOWN'
            : targetVehicle.maintenanceDue
            ? 'MAINTENANCE_DUE'
            : 'TRIP_INCIDENT';

        setIncidentType(determinedType);
        generateDraftContent(targetVehicle, determinedType);
      } else {
        setSelectedVehicleId('');
        setSubject('');
        setContent('');
        setCustomerEmail('');
      }
    }
  }, [isOpen, initialVehicle]);

  // Generate standardized customer incident alert content
  const generateDraftContent = (vehicle: Vehicle, type: IncidentType, custName = '') => {
    const kmExceeded = vehicle.currentOdometer - vehicle.lastMaintenanceOdometer;
    let incidentLabel = '';
    let descriptionText = '';

    switch (type) {
      case 'MAINTENANCE_DUE':
        incidentLabel = 'Đến kỳ bảo dưỡng định kỳ khẩn cấp';
        descriptionText = `Hệ thống phát hiện phương tiện đã đạt chỉ số công-tơ-mét: ${vehicle.currentOdometer.toLocaleString('vi-VN')} km. Quãng đường vận hành đã vượt ngưỡng định mức kiểm định bảo dưỡng (+${kmExceeded > 0 ? kmExceeded.toLocaleString('vi-VN') : 0} km kể từ lần bảo dưỡng gần nhất).`;
        break;
      case 'TECHNICAL_BREAKDOWN':
        incidentLabel = 'Sự cố kỹ thuật / Đang bảo trì gara';
        descriptionText = `Phương tiện đang trong trạng thái BẢO TRÌ KỸ THUẬT để kiểm tra và khắc phục sự cố hệ thống truyền động và phụ tùng nhằm đảm bảo tiêu chuẩn an toàn lưu thông.`;
        break;
      case 'TRIP_INCIDENT':
        incidentLabel = 'Sự cố phát sinh trên hành trình';
        descriptionText = `Phương tiện ghi nhận phát sinh sự cố hoặc chi phí phát sinh bất thường trong quá trình điều phối vận hành. Ban Kỹ thuật đang phối hợp giải quyết.`;
        break;
      case 'SAFETY_RECALL':
        incidentLabel = 'Cảnh báo an toàn & Kiểm tra khẩn';
        descriptionText = `Phương tiện cần tạm ngưng lịch trình để kiểm tra hệ thống phanh, lốp và cảm biến an toàn theo quy trình vận hành phương tiện định kỳ.`;
        break;
    }

    const driver = vehicle.assignedDriverId && driversMap ? driversMap[vehicle.assignedDriverId] : null;
    const driverName = vehicle.assignedDriverName || driver?.fullName || 'Chưa phân bổ tài xế';
    const driverPhone = driver?.phone || 'Đang cập nhật';
    const driverEmail = driver?.email || 'Đang cập nhật';
    const driverLicense = driver?.driverLicenseClass
      ? `Hạng ${driver.driverLicenseClass}${driver.driverLicenseNumber ? ` (Số: ${driver.driverLicenseNumber})` : ''}`
      : (driver?.driverLicenseNumber || 'Đang cập nhật');

    const recipientGreeting = custName ? `Kính gửi ${custName},` : `Kính gửi Quý Khách hàng / Quý Chủ xe,`;
    const draftSubject = `[VMS THÔNG BÁO SỰ CỐ] Phương tiện ${vehicle.licensePlate} (${vehicle.brand} ${vehicle.model}) - ${incidentLabel}`;

    const draftBody = `${recipientGreeting}\n\n` +
      `Hệ thống Quản lý Phương tiện VMS xin trân trọng thông báo về tình trạng sự cố kỹ thuật của phương tiện:\n\n` +
      `🚗 THÔNG TIN PHƯƠNG TIỆN:\n` +
      ` • Biển kiểm soát: ${vehicle.licensePlate}\n` +
      ` • Dòng xe: ${vehicle.brand} ${vehicle.model} (${vehicle.manufactureYear}) - ${vehicle.seatCapacity} chỗ\n` +
      ` • Tình trạng sự cố: ${incidentLabel}\n` +
      ` • Chỉ số Odometer: ${vehicle.currentOdometer.toLocaleString('vi-VN')} km (Kỳ bảo dưỡng trước: ${vehicle.lastMaintenanceOdometer.toLocaleString('vi-VN')} km)\n\n` +
      `👨‍✈️ THÔNG TIN TÀI XẾ PHỤ TRÁCH:\n` +
      ` • Họ và tên tài xế: ${driverName}\n` +
      ` • Số điện thoại liên hệ: ${driverPhone}\n` +
      ` • Email tài xế: ${driverEmail}\n` +
      ` • Giấy phép lái xe: ${driverLicense}\n\n` +
      `🔧 CHI TIẾT SỰ CỐ & PHƯƠNG ÁN XỬ LÝ:\n` +
      `${descriptionText}\n\n` +
      `Đội ngũ kỹ thuật VMS đang ưu tiên xử lý để phương tiện sớm trở lại trạng thái sẵn sàng và an toàn tối đa.\n` +
      `Nếu Quý khách / Quý Chủ xe cần hỗ trợ thêm thông tin hoặc đổi xe thay thế, xin vui lòng liên hệ ngay với Tổng đài Điều phối VMS.\n\n` +
      `Trân trọng,\nHệ thống Quản lý Phương tiện VMS`;

    setSubject(draftSubject);
    setContent(draftBody);
  };

  const handleVehicleChange = (vehicleId: number) => {
    setSelectedVehicleId(vehicleId);
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (vehicle) {
      generateDraftContent(vehicle, incidentType, customerName);
    }
  };

  const handleIncidentTypeChange = (type: IncidentType) => {
    setIncidentType(type);
    const vehicle = vehicles.find((v) => v.id === Number(selectedVehicleId));
    if (vehicle) {
      generateDraftContent(vehicle, type, customerName);
    }
  };

  const handleSendIncidentEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId) {
      showToast('error', 'Vui lòng chọn phương tiện gặp sự cố.');
      return;
    }
    if (!subject.trim()) {
      showToast('error', 'Vui lòng nhập tiêu đề email.');
      return;
    }
    if (!content.trim()) {
      showToast('error', 'Vui lòng nhập nội dung thông báo sự cố.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await emailService.sendEmail({
        to: customerEmail.trim(), // Nếu để trống, backend tự động gửi tới email người dùng hệ thống
        subject: subject.trim(),
        content: content.trim(),
        type: 'AUTO_NOTIFICATION',
      });

      if (res.success && res.data) {
        showToast(
          'success',
          `Đã gửi email thông báo sự cố thành công tới: ${res.data.recipient}!`
        );
        onSuccess();
        onClose();
      } else {
        showToast('error', res.message || 'Gửi email thông báo sự cố thất bại.');
      }
    } catch {
      showToast('error', 'Lỗi hệ thống khi gửi email thông báo sự cố.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentSelectedVehicle = vehicles.find((v) => v.id === Number(selectedVehicleId));
  const currentDriver = currentSelectedVehicle?.assignedDriverId && driversMap
    ? driversMap[currentSelectedVehicle.assignedDriverId]
    : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thông Báo Sự Cố Phương Tiện Cho Chủ Xe / Khách Hàng"
      maxWidth="720px"
    >
      <form onSubmit={handleSendIncidentEmail} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Banner Info */}
        <div
          style={{
            padding: '0.875rem 1rem',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(245, 158, 11, 0.12) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
          }}
        >
          <AlertTriangle size={20} color="var(--accent-rose)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
            <strong>Thông báo sự cố tự động:</strong> Hệ thống tổng hợp đầy đủ thông tin phương tiện cùng thông tin tài xế phụ trách để gửi email thông báo trực tiếp cho Chủ xe hoặc Khách hàng khi phát sinh sự cố kỹ thuật hoặc quá hạn bảo dưỡng.
          </div>
        </div>

        {/* 1. Vehicle Selection */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Car size={14} /> Chọn phương tiện gặp sự cố <span style={{ color: 'var(--accent-rose)' }}>*</span>
            </span>
            {incidentVehicles.length > 0 && (
              <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                {incidentVehicles.length} xe đang có sự cố / bảo trì
              </span>
            )}
          </label>
          <select
            className="form-select"
            value={selectedVehicleId}
            onChange={(e) => handleVehicleChange(Number(e.target.value))}
            required
          >
            <option value="">-- Chọn phương tiện cần gửi thông báo sự cố --</option>
            {incidentVehicles.length > 0 && (
              <optgroup label="⚠️ Phương tiện đang gặp sự cố / Quá hạn bảo dưỡng:">
                {incidentVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.licensePlate} - {v.brand} {v.model} ({v.status === 'MAINTENANCE' ? 'ĐANG BẢO TRÌ' : 'QUÁ HẠN BẢO DƯỠNG'})
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="Toàn bộ phương tiện trong đội xe:">
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.licensePlate} - {v.brand} {v.model} ({v.status})
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Vehicle & Driver Quick Summary Cards */}
        {currentSelectedVehicle && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '0.75rem',
            }}
          >
            {/* Box 1: Thông tin xe */}
            <div
              className="glass-panel"
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                fontSize: '0.8125rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Car size={14} /> {currentSelectedVehicle.licensePlate}
                </span>
                {currentSelectedVehicle.status === 'MAINTENANCE' ? (
                  <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>
                    <Wrench size={10} /> ĐANG BẢO TRÌ
                  </span>
                ) : currentSelectedVehicle.maintenanceDue ? (
                  <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                    <AlertTriangle size={10} /> QUÁ HẠN BD
                  </span>
                ) : (
                  <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                    <CheckCircle2 size={10} /> {currentSelectedVehicle.status}
                  </span>
                )}
              </div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                {currentSelectedVehicle.brand} {currentSelectedVehicle.model} ({currentSelectedVehicle.manufactureYear})
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                Odometer: <strong className="mono" style={{ color: 'var(--text-main)' }}>{currentSelectedVehicle.currentOdometer.toLocaleString('vi-VN')} km</strong>
                {' • '}
                BD trước: <span className="mono">{currentSelectedVehicle.lastMaintenanceOdometer.toLocaleString('vi-VN')} km</span>
              </div>
            </div>

            {/* Box 2: Thông tin tài xế phụ trách */}
            <div
              className="glass-panel"
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                fontSize: '0.8125rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                border: '1px solid var(--border-color)',
                background: currentDriver ? 'rgba(59, 130, 246, 0.05)' : undefined,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <UserCheck size={14} style={{ color: 'var(--accent-blue)' }} /> Tài xế phụ trách
                </span>
                {currentDriver?.driverLicenseClass && (
                  <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>
                    Hạng {currentDriver.driverLicenseClass}
                  </span>
                )}
              </div>

              {currentSelectedVehicle.assignedDriverName || currentDriver ? (
                <>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    {currentSelectedVehicle.assignedDriverName || currentDriver?.fullName}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {currentDriver?.phone && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Phone size={11} style={{ color: 'var(--accent-emerald)' }} />
                        <a href={`tel:${currentDriver.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {currentDriver.phone}
                        </a>
                      </span>
                    )}
                    {currentDriver?.email && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Mail size={11} style={{ color: 'var(--accent-blue)' }} />
                        {currentDriver.email}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ color: 'var(--text-dim)', fontStyle: 'italic', marginTop: '4px' }}>
                  Chưa phân bổ tài xế phụ trách
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. Incident Type Selector */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">
            <ShieldAlert size={14} /> Phân loại sự cố kỹ thuật
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem' }}>
            {[
              { id: 'MAINTENANCE_DUE', label: 'Quá hạn bảo dưỡng', icon: AlertTriangle, color: 'var(--accent-amber)' },
              { id: 'TECHNICAL_BREAKDOWN', label: 'Bảo trì gara / Hỏng hóc', icon: Wrench, color: 'var(--accent-rose)' },
              { id: 'TRIP_INCIDENT', label: 'Sự cố chuyến đi', icon: Car, color: 'var(--accent-blue)' },
              { id: 'SAFETY_RECALL', label: 'Cảnh báo an toàn', icon: ShieldAlert, color: 'var(--accent-purple)' },
            ].map((item) => {
              const IconComp = item.icon;
              const isSelected = incidentType === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleIncidentTypeChange(item.id as IncidentType)}
                  style={{
                    padding: '0.5rem 0.625rem',
                    borderRadius: '8px',
                    border: isSelected ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)',
                    background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-card)',
                    color: isSelected ? 'var(--accent-cyan)' : 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    fontSize: '0.75rem',
                    fontWeight: isSelected ? 600 : 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <IconComp size={13} color={item.color} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Customer / Recipient Email & Name */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              <User size={14} /> Tên chủ xe / Khách hàng
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="ví dụ: Anh Nguyễn Văn An / Chủ sở hữu xe"
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                if (currentSelectedVehicle) {
                  generateDraftContent(currentSelectedVehicle, incidentType, e.target.value);
                }
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Mail size={14} /> Email nhận thông báo
              </span>
              {currentDriver?.email && (
                <button
                  type="button"
                  onClick={() => setCustomerEmail(currentDriver.email)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-cyan)',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  Điền email tài xế
                </button>
              )}
            </label>
            <input
              type="email"
              className="form-input"
              placeholder="Để trống sẽ gửi tới email cấu hình hệ thống"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
          </div>
        </div>

        {/* 4. Subject */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">
            <FileText size={14} /> Tiêu đề email thông báo sự cố <span style={{ color: 'var(--accent-rose)' }}>*</span>
          </label>
          <input
            type="text"
            className="form-input"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
        </div>

        {/* 5. Content */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">
            <FileText size={14} /> Nội dung thư gửi khách hàng <span style={{ color: 'var(--accent-rose)' }}>*</span>
          </label>
          <textarea
            className="form-textarea"
            rows={7}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            style={{ fontSize: '0.8125rem', lineHeight: 1.5, fontFamily: 'inherit' }}
          />
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            * Email sẽ tự động được gửi từ tên sản phẩm: <strong>Hệ thống Quản lý Phương tiện VMS</strong>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
            Đóng
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || !selectedVehicleId}
            style={{ fontWeight: 600, padding: '0.5rem 1.25rem' }}
          >
            <Send size={15} />
            <span>{isSubmitting ? 'Đang gửi mail cho khách hàng...' : 'Gửi Mail Cho Khách Hàng'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default VehicleIncidentModal;
