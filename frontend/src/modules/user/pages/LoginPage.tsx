import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { Car, Eye, EyeOff, Loader2, AlertCircle, Shield, UserCheck, Truck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated, user } = useAuth();
  const { showToast } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

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
    if (params.get('session_expired') === 'true') {
      setErrorMessage('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
    }
  }, []);

  const validate = (): boolean => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

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
      let msg = 'Tên đăng nhập hoặc mật khẩu không chính xác. Vui lòng thử lại.';
      if (err instanceof Error) {
        msg = err.message;
      }
      setErrorMessage(msg);
      // Data preservation: clear password only, focus password input
      setPassword('');
      if (passwordInputRef.current) {
        passwordInputRef.current.focus();
      }
    }
  };

  const quickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setUsernameError(null);
    setPasswordError(null);
    setErrorMessage(null);
  };

  const isFormEmpty = !username.trim() && !password.trim();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: 'var(--bg-primary)',
        position: 'relative',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '2.5rem',
          backgroundColor: 'rgba(17, 24, 39, 0.85)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          borderRadius: '24px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
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
            Đăng nhập hệ thống VMS
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Hệ thống Quản lý Đội xe Doanh nghiệp Phân tán
          </p>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: '12px',
              padding: '0.875rem 1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: '#fb7185',
              fontSize: '0.875rem',
            }}
          >
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
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
            disabled={isLoading || isFormEmpty}
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
        </form>

        {/* Demo Fast Login Bar */}
        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', marginBottom: '0.75rem' }}>
            Tài khoản mẫu dùng thử nhanh:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => quickFill('admin', 'admin123')}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '0.5rem 0.25rem' }}
            >
              <Shield size={14} color="var(--accent-purple)" />
              <span style={{ fontSize: '0.7rem' }}>Quản trị viên</span>
            </button>
            <button
              type="button"
              onClick={() => quickFill('manager', 'manager123')}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '0.5rem 0.25rem' }}
            >
              <UserCheck size={14} color="var(--accent-blue)" />
              <span style={{ fontSize: '0.7rem' }}>Điều phối xe</span>
            </button>
            <button
              type="button"
              onClick={() => quickFill('driver1', 'driver123')}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '0.5rem 0.25rem' }}
            >
              <Truck size={14} color="var(--accent-amber)" />
              <span style={{ fontSize: '0.7rem' }}>Tài xế</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
