import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { useTheme } from '../../../context/ThemeContext';
import { 
  Car, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle, 
  UserCheck, 
  Truck, 
  UserPlus, 
  LogIn, 
  CreditCard,
  Sun,
  Moon,
  X
} from 'lucide-react';
import { Role } from '../../../types';

interface LoginPageProps {
  initialMode?: 'login' | 'register';
}

const extractErrorMessage = (err: unknown, fallbackMessage: string): string => {
  if (!err) return fallbackMessage;

  const axiosErr = err as {
    response?: {
      status?: number;
      data?: {
        message?: string;
        error?: string;
        [key: string]: unknown;
      };
    };
    message?: string;
    code?: string;
  };

  // Backend returned error message
  if (axiosErr.response?.data?.message && typeof axiosErr.response.data.message === 'string') {
    return axiosErr.response.data.message;
  }
  if (axiosErr.response?.data?.error && typeof axiosErr.response.data.error === 'string') {
    return axiosErr.response.data.error;
  }

  // Network / Connection failure
  if (axiosErr.code === 'ERR_NETWORK' || (typeof axiosErr.message === 'string' && axiosErr.message.includes('Network Error'))) {
    return 'Không thể kết nối đến máy chủ backend (Network Error). Vui lòng kiểm tra lại dịch vụ hoặc kết nối mạng.';
  }

  // HTTP status fallback messages
  if (axiosErr.response?.status === 401) {
    return 'Tên đăng nhập hoặc mật khẩu không chính xác. Vui lòng thử lại.';
  }
  if (axiosErr.response?.status === 403) {
    return 'Tài khoản của bạn không có quyền truy cập hoặc đang bị khóa.';
  }
  if (axiosErr.response?.status === 404) {
    return 'Không tìm thấy thông tin tài khoản hoặc dịch vụ không phản hồi.';
  }
  if (axiosErr.response?.status === 409) {
    return 'Dữ liệu đã tồn tại trong hệ thống (tên đăng nhập, email hoặc SĐT trùng lặp).';
  }
  if (axiosErr.response?.status === 500) {
    return 'Đã xảy ra lỗi máy chủ nội bộ (500). Vui lòng thử lại sau.';
  }

  if (err instanceof Error && err.message && !err.message.startsWith('Request failed with status code')) {
    return err.message;
  }

  return fallbackMessage;
};

export const LoginPage: React.FC<LoginPageProps> = ({ initialMode = 'login' }) => {
  const { login, register, isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();

  const [authMode, setAuthMode] = useState<'login' | 'register'>(initialMode);

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<Role>('DRIVER');
  const [regDriverLicenseClass, setRegDriverLicenseClass] = useState('B2');
  const [regDriverLicenseNumber, setRegDriverLicenseNumber] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});

  // Global states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // If already authenticated, redirect based on role
    if (isAuthenticated && user) {
      const redirectUrl = localStorage.getItem('vms_redirect_url');
      localStorage.removeItem('vms_redirect_url');
      if (redirectUrl && redirectUrl !== '/login') {
        window.location.href = redirectUrl;
      } else if (user.role === 'DRIVER') {
        window.location.href = '/vehicles';
      } else {
        window.location.href = '/';
      }
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'register') {
      setAuthMode('register');
    }
    if (params.get('session_expired') === 'true') {
      setErrorMessage('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
    }
  }, []);

  // Validate Login
  const validateLogin = (): boolean => {
    let valid = true;
    if (!username.trim()) {
      setUsernameError('Vui lòng nhập tên đăng nhập');
      valid = false;
    } else {
      setUsernameError(null);
    }

    if (!password) {
      setPasswordError('Vui lòng nhập mật khẩu');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Mật khẩu phải có tối thiểu 6 ký tự');
      valid = false;
    } else {
      setPasswordError(null);
    }

    return valid;
  };

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLogin()) {
      setErrorMessage('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const loggedUser = await login(username.trim(), password);
      showToast('success', `Đăng nhập thành công! Chào mừng ${loggedUser.fullName} quay trở lại.`, 2500);

      const redirectUrl = localStorage.getItem('vms_redirect_url');
      localStorage.removeItem('vms_redirect_url');

      setTimeout(() => {
        if (redirectUrl && redirectUrl !== '/login') {
          window.location.href = redirectUrl;
        } else if (loggedUser.role === 'DRIVER') {
          window.location.href = '/vehicles';
        } else {
          window.location.href = '/';
        }
      }, 500);
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = extractErrorMessage(err, 'Tên đăng nhập hoặc mật khẩu không chính xác. Vui lòng thử lại.');
      setErrorMessage(msg);
      showToast('error', msg, 4000);

      if (msg.toLowerCase().includes('tên đăng nhập') && !msg.toLowerCase().includes('mật khẩu')) {
        setUsernameError(msg);
      } else if (msg.toLowerCase().includes('mật khẩu') && !msg.toLowerCase().includes('tên đăng nhập')) {
        setPasswordError(msg);
      }

      setPassword('');
      if (passwordInputRef.current) {
        passwordInputRef.current.focus();
      }
    }
  };

  // Validate Register
  const validateRegister = (): boolean => {
    const errors: Record<string, string> = {};
    if (!regFullName.trim()) {
      errors.fullName = 'Họ và tên không được để trống';
    }
    if (!regUsername.trim()) {
      errors.username = 'Tên đăng nhập không được để trống';
    } else if (regUsername.trim().length < 3) {
      errors.username = 'Tên đăng nhập tối thiểu 3 ký tự';
    }
    if (!regEmail.trim()) {
      errors.email = 'Email không được để trống';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) {
      errors.email = 'Email không đúng định dạng (vd: user@example.com)';
    }
    if (regPhone && !/^0\d{9}$/.test(regPhone.trim())) {
      errors.phone = 'SĐT phải gồm 10 chữ số (bắt đầu bằng số 0)';
    }
    if (!regPassword) {
      errors.password = 'Vui lòng nhập mật khẩu';
    } else if (regPassword.length < 6) {
      errors.password = 'Mật khẩu phải có tối thiểu 6 ký tự';
    }
    if (!regConfirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận lại mật khẩu';
    } else if (regPassword !== regConfirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp với mật khẩu đã nhập';
    }
    if (regRole === 'DRIVER' && !regDriverLicenseClass) {
      errors.driverLicenseClass = 'Vui lòng chọn hạng bằng lái';
    }

    setRegErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRegister()) {
      setErrorMessage('Vui lòng kiểm tra lại các trường thông tin đăng ký bên dưới.');
      showToast('error', 'Vui lòng điền đầy đủ và chính xác các thông tin đăng ký.', 3500);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const newUser = await register({
        username: regUsername.trim(),
        password: regPassword.trim(),
        fullName: regFullName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim() || undefined,
        role: regRole,
        driverLicenseClass: regRole === 'DRIVER' ? regDriverLicenseClass : undefined,
        driverLicenseNumber: regRole === 'DRIVER' ? regDriverLicenseNumber.trim() || undefined : undefined,
      });

      showToast('success', `Đăng ký thành công! Chào mừng ${newUser.fullName} gia nhập VMS.`, 3000);

      setTimeout(() => {
        if (newUser.role === 'DRIVER') {
          window.location.href = '/vehicles';
        } else {
          window.location.href = '/';
        }
      }, 500);
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = extractErrorMessage(err, 'Đăng ký tài khoản không thành công. Vui lòng kiểm tra lại thông tin.');
      setErrorMessage(msg);
      showToast('error', msg, 5000);

      // Link backend error to specific field if relevant
      const lower = msg.toLowerCase();
      if (lower.includes('tên đăng nhập')) {
        setRegErrors(prev => ({ ...prev, username: msg }));
      } else if (lower.includes('email')) {
        setRegErrors(prev => ({ ...prev, email: msg }));
      } else if (lower.includes('số điện thoại') || lower.includes('sđt') || lower.includes('phone')) {
        setRegErrors(prev => ({ ...prev, phone: msg }));
      }
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        background: 'var(--bg-primary)',
        position: 'relative',
      }}
    >
      {/* Theme Toggle Button in Top-Right Corner */}
      <button
        type="button"
        onClick={toggleTheme}
        className="btn btn-secondary btn-icon"
        title={theme === 'dark' ? 'Chuyển sang chế độ Sáng (Light mode)' : 'Chuyển sang chế độ Tối (Dark mode)'}
        aria-label="Đổi giao diện Sáng / Tối"
        style={{
          position: 'absolute',
          top: '1.25rem',
          right: '1.25rem',
          zIndex: 20,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {theme === 'dark' ? (
          <Sun size={18} color="var(--accent-amber)" />
        ) : (
          <Moon size={18} color="var(--accent-purple)" />
        )}
      </button>

      <div
        className="glass-panel vms-auth-card"
        style={{
          maxWidth: authMode === 'register' ? '540px' : '460px',
          transition: 'max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'var(--gradient-brand)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 30px rgba(59, 130, 246, 0.4)',
              marginBottom: '1rem',
            }}
          >
            <Car size={30} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.375rem' }}>
            {authMode === 'login' ? 'Đăng nhập hệ thống VMS' : 'Đăng ký tài khoản mới'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Hệ thống Quản lý Đội xe Doanh nghiệp Phân tán
          </p>
        </div>

        {/* Auth Mode Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            padding: '4px',
            borderRadius: '12px',
            marginBottom: '1.75rem',
            border: '1px solid var(--border-color)',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setErrorMessage(null);
              setRegErrors({});
            }}
            style={{
              padding: '0.625rem',
              borderRadius: '8px',
              border: 'none',
              background: authMode === 'login' ? 'var(--accent-blue)' : 'transparent',
              color: authMode === 'login' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: authMode === 'login' ? 700 : 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
            }}
          >
            <LogIn size={16} />
            <span>Đăng nhập</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setErrorMessage(null);
              setUsernameError(null);
              setPasswordError(null);
            }}
            style={{
              padding: '0.625rem',
              borderRadius: '8px',
              border: 'none',
              background: authMode === 'register' ? 'var(--accent-blue)' : 'transparent',
              color: authMode === 'register' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: authMode === 'register' ? 700 : 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
            }}
          >
            <UserPlus size={16} />
            <span>Đăng ký</span>
          </button>
        </div>

        {/* Global Error Banner with Dismiss button */}
        {errorMessage && (
          <div
            role="alert"
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '12px',
              padding: '0.875rem 1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '0.75rem',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.12)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
              <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#ef4444' }} />
              <div>
                <strong style={{ display: 'block', marginBottom: '2px', color: '#f87171', fontWeight: 600 }}>
                  {authMode === 'login' ? 'Đăng nhập không thành công' : 'Đăng ký không thành công'}
                </strong>
                <span style={{ lineHeight: '1.45', color: 'var(--text-main)', fontSize: '0.875rem' }}>
                  {errorMessage}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#f87171',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                flexShrink: 0,
                opacity: 0.8,
              }}
              title="Đóng thông báo lỗi"
              aria-label="Đóng thông báo"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ================= FORM ĐĂNG NHẬP ================= */}
        {authMode === 'login' ? (
          <form onSubmit={handleLoginSubmit} noValidate>
            {/* Username */}
            <div className="form-group">
              <label className="form-label" htmlFor="username">
                Tên đăng nhập
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (usernameError) setUsernameError(null);
                  if (errorMessage) setErrorMessage(null);
                }}
                onBlur={() => {
                  if (!username.trim()) setUsernameError('Vui lòng nhập tên đăng nhập');
                }}
                placeholder="Nhập tên đăng nhập (vd: admin)"
                className={`form-input ${usernameError ? 'input-error' : ''}`}
                style={{ opacity: isLoading ? 0.7 : 1 }}
                disabled={isLoading}
                autoFocus
              />
              {usernameError && <div className="form-error-msg">{usernameError}</div>}
            </div>

            {/* Password */}
            <div className="form-group" style={{ marginBottom: '1.75rem' }}>
              <label className="form-label" htmlFor="password">
                Mật khẩu
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  onBlur={() => {
                    if (!password) setPasswordError('Vui lòng nhập mật khẩu');
                  }}
                  placeholder="Nhập mật khẩu"
                  className={`form-input ${passwordError ? 'input-error' : ''}`}
                  style={{ opacity: isLoading ? 0.7 : 1, paddingRight: '2.75rem' }}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                  }}
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordError && <div className="form-error-msg">{passwordError}</div>}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.9375rem' }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="pulse-dot" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>

            {/* Switch to Register link */}
            <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Chưa có tài khoản?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setErrorMessage(null);
                  setUsernameError(null);
                  setPasswordError(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-blue)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                Đăng ký tài khoản ngay
              </button>
            </div>
          </form>
        ) : (
          /* ================= FORM ĐĂNG KÝ ================= */
          <form onSubmit={handleRegisterSubmit} noValidate>
            {/* Full Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg_fullName">
                Họ và tên <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <input
                id="reg_fullName"
                type="text"
                placeholder="vd: Nguyễn Văn Tài"
                value={regFullName}
                onChange={(e) => {
                  setRegFullName(e.target.value);
                  if (regErrors.fullName) setRegErrors(prev => ({ ...prev, fullName: '' }));
                  if (errorMessage) setErrorMessage(null);
                }}
                className={`form-input ${regErrors.fullName ? 'input-error' : ''}`}
                disabled={isLoading}
              />
              {regErrors.fullName && <div className="form-error-msg">{regErrors.fullName}</div>}
            </div>

            <div className="form-grid-2">
              {/* Username */}
              <div className="form-group">
                <label className="form-label" htmlFor="reg_username">
                  Tên đăng nhập <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <input
                  id="reg_username"
                  type="text"
                  placeholder="vd: driver_tai"
                  value={regUsername}
                  onChange={(e) => {
                    setRegUsername(e.target.value);
                    if (regErrors.username) setRegErrors(prev => ({ ...prev, username: '' }));
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className={`form-input ${regErrors.username ? 'input-error' : ''}`}
                  disabled={isLoading}
                />
                {regErrors.username && <div className="form-error-msg">{regErrors.username}</div>}
              </div>

              {/* Phone */}
              <div className="form-group">
                <label className="form-label" htmlFor="reg_phone">
                  Số điện thoại
                </label>
                <input
                  id="reg_phone"
                  type="tel"
                  placeholder="0912345678"
                  value={regPhone}
                  onChange={(e) => {
                    setRegPhone(e.target.value);
                    if (regErrors.phone) setRegErrors(prev => ({ ...prev, phone: '' }));
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className={`form-input ${regErrors.phone ? 'input-error' : ''}`}
                  disabled={isLoading}
                />
                {regErrors.phone && <div className="form-error-msg">{regErrors.phone}</div>}
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg_email">
                Địa chỉ Email <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <input
                id="reg_email"
                type="email"
                placeholder="tai.nguyen@vms.com"
                value={regEmail}
                onChange={(e) => {
                  setRegEmail(e.target.value);
                  if (regErrors.email) setRegErrors(prev => ({ ...prev, email: '' }));
                  if (errorMessage) setErrorMessage(null);
                }}
                className={`form-input ${regErrors.email ? 'input-error' : ''}`}
                disabled={isLoading}
              />
              {regErrors.email && <div className="form-error-msg">{regErrors.email}</div>}
            </div>

            {/* Role Selection */}
            <div className="form-group">
              <label className="form-label">
                Vai trò mong muốn <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <div className="form-grid-2">
                <div
                  onClick={() => setRegRole('DRIVER')}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '12px',
                    border: regRole === 'DRIVER' ? '2px solid var(--accent-amber)' : '1px solid var(--border-color)',
                    backgroundColor: regRole === 'DRIVER' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Truck size={18} color={regRole === 'DRIVER' ? '#fbbf24' : 'var(--text-dim)'} />
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: regRole === 'DRIVER' ? 'var(--text-main)' : 'var(--text-muted)' }}>
                      Tài xế lái xe
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Vận hành đội xe</div>
                  </div>
                </div>

                <div
                  onClick={() => setRegRole('MANAGER')}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '12px',
                    border: regRole === 'MANAGER' ? '2px solid var(--accent-blue)' : '1px solid var(--border-color)',
                    backgroundColor: regRole === 'MANAGER' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <UserCheck size={18} color={regRole === 'MANAGER' ? '#60a5fa' : 'var(--text-dim)'} />
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: regRole === 'MANAGER' ? 'var(--text-main)' : 'var(--text-muted)' }}>
                      Điều phối viên
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Quản lý xe & chi phí</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Driver License Fields if DRIVER */}
            {regRole === 'DRIVER' && (
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(245, 158, 11, 0.05)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#fbbf24', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CreditCard size={15} />
                  <span>Thông tin giấy phép lái xe</span>
                </div>
                <div className="form-grid-2">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="reg_licenseClass">
                      Hạng bằng lái <span style={{ color: '#f43f5e' }}>*</span>
                    </label>
                    <select
                      id="reg_licenseClass"
                      className="form-input"
                      value={regDriverLicenseClass}
                      onChange={(e) => setRegDriverLicenseClass(e.target.value)}
                    >
                      <option value="B1">Hạng B1</option>
                      <option value="B2">Hạng B2</option>
                      <option value="C">Hạng C</option>
                      <option value="D">Hạng D</option>
                      <option value="E">Hạng E</option>
                      <option value="FC">Hạng FC</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="reg_licenseNumber">
                      Số GPLX
                    </label>
                    <input
                      id="reg_licenseNumber"
                      type="text"
                      placeholder="Số bằng lái"
                      className="form-input"
                      value={regDriverLicenseNumber}
                      onChange={(e) => setRegDriverLicenseNumber(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Passwords */}
            <div className="form-grid-2" style={{ marginBottom: '1.75rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="reg_password">
                  Mật khẩu <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="reg_password"
                    type={showRegPassword ? 'text' : 'password'}
                    placeholder="Tối thiểu 6 ký tự"
                    value={regPassword}
                    onChange={(e) => {
                      setRegPassword(e.target.value);
                      if (regErrors.password) setRegErrors(prev => ({ ...prev, password: '' }));
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className={`form-input ${regErrors.password ? 'input-error' : ''}`}
                    disabled={isLoading}
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.5rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-dim)',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {regErrors.password && <div className="form-error-msg">{regErrors.password}</div>}
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="reg_confirmPassword">
                  Xác nhận mật khẩu <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <input
                  id="reg_confirmPassword"
                  type={showRegPassword ? 'text' : 'password'}
                  placeholder="Nhập lại mật khẩu"
                  value={regConfirmPassword}
                  onChange={(e) => {
                    setRegConfirmPassword(e.target.value);
                    if (regErrors.confirmPassword) setRegErrors(prev => ({ ...prev, confirmPassword: '' }));
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className={`form-input ${regErrors.confirmPassword ? 'input-error' : ''}`}
                  disabled={isLoading}
                />
                {regErrors.confirmPassword && <div className="form-error-msg">{regErrors.confirmPassword}</div>}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.9375rem' }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="pulse-dot" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Đang đăng ký tài khoản...</span>
                </>
              ) : (
                'Tạo tài khoản & Đăng nhập'
              )}
            </button>

            {/* Switch to Login link */}
            <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setErrorMessage(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-blue)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                Đăng nhập ngay
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
