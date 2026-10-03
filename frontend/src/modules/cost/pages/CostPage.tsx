import React, { useState, useEffect, useMemo } from 'react';
import { costService, CreateCostData } from '../services/costService';
import { vehicleService } from '../../vehicle/services/vehicleService';
import { Cost, CostType, Vehicle } from '../../../types';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { Modal } from '../../../components/common/Modal';
import { ConfirmModal } from '../../../components/common/ConfirmModal';
import { TableSkeleton } from '../../../components/common/Skeleton';
import { EmptyState } from '../../../components/common/EmptyState';
import {
  Receipt,
  Plus,
  Search,
  Trash2,
  Fuel,
  Ticket,
  Wrench,
  Shield,
  HelpCircle,
  Image as ImageIcon,
} from 'lucide-react';

export const CostPage: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const isDriver = user?.role === 'DRIVER';

  const [costs, setCosts] = useState<Cost[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | 'ALL'>('ALL');
  const [selectedCostType, setSelectedCostType] = useState<CostType | 'ALL'>('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Add Cost Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formVehicleId, setFormVehicleId] = useState<number | ''>('');
  const [formCostType, setFormCostType] = useState<CostType>('FUEL');
  const [rawAmount, setRawAmount] = useState<string>('');
  const [costDate, setCostDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [odometerAtCost, setOdometerAtCost] = useState<string>('');
  const [description, setDescription] = useState('');
  const [receiptImageUrl, setReceiptImageUrl] = useState('');

  // Image preview modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Delete modal
  const [deletingCost, setDeletingCost] = useState<Cost | null>(null);

  const fetchVehicles = async () => {
    try {
      const data = await vehicleService.getVehicles();
      setVehicles(data);
    } catch {
      setVehicles([]);
    }
  };

  const fetchCosts = async () => {
    setIsLoading(true);
    try {
      const data = await costService.getCosts(
        selectedVehicleId === 'ALL' ? undefined : selectedVehicleId,
        selectedCostType === 'ALL' ? undefined : selectedCostType,
        fromDate || undefined,
        toDate || undefined,
        isDriver && user ? user.id : undefined,
        search
      );
      setCosts(data);
    } catch {
      showToast('error', 'Không thể tải danh sách chi phí');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCosts();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedVehicleId, selectedCostType, fromDate, toDate]);

  // Live Currency Masking
  const formatLiveCurrency = (val: string): string => {
    const num = val.replace(/\D/g, '');
    if (!num) return '';
    return parseInt(num, 10).toLocaleString('vi-VN') + ' ₫';
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value.replace(/\D/g, '');
    setRawAmount(inputVal);
  };

  const openAddModal = () => {
    setFormVehicleId(vehicles.length > 0 ? vehicles[0].id : '');
    setFormCostType('FUEL');
    setRawAmount('');
    setCostDate(new Date().toISOString().split('T')[0]);
    setOdometerAtCost('');
    setDescription('');
    setReceiptImageUrl('');
    setIsModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formVehicleId) {
      showToast('error', 'Vui lòng chọn phương tiện phát sinh chi phí');
      return;
    }
    const amt = parseInt(rawAmount, 10);
    if (isNaN(amt) || amt <= 0) {
      showToast('error', 'Số tiền chi phí phải lớn hơn 0 ₫');
      return;
    }
    const targetVeh = vehicles.find((v) => v.id === Number(formVehicleId));

    setIsSubmitting(true);
    try {
      const data: CreateCostData = {
        vehicleId: Number(formVehicleId),
        vehiclePlate: targetVeh ? targetVeh.licensePlate : 'N/A',
        driverId: user?.id,
        driverName: user?.fullName,
        costType: formCostType,
        amount: amt,
        odometerAtCost: odometerAtCost ? parseInt(odometerAtCost, 10) : undefined,
        costDate,
        description,
        receiptImageUrl: receiptImageUrl.trim() || undefined,
      };

      const created = await costService.createCost(data);
      showToast('success', `Đã ghi nhận phiếu chi phí ${created.amount.toLocaleString('vi-VN')} ₫ cho xe ${created.vehiclePlate}!`);
      setIsModalOpen(false);
      fetchCosts();
    } catch (err: unknown) {
      let msg = 'Không thể ghi nhận phiếu chi';
      if (err && typeof err === 'object' && 'response' in err) {
        const res = (err as { response?: { data?: { message?: string } } }).response;
        if (res?.data?.message) msg = res.data.message;
      }
      showToast('error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingCost) return;
    try {
      await costService.deleteCost(deletingCost.id);
      showToast('success', 'Đã xóa phiếu chi thành công!');
      setDeletingCost(null);
      fetchCosts();
    } catch {
      showToast('error', 'Không thể xóa phiếu chi');
    }
  };

  // Dynamic filtered total calculation
  const filteredTotal = useMemo(() => {
    return costs.reduce((sum, item) => sum + Number(item.amount), 0);
  }, [costs]);

  const getCostTypeBadge = (t: CostType) => {
    if (t === 'FUEL') {
      return <span className="badge badge-info"><Fuel size={12} /> XĂNG DẦU</span>;
    }
    if (t === 'TOLL') {
      return <span className="badge badge-warning"><Ticket size={12} /> VÉ CẦU ĐƯỜNG</span>;
    }
    if (t === 'MAINTENANCE') {
      return <span className="badge badge-purple"><Wrench size={12} /> BẢO DƯỠNG</span>;
    }
    if (t === 'INSURANCE') {
      return <span className="badge badge-success"><Shield size={12} /> BẢO HIỂM</span>;
    }
    return <span className="badge badge-neutral"><HelpCircle size={12} /> KHÁC</span>;
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
            <Receipt size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 700, margin: 0 }}>
              Kê khai & Quản lý Chi phí Vận hành
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
              Ghi nhận nhiên liệu, vé BOT, bảo dưỡng định kỳ và đối soát minh bạch
            </p>
          </div>
        </div>

        <button onClick={openAddModal} className="btn btn-primary" id="add-cost-btn">
          <Plus size={18} />
          <span>+ Tạo phiếu chi phí</span>
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
        <div style={{ position: 'relative', minWidth: '220px', flex: 1 }}>
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
            placeholder="Tìm theo biển số, ghi chú, người chi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Vehicle Filter */}
          <select
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            className="form-select"
            style={{ width: 'auto', minWidth: '150px' }}
          >
            <option value="ALL">Tất cả phương tiện</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.licensePlate} ({v.brand} {v.model})
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={selectedCostType}
            onChange={(e) => setSelectedCostType(e.target.value as CostType | 'ALL')}
            className="form-select"
            style={{ width: 'auto', minWidth: '140px' }}
          >
            <option value="ALL">Tất cả loại chi</option>
            <option value="FUEL">Nhiên liệu (Xăng/Điện)</option>
            <option value="TOLL">Vé cầu đường BOT</option>
            <option value="MAINTENANCE">Bảo dưỡng & Sửa chữa</option>
            <option value="INSURANCE">Bảo hiểm</option>
            <option value="OTHER">Khác</option>
          </select>

          {/* Date range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="form-input"
              style={{ width: 'auto', padding: '0.5rem 0.625rem', fontSize: '0.8125rem' }}
              title="Từ ngày"
            />
            <span style={{ color: 'var(--text-dim)' }}>-</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="form-input"
              style={{ width: 'auto', padding: '0.5rem 0.625rem', fontSize: '0.8125rem' }}
              title="Đến ngày"
            />
          </div>
        </div>
      </div>

      {/* Expense Table */}
      {isLoading ? (
        <TableSkeleton rows={6} columns={7} />
      ) : costs.length === 0 ? (
        <EmptyState
          icon={<Receipt size={28} />}
          title="Chưa có khoản chi phí nào"
          description="Chưa có phiếu chi nào được ghi nhận cho điều kiện lọc này. Hãy bấm nút bên dưới để tạo phiếu chi đầu tiên."
          actionText="+ Tạo phiếu chi mới"
          onAction={openAddModal}
        />
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '110px' }}>Ngày chi</th>
                <th>Phương tiện</th>
                <th>Khoản mục</th>
                <th>Số tiền</th>
                <th>Km lúc chi</th>
                <th>Người kê khai & Ghi chú</th>
                <th>Hóa đơn</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {costs.map((c) => (
                <tr key={c.id}>
                  <td className="mono" style={{ color: 'var(--text-muted)' }}>
                    {new Date(c.costDate).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="mono" style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
                    {c.vehiclePlate}
                  </td>
                  <td>{getCostTypeBadge(c.costType)}</td>
                  <td className="mono" style={{ fontWeight: 700, color: Number(c.amount) > 5000000 ? 'var(--accent-rose)' : 'var(--accent-emerald)', fontSize: '0.9375rem' }}>
                    {Number(c.amount).toLocaleString('vi-VN')} ₫
                  </td>
                  <td className="mono" style={{ color: 'var(--text-dim)' }}>
                    {c.odometerAtCost ? `${c.odometerAtCost.toLocaleString('vi-VN')} km` : '—'}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.8125rem' }}>
                      {c.driverName || 'Quản lý'}
                    </div>
                    {c.description && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {c.description}
                      </div>
                    )}
                  </td>
                  <td>
                    {c.receiptImageUrl ? (
                      <button
                        onClick={() => setPreviewImage(c.receiptImageUrl || null)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <ImageIcon size={12} /> Xem ảnh
                      </button>
                    ) : (
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Không có</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {!isDriver && (
                      <button
                        onClick={() => setDeletingCost(c)}
                        className="btn btn-danger btn-icon"
                        style={{ width: '30px', height: '30px' }}
                        title="Xóa phiếu chi"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Dynamic Table Footer Summary */}
            <tfoot>
              <tr>
                <td colSpan={3} style={{ textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                  Tổng cộng chi phí ({costs.length} phiếu):
                </td>
                <td className="mono" style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
                  {filteredTotal.toLocaleString('vi-VN')} ₫
                </td>
                <td colSpan={4} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Add Cost Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Kê khai phiếu chi phí mới"
      >
        <form onSubmit={handleCreateSubmit}>
          {/* Vehicle selector */}
          <div className="form-group">
            <label className="form-label">
              Phương tiện phát sinh chi phí <span style={{ color: 'var(--accent-rose)' }}>*</span>
            </label>
            <select
              value={formVehicleId}
              onChange={(e) => setFormVehicleId(Number(e.target.value))}
              className="form-select"
              required
            >
              <option value="">-- Chọn phương tiện --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.licensePlate} • {v.brand} {v.model} ({v.currentOdometer.toLocaleString('vi-VN')} km)
                </option>
              ))}
            </select>
          </div>

          {/* Visual Category Tabs */}
          <div className="form-group">
            <label className="form-label">Khoản mục chi phí</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.375rem' }}>
              {[
                { type: 'FUEL', label: 'Xăng dầu', icon: <Fuel size={14} /> },
                { type: 'TOLL', label: 'Vé BOT', icon: <Ticket size={14} /> },
                { type: 'MAINTENANCE', label: 'Bảo dưỡng', icon: <Wrench size={14} /> },
                { type: 'INSURANCE', label: 'Bảo hiểm', icon: <Shield size={14} /> },
                { type: 'OTHER', label: 'Khác', icon: <HelpCircle size={14} /> },
              ].map((item) => {
                const isSelected = formCostType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setFormCostType(item.type as CostType)}
                    className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '0.625rem 0.25rem',
                      gap: '4px',
                      fontSize: '0.75rem',
                      border: isSelected ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)',
                    }}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
            {/* Amount with Live Masking */}
            <div className="form-group">
              <label className="form-label">
                Số tiền chi (VNĐ) <span style={{ color: 'var(--accent-rose)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="VD: 850.000 ₫"
                  value={rawAmount ? formatLiveCurrency(rawAmount) : ''}
                  onChange={handleAmountChange}
                  className="form-input mono"
                  style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--accent-cyan)' }}
                  required
                />
              </div>
              {rawAmount && parseInt(rawAmount, 10) > 5000000 && (
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', marginTop: '0.25rem' }}>
                  ⚠️ Khoản chi vượt 5.000.000 ₫ sẽ tự động kích hoạt email cảnh báo khẩn tới Quản lý.
                </div>
              )}
            </div>

            {/* Cost Date */}
            <div className="form-group">
              <label className="form-label">
                Ngày phát sinh <span style={{ color: 'var(--accent-rose)' }}>*</span>
              </label>
              <input
                type="date"
                value={costDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setCostDate(e.target.value)}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Số km tại thời điểm chi (Odometer)</label>
            <input
              type="number"
              placeholder="VD: 15250"
              value={odometerAtCost}
              onChange={(e) => setOdometerAtCost(e.target.value)}
              className="form-input mono"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Ghi chú chi tiết</label>
            <textarea
              rows={2}
              placeholder="Đổ đầy bình xăng RON 95 tại Petrolimex số 3..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-textarea"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Đường dẫn ảnh chứng từ / hóa đơn (URL)</label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={receiptImageUrl}
              onChange={(e) => setReceiptImageUrl(e.target.value)}
              className="form-input"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Hủy bỏ
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : 'Lưu phiếu chi'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Receipt Image Preview Modal */}
      {previewImage && (
        <Modal
          isOpen={!!previewImage}
          onClose={() => setPreviewImage(null)}
          title="Chứng từ / Hóa đơn chi phí"
          maxWidth="640px"
        >
          <div style={{ textAlign: 'center' }}>
            <img
              src={previewImage}
              alt="Hóa đơn"
              style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '12px', border: '1px solid var(--border-color)' }}
            />
          </div>
        </Modal>
      )}

      {/* Delete Cost Confirmation */}
      {deletingCost && (
        <ConfirmModal
          isOpen={!!deletingCost}
          onClose={() => setDeletingCost(null)}
          onConfirm={confirmDelete}
          title="Xác nhận xóa phiếu chi"
          message={`Bạn có chắc chắn muốn xóa phiếu chi ${Number(deletingCost.amount).toLocaleString('vi-VN')} ₫ cho xe ${deletingCost.vehiclePlate}? Hành động này sẽ thay đổi số liệu báo cáo tài chính.`}
          confirmText="Xác nhận xóa"
          isDangerous={true}
        />
      )}
    </div>
  );
};

export default CostPage;
