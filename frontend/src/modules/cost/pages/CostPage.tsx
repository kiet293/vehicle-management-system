import React, { useState, useEffect, useCallback } from 'react';
import { CostRecord, CostFilter, CostFormData, CostSummary, VehicleOption } from '../types';
import costService, { DEFAULT_VEHICLES } from '../services/costService';
import { CostSummaryCards, formatVND } from '../components/CostSummaryCards';
import { CostFilterBar } from '../components/CostFilterBar';
import { CostTable } from '../components/CostTable';
import { CostFormModal } from '../components/CostFormModal';
import { DollarSign, Plus, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export const CostPage: React.FC = () => {
  const [costs, setCosts] = useState<CostRecord[]>([]);
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [vehicles, setVehicles] = useState<VehicleOption[]>(DEFAULT_VEHICLES);
  const [filter, setFilter] = useState<CostFilter>({
    vehicleId: '',
    costType: '',
    startDate: '',
    endDate: '',
    search: ''
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingCost, setEditingCost] = useState<CostRecord | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [fetchedCosts, fetchedSummary, fetchedVehicles] = await Promise.all([
        costService.getCosts(filter),
        costService.getCostSummary({
          vehicleId: filter.vehicleId ? Number(filter.vehicleId) : undefined,
          startDate: filter.startDate || undefined,
          endDate: filter.endDate || undefined
        }),
        costService.getVehicles()
      ]);

      setCosts(fetchedCosts);
      setSummary(fetchedSummary);
      if (fetchedVehicles && fetchedVehicles.length > 0) {
        setVehicles(fetchedVehicles);
      }
    } catch (err: any) {
      console.error('Error fetching cost records:', err);
      showToast('Không thể kết nối đến máy chủ quản lý chi phí.', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateNew = () => {
    setEditingCost(null);
    setModalOpen(true);
  };

  const handleEdit = (cost: CostRecord) => {
    setEditingCost(cost);
    setModalOpen(true);
  };

  const handleFormSubmit = async (formData: CostFormData) => {
    const selectedVehicle = vehicles.find(v => v.id === Number(formData.vehicleId));
    const plate = selectedVehicle ? selectedVehicle.licensePlate : `Xe #${formData.vehicleId}`;

    if (editingCost) {
      await costService.updateCost(editingCost.id, formData);
      showToast(`Đã cập nhật phiếu chi #${editingCost.id} (${formatVND(Number(formData.amount))}) thành công!`);
    } else {
      await costService.createCost(formData);
      showToast(`Đã ghi nhận phiếu chi phí ${formatVND(Number(formData.amount))} cho xe ${plate}`);
    }
    await loadData();
  };

  const handleDelete = async (id: number) => {
    try {
      await costService.deleteCost(id);
      showToast(`Đã xóa phiếu chi phí #${id} thành công.`);
      await loadData();
    } catch (err: any) {
      showToast('Xóa phiếu chi thất bại: ' + err.message, 'error');
    }
  };

  const handleResetFilter = () => {
    setFilter({
      vehicleId: '',
      costType: '',
      startDate: '',
      endDate: '',
      search: ''
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: toast.type === 'success' ? '#064e3b' : '#7f1d1d',
            border: `1px solid ${toast.type === 'success' ? '#059669' : '#dc2626'}`,
            color: '#ffffff',
            padding: '0.875rem 1.25rem',
            borderRadius: '10px',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            maxWidth: '420px',
            animation: 'fadeIn 0.2s ease-in-out'
          }}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 size={18} color="#34d399" />
          ) : (
            <AlertCircle size={18} color="#f87171" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '1.75rem 2rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-amber)',
              border: '1px solid rgba(245, 158, 11, 0.25)'
            }}>
              <DollarSign size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <h1 style={{ fontSize: '1.625rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                  Quản Lý Chi Phí & Vận Hành Đội Xe
                </h1>
                <span className="badge badge-warning">
                  Port: 8083 • cost_db
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                Kê khai nhiên liệu, bảo dưỡng, vé BOT, phí bảo hiểm và kiểm soát ngân sách vận tải
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              className="btn btn-secondary"
              onClick={loadData}
              disabled={loading}
              title="Làm mới dữ liệu từ Cost Service"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>Làm mới</span>
            </button>
            <button
              className="btn btn-primary"
              onClick={handleCreateNew}
              style={{
                backgroundColor: 'var(--accent-amber)',
                color: '#000000',
                fontWeight: 700
              }}
            >
              <Plus size={18} />
              <span>+ Tạo phiếu chi phí</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Financial Summary Cards */}
      <CostSummaryCards summary={summary} loading={loading} />

      {/* Filter and Search Bar */}
      <CostFilterBar
        filter={filter}
        vehicles={vehicles}
        onChange={setFilter}
        onReset={handleResetFilter}
      />

      {/* Cost Records History Table */}
      <CostTable
        costs={costs}
        vehicles={vehicles}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreateClick={handleCreateNew}
      />

      {/* Modal for Create / Edit */}
      <CostFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingCost}
        vehicles={vehicles}
      />
    </div>
  );
};

export default CostPage;
