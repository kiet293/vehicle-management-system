import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { userService } from '../services/userService';
import { Modal } from '../../../components/common/Modal';
import {
  User as UserIcon,
  Shield,
  UserCheck,
  Truck,
  Mail,
  Phone,
  CreditCard,
  Calendar,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'INFO' | 'PASSWORD'>('INFO');
  const [isLoading, setIsLoading] = useState(false);

  // Form states for Info tab
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [driverLicenseClass, setDriverLicenseClass] = useState('B2');
  const [driverLicenseNumber, setDriverLicenseNumber] = useState('');
  const [infoErrors, setInfoErrors] = useState<Record<string, string>>({});

  // Form states for Password tab
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  // Sync state whenever modal opens or user changes
  useEffect(() => {
    if (isOpen && user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setDriverLicenseClass(user.driverLicenseClass || 'B2');
      setDriverLicenseNumber(user.driverLicenseNumber || '');
      setInfoErrors({});
      setNewPassword('');
      setConfirmPassword('');
      setPasswordErrors({});
      setActiveTab('INFO');
    }
  }, [isOpen, user]);

  if (!user) return null;

  const getRoleBadge = () => {
    if (user.role === 'ADMIN') {
      return (
        <span className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Shield size={13} /> QUẢN TRỊ VIÊN
        </span>
      );
    }
    if (user.role === 'MANAGER') {
      return (
        <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <UserCheck size={13} /> ĐIỀU PHỐI VIÊN
        </span>
      );
    }
    return (
      <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <Truck size={13} /> TÀI XẾ
      </span>
    );
  };

  const validateInfo = (): boolean => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) {
      errs.fullName = 'Họ và tên không được để trống';
    }
    if (!email.trim()) {
      errs.email = 'Email không được để trống';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Địa chỉ email không đúng định dạng';
    }
    if (phone.trim() && !/^0\d{9}$/.test(phone.trim())) {
      errs.phone = 'Số điện thoại phải gồm 10 chữ số (bắt đầu bằng 0)';
    }
    setInfoErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInfo()) return;

    setIsLoading(true);
    try {
      const updated = await userService.updateUser(user.id, {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        driverLicenseClass: user.role === 'DRIVER' ? driverLicenseClass : undefined,
        driverLicenseNumber: user.role === 'DRIVER' ? driverLicenseNumber.trim() || undefined : undefined,
      });

      updateUser(updated);
      showToast('success', 'Cập nhật thông tin hồ sơ thành công!');
      onClose();
    } catch (err: unknown) {
      let msg = 'Không thể cập nhật thông tin hồ sơ.';
      if (err instanceof Error) msg = err.message;
      showToast('error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const validatePassword = (): boolean => {
    const errs: Record<string, string> = {};
    if (!newPassword) {
      errs.newPassword = 'Vui lòng nhập mật khẩu mới';
    } else if (newPassword.length < 6) {
      errs.newPassword = 'Mật khẩu mới phải có tối thiểu 6 ký tự';
    }
    if (newPassword !== confirmPassword) {
      errs.confirmPassword = 'Mật khẩu xác nhận không trùng khớp';
    }
    setPasswordErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setIsLoading(true);
    try {
      await userService.updateUser(user.id, {
        password: newPassword.trim(),
      });

      showToast('success', 'Đổi mật khẩu tài khoản thành công!');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err: unknown) {
      let msg = 'Không thể thay đổi mật khẩu.';
      if (err instanceof Error) msg = err.message;
      showToast('error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Mới tham gia';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Hồ sơ tài khoản người dùng" maxWidth="620px">
      {/* User Hero Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          padding: '1.25rem',
          borderRadius: '16px',
          background: 'var(--bg-user-card, rgba(255, 255, 255, 0.03))',
          border: '1px solid var(--border-color)',
          marginBottom: '1.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow Accent */}
        <div
          style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'var(--gradient-brand)',
            filter: 'blur(40px)',
            opacity: 0.15,
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'var(--gradient-brand)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.625rem',
            fontWeight: 800,
            boxShadow: 'var(--shadow-glow)',
            flexShrink: 0,
          }}
        >
          {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
            <h4
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                margin: 0,
              }}
            >
              {user.fullName}
            </h4>
            {getRoleBadge()}
          </div>
          <div
            style={{
              fontSize: '0.8125rem',
              color: 'var(--text-dim)',
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.875rem',
              flexWrap: 'wrap',
            }}
          >
            <span>@{user.username}</span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={13} /> Tham gia: {formatDate(user.createdAt)}
            </span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--accent-emerald)' }}>
              <span className="pulse-dot" style={{ background: 'var(--accent-emerald)' }} /> Hoạt động
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.5rem',
          padding: '0.25rem',
          background: 'var(--bg-btn-secondary)',
          borderRadius: '12px',
          marginBottom: '1.5rem',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('INFO')}
          className="btn"
          style={{
            background: activeTab === 'INFO' ? 'var(--bg-card-hover, var(--bg-card))' : 'transparent',
            color: activeTab === 'INFO' ? 'var(--accent-blue)' : 'var(--text-muted)',
            boxShadow: activeTab === 'INFO' ? 'var(--shadow-sm)' : 'none',
            border: activeTab === 'INFO' ? '1px solid var(--border-color)' : '1px solid transparent',
            fontWeight: activeTab === 'INFO' ? 700 : 500,
            fontSize: '0.875rem',
            padding: '0.625rem',
            borderRadius: '10px',
            transition: 'all 0.2s ease',
          }}
        >
          <UserIcon size={16} /> Thông tin cá nhân
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PASSWORD')}
          className="btn"
          style={{
            background: activeTab === 'PASSWORD' ? 'var(--bg-card-hover, var(--bg-card))' : 'transparent',
            color: activeTab === 'PASSWORD' ? 'var(--accent-blue)' : 'var(--text-muted)',
            boxShadow: activeTab === 'PASSWORD' ? 'var(--shadow-sm)' : 'none',
            border: activeTab === 'PASSWORD' ? '1px solid var(--border-color)' : '1px solid transparent',
            fontWeight: activeTab === 'PASSWORD' ? 700 : 500,
            fontSize: '0.875rem',
            padding: '0.625rem',
            borderRadius: '10px',
            transition: 'all 0.2s ease',
          }}
        >
          <KeyRound size={16} /> Đổi mật khẩu
        </button>
      </div>

      {/* Tab 1: Thông tin cá nhân */}
      {activeTab === 'INFO' && (
        <form onSubmit={handleUpdateInfo}>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">
                <Lock size={13} /> Tên đăng nhập (Username)
              </label>
              <input
                type="text"
                className="form-input"
                value={user.username}
                disabled
                style={{ opacity: 0.7, cursor: 'not-allowed', background: 'var(--bg-btn-secondary)' }}
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                Tên đăng nhập cố định, không thể chỉnh sửa
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">
                <Shield size={13} /> Vai trò hệ thống
              </label>
              <input
                type="text"
                className="form-input"
                value={
                  user.role === 'ADMIN'
                    ? 'Quản trị viên (ADMIN)'
                    : user.role === 'MANAGER'
                    ? 'Điều phối viên (MANAGER)'
                    : 'Tài xế hạm đội (DRIVER)'
                }
                disabled
                style={{ opacity: 0.7, cursor: 'not-allowed', background: 'var(--bg-btn-secondary)' }}
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                Phân quyền do cấp quản trị chỉ định
              </span>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">
                <UserIcon size={13} /> Họ và tên <span style={{ color: 'var(--accent-rose)' }}>*</span>
              </label>
              <input
                type="text"
                className={`form-input ${infoErrors.fullName ? 'input-error' : ''}`}
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (infoErrors.fullName) setInfoErrors((prev) => ({ ...prev, fullName: '' }));
                }}
                placeholder="Nhập họ và tên đầy đủ"
              />
              {infoErrors.fullName && (
                <span className="form-error-msg">
                  <AlertCircle size={12} /> {infoErrors.fullName}
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                <Mail size={13} /> Địa chỉ Email <span style={{ color: 'var(--accent-rose)' }}>*</span>
              </label>
              <input
                type="email"
                className={`form-input ${infoErrors.email ? 'input-error' : ''}`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (infoErrors.email) setInfoErrors((prev) => ({ ...prev, email: '' }));
                }}
                placeholder="example@vms.com"
              />
              {infoErrors.email && (
                <span className="form-error-msg">
                  <AlertCircle size={12} /> {infoErrors.email}
                </span>
              )}
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">
                <Phone size={13} /> Số điện thoại
              </label>
              <input
                type="tel"
                className={`form-input ${infoErrors.phone ? 'input-error' : ''}`}
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (infoErrors.phone) setInfoErrors((prev) => ({ ...prev, phone: '' }));
                }}
                placeholder="0912345678"
                maxLength={10}
              />
              {infoErrors.phone && (
                <span className="form-error-msg">
                  <AlertCircle size={12} /> {infoErrors.phone}
                </span>
              )}
            </div>

            {user.role === 'DRIVER' && (
              <div className="form-group">
                <label className="form-label">
                  <CreditCard size={13} /> Hạng giấy phép lái xe
                </label>
                <select
                  className="form-select"
                  value={driverLicenseClass}
                  onChange={(e) => setDriverLicenseClass(e.target.value)}
                >
                  <option value="B1">Hạng B1 (Xe số tự động dưới 9 chỗ)</option>
                  <option value="B2">Hạng B2 (Xe du lịch dưới 9 chỗ, tải &lt; 3.5T)</option>
                  <option value="C">Hạng C (Xe tải trên 3.5T)</option>
                  <option value="D">Hạng D (Xe chở khách 10-30 chỗ)</option>
                  <option value="E">Hạng E (Xe chở khách trên 30 chỗ)</option>
                  <option value="FC">Hạng FC (Xe đầu kéo sơ mi rơ moóc)</option>
                </select>
              </div>
            )}
          </div>

          {user.role === 'DRIVER' && (
            <div className="form-group">
              <label className="form-label">
                <CreditCard size={13} /> Số giấy phép lái xe (GPLX)
              </label>
              <input
                type="text"
                className="form-input"
                value={driverLicenseNumber}
                onChange={(e) => setDriverLicenseNumber(e.target.value)}
                placeholder="Ví dụ: 790123456789"
                maxLength={20}
              />
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isLoading}>
              Đóng
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 size={16} className="spin" /> Đang lưu...
                </>
              ) : (
                <>
                  <Save size={16} /> Lưu thay đổi
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Đổi mật khẩu */}
      {activeTab === 'PASSWORD' && (
        <form onSubmit={handleUpdatePassword}>
          <div
            style={{
              padding: '0.875rem 1rem',
              borderRadius: '12px',
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              fontSize: '0.8125rem',
              color: 'var(--text-muted)',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
            }}
          >
            <CheckCircle2 size={16} color="var(--accent-blue)" style={{ flexShrink: 0 }} />
            <span>Mật khẩu mới yêu cầu có độ dài tối thiểu 6 ký tự để đảm bảo tính an toàn.</span>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock size={13} /> Mật khẩu mới <span style={{ color: 'var(--accent-rose)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNewPassword ? 'text' : 'password'}
                className={`form-input ${passwordErrors.newPassword ? 'input-error' : ''}`}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (passwordErrors.newPassword) setPasswordErrors((prev) => ({ ...prev, newPassword: '' }));
                }}
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-dim)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passwordErrors.newPassword && (
              <span className="form-error-msg">
                <AlertCircle size={12} /> {passwordErrors.newPassword}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock size={13} /> Xác nhận mật khẩu mới <span style={{ color: 'var(--accent-rose)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className={`form-input ${passwordErrors.confirmPassword ? 'input-error' : ''}`}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (passwordErrors.confirmPassword) setPasswordErrors((prev) => ({ ...prev, confirmPassword: '' }));
                }}
                placeholder="Nhập lại mật khẩu mới vừa đặt"
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-dim)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passwordErrors.confirmPassword && (
              <span className="form-error-msg">
                <AlertCircle size={12} /> {passwordErrors.confirmPassword}
              </span>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isLoading}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 size={16} className="spin" /> Đang cập nhật...
                </>
              ) : (
                <>
                  <KeyRound size={16} /> Cập nhật mật khẩu
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default UserProfileModal;
