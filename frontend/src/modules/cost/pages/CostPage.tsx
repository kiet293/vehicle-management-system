import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Sparkles,
  UploadCloud,
  CheckCircle2,
  RefreshCw,
  Building2,
  FileCheck,
  X,
} from 'lucide-react';

export const CostPage: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const isDriver = user?.role === 'DRIVER';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [costs, setCosts] = useState<Cost[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [myVehicleIds, setMyVehicleIds] = useState<number[]>([]);
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

  // OCR state
  const [isScanningOcr, setIsScanningOcr] = useState(false);
  const [ocrAutoFilled, setOcrAutoFilled] = useState(false);
  const [ocrMessage, setOcrMessage] = useState<string | null>(null);
  const [isAiExtracted, setIsAiExtracted] = useState(false);
  const [scannedImageFile, setScannedImageFile] = useState<File | null>(null);
  const [scannedImagePreview, setScannedImagePreview] = useState<string | null>(null);

  // Form state
  const [formVehicleId, setFormVehicleId] = useState<number | ''>('');
  const [formCostType, setFormCostType] = useState<CostType>('FUEL');
  const [rawAmount, setRawAmount] = useState<string>('');
  const [costDate, setCostDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [odometerAtCost, setOdometerAtCost] = useState<string>('');
  const [description, setDescription] = useState('');
  const [receiptImageUrl, setReceiptImageUrl] = useState('');
  const [merchantName, setMerchantName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');

  // Image preview modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Delete modal
  const [deletingCost, setDeletingCost] = useState<Cost | null>(null);

  const fetchVehicles = async () => {
    try {
      const data = await vehicleService.getVehicles(
        undefined,
        undefined,
        undefined,
        isDriver && user ? user.id : undefined
      );
      setVehicles(data);
      setMyVehicleIds(isDriver ? data.map((v) => v.id) : []);
    } catch {
      setVehicles([]);
      setMyVehicleIds([]);
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
        undefined,
        search
      );
      // Tài xế chỉ thấy chi phí vận hành của (các) xe đang được bàn giao cho mình
      setCosts(isDriver ? data.filter((c) => myVehicleIds.includes(c.vehicleId)) : data);
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
  }, [search, selectedVehicleId, selectedCostType, fromDate, toDate, myVehicleIds]);

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
    setMerchantName('');
    setInvoiceNumber('');
    setOcrAutoFilled(false);
    setOcrMessage(null);
    setIsAiExtracted(false);
    setScannedImageFile(null);
    setScannedImagePreview(null);
    setIsModalOpen(true);
  };

  // OCR Receipt Scanning Handler
  const handleOcrFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      showToast('error', 'Chỉ chấp nhận file định dạng hình ảnh (JPG, PNG, WEBP) hoặc PDF');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      showToast('error', 'Kích thước file vượt quá 15MB');
      return;
    }

    setScannedImageFile(file);
    const localPreviewUrl = URL.createObjectURL(file);
    setScannedImagePreview(localPreviewUrl);
    setIsScanningOcr(true);
    setOcrMessage('Đang tải và quét dữ liệu hóa đơn bằng AI OCR...');

    try {
      const result = await costService.scanReceipt(file);

      // Auto-fill all fields
      if (result.amount) {
        setRawAmount(String(Math.round(result.amount)));
      }
      if (result.costType) {
        setFormCostType(result.costType);
      }
      if (result.costDate) {
        setCostDate(result.costDate);
      }
      if (result.merchantName) {
        setMerchantName(result.merchantName);
      }
      if (result.invoiceNumber) {
        setInvoiceNumber(result.invoiceNumber);
      }
      if (result.description) {
        setDescription(result.description);
      }
      if (result.receiptImageUrl) {
        setReceiptImageUrl(result.receiptImageUrl);
      }

      // Try matching vehicle plate if found in receipt
      if (result.vehiclePlate && vehicles.length > 0) {
        const cleanPlate = result.vehiclePlate.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const matchedVeh = vehicles.find((v) =>
          v.licensePlate.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().includes(cleanPlate)
        );
        if (matchedVeh) {
          setFormVehicleId(matchedVeh.id);
        }
      }

      setOcrAutoFilled(true);
      setIsAiExtracted(result.aiExtracted);
      setOcrMessage(result.message || 'Đã trích xuất thông tin hóa đơn thành công!');
      showToast('success', result.message || '✨ Đã trích xuất thông tin hóa đơn thành công!');
    } catch (err: unknown) {
      let msg = 'Không thể quét hóa đơn. Vui lòng thử lại hoặc nhập tay.';
      if (err && typeof err === 'object' && 'response' in err) {
        const res = (err as { response?: { data?: { message?: string } } }).response;
        if (res?.data?.message) msg = res.data.message;
      }
      setOcrMessage(msg);
      showToast('error', msg);
    } finally {
      setIsScanningOcr(false);
      // Reset input value so user can re-upload same file if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClearOcr = () => {
    setScannedImageFile(null);
    setScannedImagePreview(null);
    setOcrAutoFilled(false);
    setOcrMessage(null);
    setReceiptImageUrl('');
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
        driverEmail: user?.email,
        costType: formCostType,
        amount: amt,
        odometerAtCost: odometerAtCost ? parseInt(odometerAtCost, 10) : undefined,
        costDate,
        description: description.trim() || undefined,
        receiptImageUrl: receiptImageUrl.trim() || undefined,
        merchantName: merchantName.trim() || undefined,
        invoiceNumber: invoiceNumber.trim() || undefined,
      };

      const created = await costService.createCost(data);
      if (amt > 5000000) {
        showToast(
          'warning',
          `⚠️ Khoản chi ${created.amount.toLocaleString('vi-VN')} ₫ vượt 5.000.000 ₫: Đã tự động gửi email cảnh báo từ tài xế (${user?.fullName || 'Tài xế'} - ${user?.email || 'driver'}) tới Quản lý (nhuttd0105@gmail.com)!`,
          6500
        );
      } else {
        showToast('success', `Đã ghi nhận phiếu chi phí ${created.amount.toLocaleString('vi-VN')} ₫ cho xe ${created.vehiclePlate}!`);
      }
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
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '-0.5rem' }}>
        <button onClick={openAddModal} className="btn btn-primary" id="add-cost-btn">
          <Plus size={18} />
          <span>Tạo phiếu chi phí</span>
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
            placeholder="Tìm theo biển số, ghi chú, đơn vị, mã hóa đơn..."
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
            <option value="ALL">{isDriver ? 'Tất cả xe được giao' : 'Tất cả phương tiện'}</option>
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
                <th>Người kê khai & Đơn vị</th>
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
                    <div>{Number(c.amount).toLocaleString('vi-VN')} ₫</div>
                    {Number(c.amount) > 5000000 && (
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          color: 'var(--accent-amber)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                          background: 'rgba(245, 158, 11, 0.1)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          marginTop: '2px',
                        }}
                        title="Đã gửi email cảnh báo khẩn: Từ Tài xế tới Quản lý (nhuttd0105@gmail.com)"
                      >
                        ⚠️ &gt; 5tr (Tới Quản lý)
                      </span>
                    )}
                  </td>
                  <td className="mono" style={{ color: 'var(--text-dim)' }}>
                    {c.odometerAtCost ? `${c.odometerAtCost.toLocaleString('vi-VN')} km` : '—'}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.8125rem' }}>
                      {c.driverName || 'Quản lý'}
                    </div>
                    {c.merchantName && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                        <Building2 size={11} /> {c.merchantName}
                      </div>
                    )}
                    {c.invoiceNumber && (
                      <div style={{ fontSize: '0.71875rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <FileCheck size={11} /> HĐ: {c.invoiceNumber}
                      </div>
                    )}
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
        maxWidth="720px"
      >
        <form onSubmit={handleCreateSubmit}>
          {/* ========================================================================= */}
          {/* OCR AI RECEIPT UPLOAD & AUTO-EXTRACTION BANNER */}
          {/* ========================================================================= */}
          <div
            style={{
              marginBottom: '1.25rem',
              padding: '1rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
              border: ocrAutoFilled ? '1px solid rgba(16, 185, 129, 0.4)' : '1px dashed rgba(99, 102, 241, 0.35)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Header / Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    color: '#fff',
                  }}
                >
                  <Sparkles size={16} />
                </span>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Bóc tách hóa đơn tự động (AI OCR)
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Tải lên hóa đơn xăng dầu, vé BOT, hóa đơn bảo dưỡng để AI tự động điền toàn bộ form
                  </p>
                </div>
              </div>

              {ocrAutoFilled && (
                <span
                  className="badge"
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: 'var(--accent-emerald)',
                    fontSize: '0.71875rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '0.25rem 0.625rem',
                  }}
                >
                  <CheckCircle2 size={13} /> {isAiExtracted ? 'AI Vision' : 'Mô phỏng'}
                </span>
              )}
            </div>

            {/* Dropzone & Preview Box */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleOcrFileSelect}
              accept="image/*,application/pdf"
              style={{ display: 'none' }}
              disabled={isScanningOcr}
            />

            {scannedImagePreview ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  background: 'var(--bg-glass)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    cursor: 'pointer',
                  }}
                  onClick={() => setPreviewImage(scannedImagePreview)}
                  title="Bấm để xem ảnh phóng to"
                >
                  <img
                    src={scannedImagePreview}
                    alt="Hóa đơn đã chọn"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {scannedImageFile?.name || 'Ảnh hóa đơn'}
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>
                      ({scannedImageFile ? (scannedImageFile.size / 1024).toFixed(0) + ' KB' : ''})
                    </span>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: ocrAutoFilled ? 'var(--accent-emerald)' : 'var(--text-muted)', marginTop: '2px' }}>
                    {ocrMessage || 'Đã tải ảnh lên'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isScanningOcr}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.35rem 0.625rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    title="Đổi ảnh khác"
                  >
                    <RefreshCw size={12} className={isScanningOcr ? 'spin' : ''} />
                    <span>Đổi ảnh</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClearOcr}
                    disabled={isScanningOcr}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.35rem 0.5rem', color: 'var(--accent-rose)' }}
                    title="Xóa ảnh này"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '1.25rem',
                  borderRadius: '10px',
                  background: 'var(--bg-glass)',
                  border: '1px dashed var(--border-color)',
                  textAlign: 'center',
                  cursor: isScanningOcr ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {isScanningOcr ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <RefreshCw size={24} className="spin" style={{ color: 'var(--accent-blue)' }} />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      AI đang phân tích và trích xuất dữ liệu hóa đơn...
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Vui lòng chờ trong giây lát
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <UploadCloud size={28} style={{ color: 'var(--accent-blue)', opacity: 0.85 }} />
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      Kéo thả ảnh hóa đơn vào đây hoặc <span style={{ color: 'var(--accent-blue)', textDecoration: 'underline' }}>bấm để tải lên</span>
                    </div>
                    <div style={{ fontSize: '0.71875rem', color: 'var(--text-dim)' }}>
                      Hỗ trợ ảnh chụp JPG, PNG, WEBP hoặc PDF (Tối đa 15MB)
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Vehicle selector */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                Phương tiện phát sinh chi phí <span style={{ color: 'var(--accent-rose)' }}>*</span>
              </span>
              {ocrAutoFilled && (
                <span style={{ fontSize: '0.6875rem', color: 'var(--accent-emerald)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <Sparkles size={11} /> Khớp từ biển số hóa đơn
                </span>
              )}
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
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Khoản mục chi phí</span>
              {ocrAutoFilled && (
                <span style={{ fontSize: '0.6875rem', color: 'var(--accent-emerald)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <Sparkles size={11} /> AI tự động phân loại
                </span>
              )}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))', gap: '0.375rem' }}>
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

          <div className="form-grid-2">
            {/* Amount with Live Masking */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                  Số tiền chi (VNĐ) <span style={{ color: 'var(--accent-rose)' }}>*</span>
                </span>
                {ocrAutoFilled && (
                  <span style={{ fontSize: '0.6875rem', color: 'var(--accent-emerald)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <Sparkles size={11} /> Trích xuất từ hóa đơn
                  </span>
                )}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="VD: 850.000 ₫"
                  value={rawAmount ? formatLiveCurrency(rawAmount) : ''}
                  onChange={handleAmountChange}
                  className="form-input mono"
                  style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: 'var(--accent-cyan)',
                    borderColor: ocrAutoFilled ? 'rgba(16, 185, 129, 0.4)' : undefined,
                  }}
                  required
                />
              </div>
              {rawAmount && parseInt(rawAmount, 10) > 5000000 && (
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>⚠️ Khoản chi vượt 5.000.000 ₫ sẽ tự động gửi email cảnh báo từ tài xế ({user?.email || 'email tài xế'}) tới Quản lý (nhuttd0105@gmail.com).</span>
                </div>
              )}
            </div>

            {/* Cost Date */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                  Ngày phát sinh <span style={{ color: 'var(--accent-rose)' }}>*</span>
                </span>
                {ocrAutoFilled && (
                  <span style={{ fontSize: '0.6875rem', color: 'var(--accent-emerald)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <Sparkles size={11} /> Ngày hóa đơn
                  </span>
                )}
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

          {/* Merchant and Invoice Number row */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Đơn vị cung cấp / Nhà xe / Cây xăng</label>
              <input
                type="text"
                placeholder="VD: Petrolimex Cửa hàng số 15, Trạm BOT QL1A..."
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mã tra cứu / Số hóa đơn</label>
              <input
                type="text"
                placeholder="VD: HD0092812"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="form-input mono"
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
              type="text"
              placeholder="Tự động điền sau khi quét OCR hoặc nhập URL..."
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
              disabled={isSubmitting || isScanningOcr}
            >
              Hủy bỏ
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || isScanningOcr}>
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
          maxWidth="680px"
        >
          <div style={{ textAlign: 'center' }}>
            <img
              src={previewImage}
              alt="Hóa đơn"
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              }}
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
