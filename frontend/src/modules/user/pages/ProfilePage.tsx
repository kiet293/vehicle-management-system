import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { userService } from '../services/userService';
import { vehicleService } from '../../vehicle/services/vehicleService';
import { Vehicle } from '../../../types';
import {
  User,
  Mail,
  Phone,
  Shield,
  Key,
  Lock,
  Calendar,
  Car,
  FileText,
  Check,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  Award,
  Truck,
  UserCheck,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type ActiveTab = 'info' | 'security' | 'vehicles';

export const ProfilePage: React.FC = () => {
  const { user, updateUser, refreshUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<ActiveTab>('info');

  // Personal Info Form
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [licenseClass, setLicenseClass] = useState(user?.driverLicenseClass || '');
  const [licenseNumber, setLicenseNumber] = useState(user?.driverLicenseNumber || '');
  const [isSavingInfo, setIsSavingInfo] = useState(false);

  // Security Form
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Driver Vehicles / Fleet Stats
  const [assignedVehicles, setAssignedVehicles] = useState<Vehicle[]>([]);
  const [totalFleetCount, setTotalFleetCount] = useState<number>(0);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);

  // Keep state synced with current user
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setLicenseClass(user.driverLicenseClass || '');
      setLicenseNumber(user.driverLicenseNumber || '');
    }
  }, [user]);

  // Fetch driver vehicles or fleet overview
  useEffect(() => {
    if (!user) return;
    setIsLoadingVehicles(true);
    vehicleService.getVehicles()
      .then((vehicles) => {
        setTotalFleetCount(vehicles.length);
        if (user.role === 'DRIVER') {
          const driverVehicles = vehicles.filter((v) => v.assignedDriverId === user.id);
          setAssignedVehicles(driverVehicles);
        } else {
          setAssignedVehicles(vehicles.slice(0, 4));
        }
      })
      .catch((err) => {
        console.error('Failed to load vehicles for profile:', err);
      })
      .finally(() => {
        setIsLoadingVehicles(false);
      });
  }, [user]);

  if (!user) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
        Không tìm thấy thông tin phiên đăng nhập. Vui lòng đăng nhập lại.
      </div>
    );
  }

  // Handle Save Personal Info
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast('error', 'Họ và tên không được để trống');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      showToast('error', 'Email không hợp lệ');
      return;
    }

    try {
      setIsSavingInfo(true);
      const updated = await userService.updateUser(user.id, {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        driverLicenseClass: user.role === 'DRIVER' ? licenseClass.trim() : undefined,
        driverLicenseNumber: user.role === 'DRIVER' ? licenseNumber.trim() : undefined,
      });

      updateUser(updated);
      showToast('success', 'Cập nhật thông tin hồ sơ thành công!');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin';
      showToast('error', msg);
    } finally {
      setIsSavingInfo(false);
    }
  };

  // Reset Info form
  const handleResetInfo = () => {
    setFullName(user.fullName || '');
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setLicenseClass(user.driverLicenseClass || '');
    setLicenseNumber(user.driverLicenseNumber || '');
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('error', 'Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('error', 'Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      setIsSavingPassword(true);
      await userService.updateUser(user.id, {
        password: newPassword,
      });

      showToast('success', 'Đổi mật khẩu thành công!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu';
      showToast('error', msg);
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Render role badge helper
  const renderRoleBadge = () => {
    if (user.role === 'ADMIN') {
      return (
        <span
          className="badge badge-purple"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '0.35rem 0.75rem', fontSize: '0.8125rem' }}
        >
          <Shield size={14} /> QUẢN TRỊ VIÊN HỆ THỐNG
        </span>
      );
    }
    if (user.role === 'MANAGER') {
      return (
        <span
          className="badge badge-info"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '0.35rem 0.75rem', fontSize: '0.8125rem' }}
        >
          <UserCheck size={14} /> QUẢN LÝ ĐỘI XE
        </span>
      );
    }
    return (
      <span
        className="badge badge-success"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '0.35rem 0.75rem', fontSize: '0.8125rem' }}
      >
        <Truck size={14} /> TÀI XẾ DOANH NGHIỆP
      </span>
    );
  };

  return (
    <div className="vms-page-container" style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Main 2-Column Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 340px) 1fr',
          gap: '1.5rem',
          alignItems: 'start',
        }}
        className="profile-grid-container"
      >
        {/* Left Column: Profile Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Main User Card */}
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              padding: '2rem 1.5rem',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.04)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top decorative accent bar */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '5px',
                background: 'linear-gradient(90deg, var(--accent-blue), #8b5cf6, #ec4899)',
              }}
            />

            {/* Avatar Circle with ring */}
            <div
              style={{
                width: '92px',
                height: '92px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-blue), #8b5cf6)',
                color: '#fff',
                fontSize: '2.5rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                boxShadow: '0 8px 24px rgba(59, 130, 246, 0.35)',
                border: '4px solid var(--bg-card)',
                outline: '2px solid rgba(59, 130, 246, 0.3)',
              }}
            >
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </div>

            {/* Name and Handle */}
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.25rem', color: 'var(--text-main)' }}>
              {user.fullName}
            </h2>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>
              @{user.username}
            </div>

            <div style={{ marginBottom: '1.25rem' }}>{renderRoleBadge()}</div>

            {/* Status indicator pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.3rem 0.85rem',
                borderRadius: '9999px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: '#10b981',
                fontSize: '0.75rem',
                fontWeight: 600,
                marginBottom: '1.5rem',
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 8px #10b981',
                }}
              />
              TÀI KHOẢN ĐANG HOẠT ĐỘNG
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: 'var(--border-color)', margin: '0 0 1.25rem' }} />

            {/* Quick Contact & Info List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', textAlign: 'left', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mail size={14} />
                </div>
                <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>Email liên hệ</div>
                  <div style={{ color: 'var(--text-main)', fontWeight: 500 }} title={user.email}>{user.email}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Phone size={14} />
                </div>
                <div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>Số điện thoại</div>
                  <div style={{ color: 'var(--text-main)', fontWeight: 500 }}>{user.phone || 'Chưa cập nhật'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={14} />
                </div>
                <div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>Ngày tham gia</div>
                  <div style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '12/10/2026'}
                  </div>
                </div>
              </div>

              {user.role === 'DRIVER' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Award size={14} />
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>Hạng & Số GPLX</div>
                    <div style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                      {user.driverLicenseClass ? `Hạng ${user.driverLicenseClass}` : 'Chưa có'} - {user.driverLicenseNumber || 'N/A'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Security Badge Card */}
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              padding: '1.25rem',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
              <ShieldCheck size={18} style={{ color: '#10b981' }} />
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                Tình trạng bảo mật
              </div>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: '0.85rem' }}>
              Tài khoản được mã hóa một chiều qua thuật toán BCrypt và phân quyền JWT theo tiêu chuẩn an ninh hệ thống.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              <span>ID Tài khoản: <strong>#{user.id}</strong></span>
              <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>Phiên đăng nhập an toàn</span>
            </div>
          </div>
        </div>

        {/* Right Column: Tabs & Main Content */}
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden',
          }}
        >
          {/* Tab Header Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-color)',
              background: 'rgba(0, 0, 0, 0.02)',
              padding: '0.5rem 1rem 0',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', flex: 1 }}>
              <button
                onClick={() => setActiveTab('info')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.875rem 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: activeTab === 'info' ? 700 : 500,
                  color: activeTab === 'info' ? 'var(--accent-blue)' : 'var(--text-dim)',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'info' ? '2.5px solid var(--accent-blue)' : '2.5px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <User size={16} /> Thông tin cá nhân
              </button>

              <button
                onClick={() => setActiveTab('security')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.875rem 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: activeTab === 'security' ? 700 : 500,
                  color: activeTab === 'security' ? 'var(--accent-blue)' : 'var(--text-dim)',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'security' ? '2.5px solid var(--accent-blue)' : '2.5px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <Key size={16} /> Đổi mật khẩu
              </button>

              <button
                onClick={() => setActiveTab('vehicles')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.875rem 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: activeTab === 'vehicles' ? 700 : 500,
                  color: activeTab === 'vehicles' ? 'var(--accent-blue)' : 'var(--text-dim)',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'vehicles' ? '2.5px solid var(--accent-blue)' : '2.5px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <Car size={16} /> {user.role === 'DRIVER' ? 'Phương tiện phụ trách' : 'Tổng quan quyền hạn'}
              </button>
            </div>

            <button
              onClick={() => refreshUser()}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.8125rem',
                padding: '0.4rem 0.85rem',
                marginBottom: '0.5rem',
                flexShrink: 0,
              }}
              title="Đồng bộ lại thông tin từ hệ thống"
            >
              <RefreshCw size={14} /> Làm mới
            </button>
          </div>

          {/* Tab 1: Personal Info Content */}
          {activeTab === 'info' && (
            <div style={{ padding: '2rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 0.25rem', color: 'var(--text-main)' }}>
                  Hồ sơ định danh cá nhân
                </h3>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-dim)' }}>
                  Cập nhật các thông tin liên lạc và thông tin giấy phép lái xe (đối với tài xế)
                </p>
              </div>

              <form onSubmit={handleSaveInfo}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  {/* Full Name */}
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                      Họ và tên <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <div style={{ position: 'absolute', left: '14px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                        <User size={16} />
                      </div>
                      <input
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: '2.65rem' }}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Nhập họ và tên đầy đủ"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                      Email liên hệ <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <div style={{ position: 'absolute', left: '14px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                        <Mail size={16} />
                      </div>
                      <input
                        type="email"
                        className="form-input"
                        style={{ paddingLeft: '2.65rem' }}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@vms.com"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                      Số điện thoại
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <div style={{ position: 'absolute', left: '14px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                        <Phone size={16} />
                      </div>
                      <input
                        type="tel"
                        className="form-input"
                        style={{ paddingLeft: '2.65rem' }}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ví dụ: 0912345678"
                      />
                    </div>
                  </div>

                  {/* Driver License Fields (only for DRIVER role) */}
                  {user.role === 'DRIVER' && (
                    <>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                          Hạng Giấy phép lái xe (GPLX)
                        </label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <div style={{ position: 'absolute', left: '14px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                            <Award size={16} />
                          </div>
                          <select
                            className="form-select"
                            style={{ paddingLeft: '2.65rem' }}
                            value={licenseClass}
                            onChange={(e) => setLicenseClass(e.target.value)}
                          >
                            <option value="">-- Chọn hạng GPLX --</option>
                            <option value="B1">Hạng B1 (Số tự động)</option>
                            <option value="B2">Hạng B2 (Xe du lịch & Tải &lt; 3.5T)</option>
                            <option value="C">Hạng C (Xe tải nặng &gt; 3.5T)</option>
                            <option value="D">Hạng D (Chở người 10-30 chỗ)</option>
                            <option value="E">Hạng E (Chở người &gt; 30 chỗ)</option>
                            <option value="FC">Hạng FC (Đầu kéo, Container)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                          Số Giấy phép lái xe
                        </label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <div style={{ position: 'absolute', left: '14px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                            <FileText size={16} />
                          </div>
                          <input
                            type="text"
                            className="form-input"
                            style={{ paddingLeft: '2.65rem' }}
                            value={licenseNumber}
                            onChange={(e) => setLicenseNumber(e.target.value)}
                            placeholder="Ví dụ: 790182348291"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Read-only system account fields */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.5rem' }}>
                      Tên đăng nhập (Hệ thống cấp)
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <div style={{ position: 'absolute', left: '14px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                        <Lock size={16} />
                      </div>
                      <input
                        type="text"
                        className="form-input"
                        value={user.username}
                        disabled
                        style={{ paddingLeft: '2.65rem', paddingRight: '4.5rem' }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          right: '10px',
                          fontSize: '0.7rem',
                          color: 'var(--text-dim)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--border-color)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          userSelect: 'none',
                        }}
                      >
                        Chỉ đọc
                      </span>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.5rem' }}>
                      Vai trò phân quyền
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <div style={{ position: 'absolute', left: '14px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                        <Shield size={16} />
                      </div>
                      <input
                        type="text"
                        className="form-input"
                        value={user.role}
                        disabled
                        style={{ paddingLeft: '2.65rem', paddingRight: '4.5rem' }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          right: '10px',
                          fontSize: '0.7rem',
                          color: 'var(--accent-blue)',
                          background: 'rgba(59, 130, 246, 0.1)',
                          border: '1px solid rgba(59, 130, 246, 0.25)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          userSelect: 'none',
                          fontWeight: 600,
                        }}
                      >
                        Hệ thống
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                  <button
                    type="button"
                    onClick={handleResetInfo}
                    className="btn btn-secondary"
                    disabled={isSavingInfo}
                  >
                    Đặt lại
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSavingInfo}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    {isSavingInfo ? (
                      <>
                        <RefreshCw size={16} className="spin-animation" /> Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save size={16} /> Lưu thay đổi
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab 2: Security & Change Password */}
          {activeTab === 'security' && (
            <div style={{ padding: '2rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 0.25rem', color: 'var(--text-main)' }}>
                  Bảo mật & Đổi mật khẩu
                </h3>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-dim)' }}>
                  Đổi mật khẩu mới để tăng cường độ an toàn cho tài khoản của bạn
                </p>
              </div>

              <form onSubmit={handleChangePassword}>
                <div style={{ maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.75rem' }}>
                  {/* New Password */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                      Mật khẩu mới <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <div style={{ position: 'absolute', left: '14px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                        <Key size={16} />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-input"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                        required
                        style={{ paddingLeft: '2.65rem', paddingRight: '2.75rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-dim)',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '6px',
                        }}
                        title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                      Xác nhận mật khẩu mới <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <div style={{ position: 'absolute', left: '14px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                        <Key size={16} />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-input"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu mới"
                        required
                        style={{ paddingLeft: '2.65rem', paddingRight: '2.75rem' }}
                      />
                    </div>
                  </div>

                  {/* Password requirement criteria */}
                  <div
                    style={{
                      background: 'rgba(0, 0, 0, 0.02)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      fontSize: '0.8125rem',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                      Tiêu chuẩn mật khẩu an toàn:
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: newPassword.length >= 6 ? '#10b981' : 'var(--text-dim)' }}>
                      {newPassword.length >= 6 ? <Check size={14} color="#10b981" /> : <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1px solid var(--text-dim)' }} />}
                      Độ dài từ 6 ký tự trở lên
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: newPassword && newPassword === confirmPassword ? '#10b981' : 'var(--text-dim)' }}>
                      {newPassword && newPassword === confirmPassword ? <Check size={14} color="#10b981" /> : <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1px solid var(--text-dim)' }} />}
                      Hai mật khẩu khớp nhau hoàn toàn
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-start', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSavingPassword || newPassword.length < 6 || newPassword !== confirmPassword}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    {isSavingPassword ? (
                      <>
                        <RefreshCw size={16} className="spin-animation" /> Đang cập nhật...
                      </>
                    ) : (
                      <>
                        <Key size={16} /> Cập nhật mật khẩu
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab 3: Vehicles / Privileges Content */}
          {activeTab === 'vehicles' && (
            <div style={{ padding: '2rem' }}>
              {user.role === 'DRIVER' ? (
                <>
                  <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 0.25rem', color: 'var(--text-main)' }}>
                        Phương tiện bạn đang phụ trách
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-dim)' }}>
                        Danh sách xe được người quản lý phân công cho tài xế {user.fullName}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/vehicles')}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      Xem toàn đội xe <ArrowRight size={14} />
                    </button>
                  </div>

                  {isLoadingVehicles ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                      <RefreshCw size={24} className="spin-animation" style={{ margin: '0 auto 0.5rem' }} />
                      <div>Đang tải thông tin xe...</div>
                    </div>
                  ) : assignedVehicles.length === 0 ? (
                    <div
                      style={{
                        padding: '3rem 2rem',
                        textAlign: 'center',
                        background: 'rgba(0, 0, 0, 0.02)',
                        borderRadius: '12px',
                        border: '1px dashed var(--border-color)',
                      }}
                    >
                      <Car size={40} style={{ color: 'var(--text-dim)', margin: '0 auto 1rem', opacity: 0.6 }} />
                      <h4 style={{ margin: '0 0 0.5rem', fontSize: '1rem', color: 'var(--text-main)' }}>
                        Hiện tại chưa có phương tiện phân công
                      </h4>
                      <p style={{ margin: '0 auto 1.25rem', maxWidth: '420px', fontSize: '0.8125rem', color: 'var(--text-dim)' }}>
                        Bạn chưa được chỉ định phụ trách xe nào trong hệ thống. Vui lòng liên hệ Người quản lý đội xe để được phân công xe.
                      </p>
                      <button
                        onClick={() => navigate('/vehicles')}
                        className="btn btn-primary"
                        style={{ fontSize: '0.8125rem' }}
                      >
                        Khám phá đội xe
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                      {assignedVehicles.map((vehicle) => (
                        <div
                          key={vehicle.id}
                          style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            padding: '1.25rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontWeight: 700,
                                fontSize: '0.9375rem',
                                color: 'var(--accent-blue)',
                                background: 'rgba(59, 130, 246, 0.1)',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '6px',
                              }}
                            >
                              {vehicle.licensePlate}
                            </span>
                            <span
                              className={`badge ${
                                vehicle.status === 'AVAILABLE'
                                  ? 'badge-success'
                                  : vehicle.status === 'IN_USE'
                                  ? 'badge-info'
                                  : 'badge-warning'
                              }`}
                            >
                              {vehicle.status}
                            </span>
                          </div>

                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9375rem' }}>
                              {vehicle.brand} {vehicle.model}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                              Loại xe: {vehicle.vehicleType} • Năm SX: {vehicle.manufactureYear}
                            </div>
                          </div>

                          <div style={{ height: '1px', background: 'var(--border-color)' }} />

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                            <span style={{ color: 'var(--text-dim)' }}>Odometer hiện tại:</span>
                            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                              {vehicle.currentOdometer.toLocaleString()} km
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* Admin & Manager Privileges Overview */
                <>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 0.25rem', color: 'var(--text-main)' }}>
                      Tổng quan quyền hạn & Đặc quyền hệ thống
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-dim)' }}>
                      Bạn đang đăng nhập với vai trò <strong>{user.role}</strong> trong Hệ thống Quản lý Đội xe Doanh nghiệp
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
                    <div
                      style={{
                        padding: '1.25rem',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        background: 'rgba(59, 130, 246, 0.03)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-blue)', marginBottom: '0.5rem' }}>
                        <Car size={18} />
                        <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Quản lý Đội xe ({totalFleetCount} xe)</span>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
                        Thêm mới, sửa thông tin, phân công tài xế, theo dõi bảo trì và hành trình tất cả phương tiện.
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '1.25rem',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        background: 'rgba(16, 185, 129, 0.03)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', marginBottom: '0.5rem' }}>
                        <FileText size={18} />
                        <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Quản lý Chi phí vận hành</span>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
                        Xem, phê duyệt, kê khai và thống kê chi phí nhiên liệu, phí cầu đường, bảo dưỡng định kỳ.
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '1.25rem',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        background: 'rgba(139, 92, 246, 0.03)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8b5cf6', marginBottom: '0.5rem' }}>
                        <Shield size={18} />
                        <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Nhân sự & Phân quyền</span>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
                        Quản lý danh sách nhân sự, tài xế, khóa/mở khóa tài khoản và phân quyền người dùng.
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '1.25rem',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        background: 'rgba(245, 158, 11, 0.03)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', marginBottom: '0.5rem' }}>
                        <Mail size={18} />
                        <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Nhật ký & Cảnh báo Email</span>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
                        Nhận thông báo tự động khi phương tiện sắp tới hạn bảo trì hoặc phát sinh chi phí lớn.
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button onClick={() => navigate('/vehicles')} className="btn btn-primary" style={{ fontSize: '0.8125rem' }}>
                      Đi tới Quản lý Đội xe
                    </button>
                    <button onClick={() => navigate('/costs')} className="btn btn-secondary" style={{ fontSize: '0.8125rem' }}>
                      Đi tới Quản lý Chi phí
                    </button>
                    {user.role === 'ADMIN' && (
                      <button onClick={() => navigate('/users')} className="btn btn-secondary" style={{ fontSize: '0.8125rem' }}>
                        Quản lý Nhân sự
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
