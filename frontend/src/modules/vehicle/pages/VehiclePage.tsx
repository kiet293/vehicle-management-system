import React, { useState, useEffect } from 'react';
import { vehicleService, CreateVehicleData, UpdateVehicleData } from '../services/vehicleService';
import { userService } from '../../user/services/userService';
import { Vehicle, VehicleStatus, VehicleType, User } from '../../../types';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { Modal } from '../../../components/common/Modal';
import { ConfirmModal } from '../../../components/common/ConfirmModal';
import { Skeleton, TableSkeleton } from '../../../components/common/Skeleton';
import { EmptyState } from '../../../components/common/EmptyState';
import {
  Car,
  Plus,
  Search,
  LayoutGrid,
  List,
  Gauge,
  UserCheck,
  Wrench,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Edit,
  CheckCircle2,
  Clock,
  Send,
  ArrowRight,
} from 'lucide-react';

export const VehiclePage: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const isDriver = user?.role === 'DRIVER';

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | 'ALL'>('ALL');
  const [brandFilter, setBrandFilter] = useState<string>('ALL');
  const [brands, setBrands] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');

  // Check URL parameters (e.g., from Dashboard clicked status=MAINTENANCE)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const st = params.get('status');
    if (st && ['AVAILABLE', 'IN_USE', 'MAINTENANCE'].includes(st)) {
      setStatusFilter(st as VehicleStatus);
    }
  }, []);

  // Load available brands for the filter dropdown (once, independent of other filters)
  useEffect(() => {
    const loadBrands = async () => {
      try {
        const list = await vehicleService.getBrands();
        setBrands(list);
      } catch {
        setBrands([]);
      }
    };
    loadBrands();
  }, []);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);

  // Selected vehicle for action
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Available drivers list
  const [availableDrivers, setAvailableDrivers] = useState<User[]>([]);

  // Add/Edit Form State
  const [licensePlate, setLicensePlate] = useState('');
  const [brand, setBrand] = useState('Toyota');
  const [model, setModel] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('SEDAN');
  const [seatCapacity, setSeatCapacity] = useState(5);
  const [manufactureYear, setManufactureYear] = useState(new Date().getFullYear());
  const [initialOdometer, setInitialOdometer] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Assign Form State
  const [selectedDriverId, setSelectedDriverId] = useState<number | ''>('');

  // Return Form State
  const [returnKm, setReturnKm] = useState<string>('');
  const [returnNotes, setReturnNotes] = useState('');
  const [kmError, setKmError] = useState<string | null>(null);
  const [kmWarning, setKmWarning] = useState<string | null>(null);

  const fetchVehicles = async () => {
    setIsLoading(true);
    setErrorBanner(null);
    try {
      const data = await vehicleService.getVehicles(
        statusFilter === 'ALL' ? undefined : statusFilter,
        brandFilter === 'ALL' ? undefined : brandFilter,
        search
      );
      setVehicles(data);
    } catch {
      setErrorBanner('Không thể tải danh sách đội xe. Vui lòng bấm [Thử lại]');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVehicles();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, brandFilter]);

  const loadDrivers = async () => {
    try {
      const drivers = await userService.getAvailableDrivers();
      setAvailableDrivers(drivers);
    } catch {
      setAvailableDrivers([]);
    }
  };

  const formatPlate = (val: string) => {
    let s = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (s.length > 3 && s.length <= 8) {
      const p1 = s.substring(0, 3);
      const rest = s.substring(3);
      if (rest.length <= 4) {
        return `${p1}-${rest}`;
      } else {
        return `${p1}-${rest.substring(0, 3)}.${rest.substring(3)}`;
      }
    }
    return s;
  };

  const openAddModal = () => {
    setLicensePlate('');
    setBrand('Toyota');
    setModel('');
    setVehicleType('SEDAN');
    setSeatCapacity(5);
    setManufactureYear(new Date().getFullYear());
    setInitialOdometer(0);
    setImageUrl('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (v: Vehicle) => {
    setSelectedVehicle(v);
    setBrand(v.brand);
    setModel(v.model);
    setVehicleType(v.vehicleType);
    setSeatCapacity(v.seatCapacity);
    setManufactureYear(v.manufactureYear);
    setImageUrl(v.imageUrl || '');
    setIsEditModalOpen(true);
  };

  const openAssignModal = (v: Vehicle) => {
    setSelectedVehicle(v);
    setSelectedDriverId('');
    loadDrivers();
    setIsAssignModalOpen(true);
  };

  const openReturnModal = (v: Vehicle) => {
    setSelectedVehicle(v);
    setReturnKm(String(v.currentOdometer));
    setReturnNotes('');
    setKmError(null);
    setKmWarning(null);
    setIsReturnModalOpen(true);
  };

  const handleReturnKmChange = (valStr: string) => {
    setReturnKm(valStr);
    const val = parseInt(valStr.replace(/\D/g, ''), 10);
    if (isNaN(val)) {
      setKmError('Vui lòng nhập số km hợp lệ');
      setKmWarning(null);
      return;
    }
    if (selectedVehicle && val < selectedVehicle.currentOdometer) {
      setKmError(
        `Số km cập nhật (${val.toLocaleString('vi-VN')} km) không thể nhỏ hơn số km hiện tại (${selectedVehicle.currentOdometer.toLocaleString('vi-VN')} km). Vui lòng kiểm tra lại công-tơ-mét trên xe.`
      );
      setKmWarning(null);
    } else {
      setKmError(null);
      if (selectedVehicle && val - selectedVehicle.currentOdometer > 1000) {
        setKmWarning('Quãng đường ghi nhận tăng hơn 1.000 km, bạn có chắc chắn số liệu này chính xác không?');
      } else {
        setKmWarning(null);
      }
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licensePlate.trim()) {
      showToast('error', 'Vui lòng nhập biển số xe');
      return;
    }
    setIsSubmitting(true);
    try {
      const data: CreateVehicleData = {
        licensePlate: formatPlate(licensePlate),
        brand,
        model,
        vehicleType,
        seatCapacity,
        manufactureYear,
        initialOdometer,
        imageUrl: imageUrl.trim() || undefined,
      };
      const created = await vehicleService.createVehicle(data);
      showToast('success', `Thêm phương tiện ${created.licensePlate} thành công!`);
      setIsAddModalOpen(false);
      fetchVehicles();
    } catch (err: unknown) {
      let msg = 'Không thể thêm phương tiện';
      if (err && typeof err === 'object' && 'response' in err) {
        const res = (err as { response?: { data?: { message?: string } } }).response;
        if (res?.data?.message) msg = res.data.message;
      }
      showToast('error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    setIsSubmitting(true);
    try {
      const data: UpdateVehicleData = {
        brand,
        model,
        vehicleType,
        seatCapacity,
        manufactureYear,
        imageUrl: imageUrl.trim() || undefined,
      };
      await vehicleService.updateVehicle(selectedVehicle.id, data);
      showToast('success', `Cập nhật thông tin xe ${selectedVehicle.licensePlate} thành công!`);
      setIsEditModalOpen(false);
      fetchVehicles();
    } catch {
      showToast('error', 'Không thể cập nhật thông tin xe');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !selectedDriverId) {
      showToast('error', 'Vui lòng chọn tài xế');
      return;
    }
    const d = availableDrivers.find((item) => item.id === Number(selectedDriverId));
    if (!d) return;

    setIsSubmitting(true);
    try {
      await vehicleService.assignDriver(selectedVehicle.id, d.id, d.fullName, d.email);
      showToast('success', `Đã bàn giao xe ${selectedVehicle.licensePlate} cho tài xế ${d.fullName}!`);
      setIsAssignModalOpen(false);
      fetchVehicles();
    } catch {
      showToast('error', 'Không thể bàn giao xe');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    const km = parseInt(returnKm.replace(/\D/g, ''), 10);
    if (isNaN(km) || km < selectedVehicle.currentOdometer) {
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await vehicleService.returnVehicle(selectedVehicle.id, km, returnNotes);
      if (updated.status === 'MAINTENANCE') {
        showToast('warning', `Xe ${updated.licensePlate} đã vượt ngưỡng bảo dưỡng 5.000 km và chuyển sang BẢO DƯỠNG!`);
      } else {
        showToast('success', `Bàn giao lại xe ${updated.licensePlate} thành công! Số km: ${km.toLocaleString('vi-VN')} km`);
      }
      setIsReturnModalOpen(false);
      fetchVehicles();
    } catch (err: unknown) {
      let msg = 'Không thể bàn giao lại xe';
      if (err && typeof err === 'object' && 'response' in err) {
        const res = (err as { response?: { data?: { message?: string } } }).response;
        if (res?.data?.message) msg = res.data.message;
      }
      showToast('error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishMaintenance = async (v: Vehicle) => {
    try {
      await vehicleService.updateStatus(v.id, 'AVAILABLE');
      showToast('success', `Đã hoàn thành bảo dưỡng cho xe ${v.licensePlate}! Trạng thái chuyển sang SẴN SÀNG.`);
      fetchVehicles();
    } catch {
      showToast('error', 'Không thể cập nhật trạng thái');
    }
  };

  const confirmDelete = async () => {
    if (!deletingVehicle) return;
    try {
      await vehicleService.deleteVehicle(deletingVehicle.id);
      showToast('success', `Đã ngừng khai thác xe ${deletingVehicle.licensePlate} (DECOMMISSIONED).`);
      setDeletingVehicle(null);
      fetchVehicles();
    } catch {
      showToast('error', 'Không thể xóa xe');
    }
  };

  const getStatusBadge = (st: VehicleStatus) => {
    if (st === 'AVAILABLE') {
      return <span className="badge badge-success"><CheckCircle2 size={12} /> SẴN SÀNG</span>;
    }
    if (st === 'IN_USE') {
      return <span className="badge badge-info"><Clock size={12} /> ĐANG SỬ DỤNG</span>;
    }
    if (st === 'MAINTENANCE') {
      return <span className="badge badge-warning"><Wrench size={12} /> BẢO DƯỠNG</span>;
    }
    return <span className="badge badge-danger">NGỪNG KHAI THÁC</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Network Failure Banner */}
      {errorBanner && (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#fbbf24',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={20} />
            <span>{errorBanner}</span>
          </div>
          <button onClick={fetchVehicles} className="btn btn-secondary btn-sm" style={{ borderColor: 'rgba(245, 158, 11, 0.4)' }}>
            <RotateCcw size={14} /> Thử lại
          </button>
        </div>
      )}

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
            <Car size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 700, margin: 0 }}>
              Danh mục & Đội xe Doanh nghiệp
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
              Hồ sơ kỹ thuật, vòng đời trạng thái và công-tơ-mét vận hành
            </p>
          </div>
        </div>

        {!isDriver && (
          <button onClick={openAddModal} className="btn btn-primary" id="add-vehicle-btn">
            <Plus size={18} />
            <span>+ Thêm xe mới</span>
          </button>
        )}
      </div>

      {/* Filter and View Switcher */}
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
            placeholder="Tìm theo biển số (vd: 29A), hãng xe, tài xế..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Hãng xe:
            </span>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="form-select"
              style={{ width: 'auto', minWidth: '150px' }}
            >
              <option value="ALL">Tất cả hãng</option>
              {brands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Trạng thái:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as VehicleStatus | 'ALL')}
              className="form-select"
              style={{ width: 'auto', minWidth: '150px' }}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="AVAILABLE">Sẵn sàng (AVAILABLE)</option>
              <option value="IN_USE">Đang chạy (IN_USE)</option>
              <option value="MAINTENANCE">Bảo dưỡng (MAINTENANCE)</option>
              <option value="DECOMMISSIONED">Ngừng khai thác</option>
            </select>
          </div>

          <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', padding: '2px' }}>
            <button
              onClick={() => setViewMode('GRID')}
              className={`btn btn-sm ${viewMode === 'GRID' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: '8px', border: 'none' }}
              title="Dạng thẻ lưới"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`btn btn-sm ${viewMode === 'TABLE' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: '8px', border: 'none' }}
              title="Dạng bảng dữ liệu"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Content Rendering */}
      {isLoading ? (
        viewMode === 'GRID' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-panel" style={{ height: '320px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Skeleton height="150px" borderRadius="12px" />
                <Skeleton height="24px" width="60%" />
                <Skeleton height="16px" width="40%" />
                <Skeleton height="36px" width="100%" style={{ marginTop: 'auto' }} />
              </div>
            ))}
          </div>
        ) : (
          <TableSkeleton rows={5} columns={7} />
        )
      ) : vehicles.length === 0 ? (
        search || statusFilter !== 'ALL' || brandFilter !== 'ALL' ? (
          <EmptyState
            icon={<Search size={28} />}
            title="Không tìm thấy phương tiện nào"
            description={`Không tìm thấy xe nào khớp với tiêu chí tìm kiếm.`}
            actionText="Xóa bộ lọc"
            onAction={() => {
              setSearch('');
              setStatusFilter('ALL');
              setBrandFilter('ALL');
            }}
          />
        ) : (
          <EmptyState
            icon={<Car size={28} />}
            title="Chưa có phương tiện nào trong hạm đội"
            description="Bắt đầu đăng ký phương tiện đầu tiên để quản lý lộ trình và chi phí."
            actionText={isDriver ? undefined : "+ Thêm phương tiện đầu tiên"}
            onAction={openAddModal}
          />
        )
      ) : viewMode === 'GRID' ? (
        /* Card Grid View */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {vehicles.map((v) => (
            <div
              key={v.id}
              className="glass-panel"
              style={{
                borderRadius: '16px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.25s ease',
              }}
            >
              {/* Photo & Status */}
              <div style={{ position: 'relative', height: '170px', width: '100%', background: '#1e293b' }}>
                <img
                  src={v.imageUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=60'}
                  alt={v.licensePlate}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=60';
                  }}
                />
                <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                  {getStatusBadge(v.status)}
                </div>
                <div
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '12px',
                    background: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(8px)',
                    padding: '0.25rem 0.625rem',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    letterSpacing: '0.05em',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                >
                  {v.licensePlate}
                </div>
              </div>

              {/* Details Body */}
              <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                    {v.brand} {v.model}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', marginTop: '2px' }}>
                    <span>{v.vehicleType}</span> • <span>{v.seatCapacity} chỗ</span> • <span>Năm {v.manufactureYear}</span>
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '0.75rem',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.5rem',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Gauge size={12} /> Odometer
                    </div>
                    <div className="mono" style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                      {v.currentOdometer.toLocaleString('vi-VN')} km
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <UserCheck size={12} /> Phụ trách
                    </div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {v.assignedDriverName || 'Chưa bàn giao'}
                    </div>
                  </div>
                </div>

                {/* Maintenance Due Warning */}
                {v.maintenanceDue && (
                  <div
                    style={{
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      borderRadius: '8px',
                      padding: '0.375rem 0.625rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.75rem',
                      color: 'var(--accent-amber)',
                      fontWeight: 600,
                    }}
                  >
                    <AlertTriangle size={14} />
                    <span>Đã đến hạn bảo dưỡng định kỳ (&ge;5.000 km)</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ marginTop: 'auto', paddingTop: '0.75rem', display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                  {v.status === 'AVAILABLE' && !isDriver && (
                    <button
                      onClick={() => openAssignModal(v)}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1 }}
                    >
                      <Send size={14} /> Bàn giao xe
                    </button>
                  )}

                  {v.status === 'IN_USE' && (
                    <button
                      onClick={() => openReturnModal(v)}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)' }}
                    >
                      <ArrowRight size={14} /> Trả xe / Bàn giao
                    </button>
                  )}

                  {v.status === 'MAINTENANCE' && !isDriver && (
                    <button
                      onClick={() => handleFinishMaintenance(v)}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, background: 'var(--accent-amber)', color: '#000' }}
                    >
                      <Wrench size={14} /> Bảo dưỡng xong
                    </button>
                  )}

                  {!isDriver && (
                    <button
                      onClick={() => openEditModal(v)}
                      className="btn btn-secondary btn-icon"
                      style={{ width: '32px', height: '32px' }}
                      title="Sửa xe"
                    >
                      <Edit size={14} />
                    </button>
                  )}

                  {!isDriver && v.status !== 'DECOMMISSIONED' && (
                    <button
                      onClick={() => setDeletingVehicle(v)}
                      className="btn btn-danger btn-icon"
                      style={{ width: '32px', height: '32px' }}
                      title="Ngừng khai thác"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Data Table View */
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Biển số xe</th>
                <th>Hãng & Dòng xe</th>
                <th>Phân loại</th>
                <th>Số chỗ</th>
                <th>Năm SX</th>
                <th>Odometer</th>
                <th>Tài xế phụ trách</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id}>
                  <td className="mono" style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
                    {v.licensePlate}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    {v.brand} {v.model}
                  </td>
                  <td>
                    <span className="badge badge-neutral">{v.vehicleType}</span>
                  </td>
                  <td>{v.seatCapacity} chỗ</td>
                  <td className="mono">{v.manufactureYear}</td>
                  <td className="mono" style={{ fontWeight: 600 }}>
                    {v.currentOdometer.toLocaleString('vi-VN')} km
                  </td>
                  <td>
                    {v.assignedDriverName ? (
                      <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{v.assignedDriverName}</span>
                    ) : (
                      <span style={{ color: 'var(--text-dim)' }}>—</span>
                    )}
                  </td>
                  <td>{getStatusBadge(v.status)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.375rem' }}>
                      {v.status === 'AVAILABLE' && !isDriver && (
                        <button
                          onClick={() => openAssignModal(v)}
                          className="btn btn-primary btn-sm"
                          title="Bàn giao xe"
                        >
                          Bàn giao
                        </button>
                      )}
                      {v.status === 'IN_USE' && (
                        <button
                          onClick={() => openReturnModal(v)}
                          className="btn btn-primary btn-sm"
                          style={{ background: '#10b981' }}
                          title="Trả xe"
                        >
                          Trả xe
                        </button>
                      )}
                      {v.status === 'MAINTENANCE' && !isDriver && (
                        <button
                          onClick={() => handleFinishMaintenance(v)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--accent-amber)' }}
                          title="Xong bảo dưỡng"
                        >
                          Xong BD
                        </button>
                      )}
                      {!isDriver && (
                        <button
                          onClick={() => openEditModal(v)}
                          className="btn btn-secondary btn-icon"
                          title="Sửa xe"
                        >
                          <Edit size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Vehicle Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Thêm phương tiện mới vào đội xe"
      >
        <form onSubmit={handleAddSubmit}>
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
                <option value="SEDAN">Sedan (4-5 chỗ)</option>
                <option value="SUV">SUV / Crossover (5-7 chỗ)</option>
                <option value="PICKUP">Xe bán tải (Pickup)</option>
                <option value="VAN">Xe chở khách (Van 16 chỗ)</option>
                <option value="TRUCK">Xe tải hàng hóa</option>
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Hủy bỏ
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Đang thêm...' : 'Thêm phương tiện'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Vehicle Modal */}
      {selectedVehicle && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Chỉnh sửa xe: ${selectedVehicle.licensePlate}`}
        >
          <form onSubmit={handleEditSubmit}>
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
                  <option value="SEDAN">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="PICKUP">Pickup</option>
                  <option value="VAN">Van</option>
                  <option value="TRUCK">Truck</option>
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="btn btn-secondary"
                disabled={isSubmitting}
              >
                Hủy bỏ
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Đang cập nhật...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Assign Driver Modal */}
      {selectedVehicle && (
        <Modal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          title={`Bàn giao phương tiện: ${selectedVehicle.licensePlate}`}
        >
          <form onSubmit={handleAssignSubmit}>
            <div style={{ marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Bàn giao xe <strong>{selectedVehicle.brand} {selectedVehicle.model}</strong> cho tài xế chịu trách nhiệm vận hành. Trạng thái xe sẽ chuyển sang <strong>ĐANG CHẠY</strong>.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Chọn tài xế phụ trách</label>
              {availableDrivers.length === 0 ? (
                <div style={{ padding: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-amber)', borderRadius: '10px', fontSize: '0.8125rem' }}>
                  Hiện không có tài xế nào sẵn sàng. Vui lòng kiểm tra lại lịch trình nhân sự.
                </div>
              ) : (
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value ? Number(e.target.value) : '')}
                  className="form-select"
                  required
                >
                  <option value="">-- Chọn tài xế từ danh sách --</option>
                  {availableDrivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName} ({d.driverLicenseClass || 'B2'}) - {d.phone || d.email}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="btn btn-secondary"
                disabled={isSubmitting}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting || availableDrivers.length === 0 || !selectedDriverId}
              >
                {isSubmitting ? 'Đang bàn giao...' : 'Xác nhận bàn giao'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Return Vehicle / Odometer Update Modal */}
      {selectedVehicle && (
        <Modal
          isOpen={isReturnModalOpen}
          onClose={() => setIsReturnModalOpen(false)}
          title={`Bàn giao lại xe / Kết thúc chuyến: ${selectedVehicle.licensePlate}`}
        >
          <form onSubmit={handleReturnSubmit}>
            <div
              style={{
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '12px',
                padding: '1rem',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Số km lúc nhận bàn giao:</span>
                <span className="mono" style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                  {selectedVehicle.currentOdometer.toLocaleString('vi-VN')} km
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Mốc bảo dưỡng trước:</span>
                <span className="mono" style={{ fontSize: '0.8125rem', color: 'var(--text-dim)' }}>
                  {selectedVehicle.lastMaintenanceOdometer.toLocaleString('vi-VN')} km
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Số km công-tơ-mét hiện tại <span style={{ color: 'var(--accent-rose)' }}>*</span>
              </label>
              <input
                type="number"
                placeholder="Nhập số km mới"
                value={returnKm}
                onChange={(e) => handleReturnKmChange(e.target.value)}
                className={`form-input mono ${kmError ? 'input-error' : ''}`}
                style={{ fontSize: '1.125rem', fontWeight: 700 }}
                required
              />
              {kmError && <div className="form-error-msg">{kmError}</div>}
              {kmWarning && (
                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '8px',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.75rem',
                    color: 'var(--accent-amber)',
                    marginTop: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                  }}
                >
                  <AlertTriangle size={14} />
                  <span>{kmWarning}</span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Ghi chú tình trạng bàn giao</label>
              <textarea
                rows={3}
                placeholder="Xe hoạt động ổn định, đã vệ sinh sạch sẽ trước khi bàn giao..."
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                className="form-textarea"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setIsReturnModalOpen(false)}
                className="btn btn-secondary"
                disabled={isSubmitting}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting || !!kmError}
              >
                {isSubmitting ? 'Đang cập nhật...' : 'Hoàn thành bàn giao'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Soft Delete Confirmation Modal */}
      {deletingVehicle && (
        <ConfirmModal
          isOpen={!!deletingVehicle}
          onClose={() => setDeletingVehicle(null)}
          onConfirm={confirmDelete}
          title="Xác nhận ngừng khai thác xe"
          message={`Bạn có chắc chắn muốn ngừng khai thác phương tiện ${deletingVehicle.licensePlate} (${deletingVehicle.brand} ${deletingVehicle.model})? Trạng thái xe sẽ chuyển sang DECOMMISSIONED để bảo toàn dữ liệu tài chính lịch sử.`}
          confirmText="Xác nhận ngừng khai thác"
          isDangerous={true}
        />
      )}
    </div>
  );
};

export default VehiclePage;
