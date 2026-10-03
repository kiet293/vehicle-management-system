import React, { useState, useEffect } from 'react';
import { userService, CreateUserData, UpdateUserData } from '../services/userService';
import { User, Role } from '../../../types';
import { useToast } from '../../../context/ToastContext';
import { Modal } from '../../../components/common/Modal';
import { ConfirmModal } from '../../../components/common/ConfirmModal';
import { TableSkeleton } from '../../../components/common/Skeleton';
import { EmptyState } from '../../../components/common/EmptyState';
import {
  Users,
  UserPlus,
  Search,
  Lock,
  Unlock,
  Edit,
  Shield,
  UserCheck,
  Truck,
} from 'lucide-react';

export const UserPage: React.FC = () => {
  const { showToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'ALL'>('ALL');

  // Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('DRIVER');
  const [driverLicenseNumber, setDriverLicenseNumber] = useState('');
  const [driverLicenseClass, setDriverLicenseClass] = useState('B2');

  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Lock confirm modal
  const [lockingUser, setLockingUser] = useState<User | null>(null);
  const [isLocking, setIsLocking] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await userService.getUsers(
        roleFilter === 'ALL' ? undefined : roleFilter,
        search
      );
      setUsers(data);
    } catch {
      showToast('error', 'Không thể tải danh sách nhân sự');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, roleFilter]);

  const openAddModal = () => {
    setEditingUser(null);
    setFullName('');
    setUsername('');
    setEmail('');
    setPhone('');
    setPassword('');
    setRole('DRIVER');
    setDriverLicenseNumber('');
    setDriverLicenseClass('B2');
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setFullName(u.fullName);
    setUsername(u.username);
    setEmail(u.email);
    setPhone(u.phone || '');
    setPassword('');
    setRole(u.role);
    setDriverLicenseNumber(u.driverLicenseNumber || '');
    setDriverLicenseClass(u.driverLicenseClass || 'B2');
    setErrors({});
    setIsModalOpen(true);
  };

  const validateField = (field: string, value: string): string | null => {
    if (field === 'fullName') {
      if (!value.trim() || value.trim().length < 2 || value.trim().length > 100) {
        return 'Họ tên không được để trống (từ 2 đến 100 ký tự)';
      }
    }
    if (field === 'username') {
      if (!editingUser && !value.trim()) {
        return 'Tên đăng nhập không được để trống';
      }
    }
    if (field === 'email') {
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6}$/;
      if (!value.trim() || !emailRegex.test(value.trim())) {
        return 'Địa chỉ email không hợp lệ (ví dụ: nguyenvana@gmail.com)';
      }
    }
    if (field === 'phone') {
      const phoneRegex = /^0\d{9}$/;
      if (value.trim() && !phoneRegex.test(value.trim())) {
        return 'Số điện thoại không hợp lệ (10 chữ số bắt đầu bằng 0)';
      }
    }
    return null;
  };

  const handleBlur = (field: string, value: string) => {
    const err = validateField(field, value);
    setErrors((prev) => {
      const updated = { ...prev };
      if (err) updated[field] = err;
      else delete updated[field];
      return updated;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    const fnErr = validateField('fullName', fullName);
    if (fnErr) newErrors.fullName = fnErr;

    if (!editingUser) {
      const unErr = validateField('username', username);
      if (unErr) newErrors.username = unErr;
    }

    const emErr = validateField('email', email);
    if (emErr) newErrors.email = emErr;

    const phErr = validateField('phone', phone);
    if (phErr) newErrors.phone = phErr;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingUser) {
        const updateData: UpdateUserData = {
          fullName,
          email,
          phone,
          role,
          driverLicenseNumber: role === 'DRIVER' ? driverLicenseNumber : undefined,
          driverLicenseClass: role === 'DRIVER' ? driverLicenseClass : undefined,
          password: password.trim() ? password.trim() : undefined,
        };
        const updated = await userService.updateUser(editingUser.id, updateData);
        showToast('success', `Cập nhật thông tin nhân viên ${updated.fullName} thành công!`);
      } else {
        const createData: CreateUserData = {
          fullName,
          username,
          email,
          phone,
          role,
          driverLicenseNumber: role === 'DRIVER' ? driverLicenseNumber : undefined,
          driverLicenseClass: role === 'DRIVER' ? driverLicenseClass : undefined,
          password: password.trim() ? password.trim() : '123456',
        };
        const created = await userService.createUser(createData);
        showToast('success', `Thêm nhân viên ${created.fullName} thành công!`);
      }

      setIsModalOpen(false);
      fetchUsers();
    } catch (err: unknown) {
      let msg = 'Lỗi kết nối. Không thể lưu thông tin nhân viên.';
      if (err && typeof err === 'object' && 'response' in err) {
        const res = (err as { response?: { data?: { message?: string } } }).response;
        if (res?.data?.message) {
          msg = res.data.message;
        }
      } else if (err instanceof Error) {
        msg = err.message;
      }
      showToast('error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = (u: User) => {
    if (u.status === 'ACTIVE') {
      setLockingUser(u);
    } else {
      // Direct unlock
      userService.updateStatus(u.id, 'ACTIVE')
        .then(() => {
          showToast('success', `Đã mở khóa tài khoản của ${u.fullName}!`);
          fetchUsers();
        })
        .catch(() => showToast('error', 'Không thể mở khóa tài khoản'));
    }
  };

  const confirmLock = async () => {
    if (!lockingUser) return;
    setIsLocking(true);
    try {
      await userService.updateStatus(lockingUser.id, 'LOCKED');
      showToast('success', `Đã khóa tài khoản của ${lockingUser.fullName}!`);
      setLockingUser(null);
      fetchUsers();
    } catch {
      showToast('error', 'Không thể khóa tài khoản');
    } finally {
      setIsLocking(false);
    }
  };

  const getRoleBadge = (r: Role) => {
    if (r === 'ADMIN') return <span className="badge badge-purple"><Shield size={12} /> ADMIN</span>;
    if (r === 'MANAGER') return <span className="badge badge-info"><UserCheck size={12} /> MANAGER</span>;
    return <span className="badge badge-warning"><Truck size={12} /> DRIVER</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-blue)',
            }}
          >
            <Users size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 700, margin: 0 }}>
              Danh sách Nhân sự & Phân quyền
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
              Quản lý tài khoản cán bộ điều phối, tài xế và trạng thái truy cập
            </p>
          </div>
        </div>

        <button onClick={openAddModal} className="btn btn-primary" id="add-user-btn">
          <UserPlus size={18} />
          <span>+ Thêm nhân sự mới</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ position: 'relative', minWidth: '280px', flex: 1 }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '0.875rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-dim)',
            }}
          />
          <input
            type="text"
            placeholder="Tìm theo họ tên, username, email, SĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Vai trò:
          </span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as Role | 'ALL')}
            className="form-select"
            style={{ width: 'auto', minWidth: '150px' }}
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="ADMIN">Quản trị viên (ADMIN)</option>
            <option value="MANAGER">Điều phối (MANAGER)</option>
            <option value="DRIVER">Tài xế (DRIVER)</option>
          </select>
        </div>
      </div>

      {/* Table Data */}
      {isLoading ? (
        <TableSkeleton rows={5} columns={8} />
      ) : users.length === 0 ? (
        search || roleFilter !== 'ALL' ? (
          <EmptyState
            icon={<Search size={28} />}
            title="Không tìm thấy kết quả"
            description={`Không tìm thấy nhân viên nào khớp với từ khóa "${search}".`}
            actionText="Xóa bộ lọc"
            onAction={() => {
              setSearch('');
              setRoleFilter('ALL');
            }}
          />
        ) : (
          <EmptyState
            icon={<Users size={28} />}
            title="Chưa có nhân sự nào trong hệ thống"
            description="Hãy bắt đầu tạo tài khoản nhân sự và phân quyền tài xế cho đội xe."
            actionText="+ Thêm nhân viên đầu tiên"
            onAction={openAddModal}
          />
        )
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Mã NV</th>
                <th>Họ và tên</th>
                <th>Tên đăng nhập</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Vai trò</th>
                <th>Hạng bằng lái</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="mono" style={{ color: 'var(--text-dim)', fontWeight: 600 }}>
                    #{u.id}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    {u.fullName}
                  </td>
                  <td className="mono" style={{ color: 'var(--accent-cyan)' }}>
                    {u.username}
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {u.email}
                  </td>
                  <td className="mono" style={{ color: 'var(--text-muted)' }}>
                    {u.phone || '—'}
                  </td>
                  <td>{getRoleBadge(u.role)}</td>
                  <td>
                    {u.role === 'DRIVER' ? (
                      <span className="badge badge-neutral" style={{ fontWeight: 700 }}>
                        {u.driverLicenseClass || 'B2'}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-dim)' }}>—</span>
                    )}
                  </td>
                  <td>
                    {u.status === 'ACTIVE' ? (
                      <span className="badge badge-success">
                        <span className="pulse-dot" /> HOẠT ĐỘNG
                      </span>
                    ) : (
                      <span className="badge badge-danger">
                        BỊ KHÓA
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.375rem' }}>
                      <button
                        onClick={() => openEditModal(u)}
                        className="btn btn-secondary btn-icon"
                        title="Chỉnh sửa hồ sơ"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`btn ${u.status === 'ACTIVE' ? 'btn-danger' : 'btn-secondary'} btn-icon`}
                        title={u.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                      >
                        {u.status === 'ACTIVE' ? <Lock size={16} /> : <Unlock size={16} color="var(--accent-emerald)" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? `Chỉnh sửa nhân viên: ${editingUser.fullName}` : 'Thêm nhân sự mới'}
      >
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">
              Họ và tên <span style={{ color: 'var(--accent-rose)' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="Nguyễn Văn A"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onBlur={() => handleBlur('fullName', fullName)}
              className={`form-input ${errors.fullName ? 'input-error' : ''}`}
              required
            />
            {errors.fullName && <div className="form-error-msg">{errors.fullName}</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">
                Tên đăng nhập {!editingUser && <span style={{ color: 'var(--accent-rose)' }}>*</span>}
              </label>
              <input
                type="text"
                placeholder="nguyenvana"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={() => handleBlur('username', username)}
                disabled={!!editingUser}
                className={`form-input ${errors.username ? 'input-error' : ''}`}
                required={!editingUser}
              />
              {errors.username && <div className="form-error-msg">{errors.username}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">
                {editingUser ? 'Mật khẩu mới (bỏ trống nếu không đổi)' : 'Mật khẩu ban đầu'}
              </label>
              <input
                type="password"
                placeholder={editingUser ? '••••••' : 'Mặc định: 123456'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">
                Email <span style={{ color: 'var(--accent-rose)' }}>*</span>
              </label>
              <input
                type="email"
                placeholder="nguyenvana@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur('email', email)}
                className={`form-input ${errors.email ? 'input-error' : ''}`}
                required
              />
              {errors.email && <div className="form-error-msg">{errors.email}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Số điện thoại</label>
              <input
                type="tel"
                placeholder="0912345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => handleBlur('phone', phone)}
                className={`form-input ${errors.phone ? 'input-error' : ''}`}
              />
              {errors.phone && <div className="form-error-msg">{errors.phone}</div>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Vai trò phân quyền</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="form-select"
            >
              <option value="DRIVER">Tài xế (DRIVER) - Lái xe & kê khai chi phí</option>
              <option value="MANAGER">Điều phối đội xe (MANAGER) - Gán xe & xem báo cáo</option>
              <option value="ADMIN">Quản trị viên (ADMIN) - Toàn quyền hệ thống</option>
            </select>
          </div>

          {/* Conditional driver license fields */}
          {role === 'DRIVER' && (
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: '12px',
                padding: '1rem',
                marginBottom: '1rem',
              }}
            >
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--accent-amber)', marginBottom: '0.75rem' }}>
                Thông tin Giấy phép Lái xe (Bắt buộc cho Tài xế)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Hạng bằng lái</label>
                  <select
                    value={driverLicenseClass}
                    onChange={(e) => setDriverLicenseClass(e.target.value)}
                    className="form-select"
                  >
                    <option value="B1">B1 (Xe tự động đến 9 chỗ)</option>
                    <option value="B2">B2 (Xe số sàn đến 9 chỗ, tải &lt; 3.5T)</option>
                    <option value="C">C (Xe tải &gt; 3.5T)</option>
                    <option value="D">D (Chở người 10-30 chỗ)</option>
                    <option value="E">E (Chở người &gt; 30 chỗ)</option>
                    <option value="FC">FC (Đầu kéo sơ-mi rơ-moóc)</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Số GPLX</label>
                  <input
                    type="text"
                    placeholder="VD: 2901928374"
                    value={driverLicenseNumber}
                    onChange={(e) => setDriverLicenseNumber(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu thông tin'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Lock Modal */}
      {lockingUser && (
        <ConfirmModal
          isOpen={!!lockingUser}
          onClose={() => setLockingUser(null)}
          onConfirm={confirmLock}
          title="Xác nhận khóa tài khoản"
          message={`Bạn có chắc chắn muốn khóa tài khoản của ${lockingUser.fullName}? Người này sẽ không thể đăng nhập vào hệ thống sau khi bị khóa.`}
          confirmText="Xác nhận khóa"
          isDangerous={true}
          isLoading={isLocking}
        />
      )}
    </div>
  );
};

export default UserPage;
