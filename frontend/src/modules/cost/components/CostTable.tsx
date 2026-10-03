import React, { useState } from 'react';
import { CostRecord, VehicleOption, COST_TYPE_LABELS } from '../types';
import { formatVND } from './CostSummaryCards';
import { Edit2, Trash2, Fuel, Wrench, Navigation, ShieldCheck, HelpCircle, AlertTriangle, Wallet } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';

interface CostTableProps {
  costs: CostRecord[];
  vehicles: VehicleOption[];
  loading: boolean;
  onEdit: (cost: CostRecord) => void;
  onDelete: (id: number) => Promise<void>;
  onCreateClick: () => void;
}

export const CostTable: React.FC<CostTableProps> = ({
  costs,
  vehicles,
  loading,
  onEdit,
  onDelete,
  onCreateClick
}) => {
  const [deleteTarget, setDeleteTarget] = useState<CostRecord | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const getVehicleDisplay = (vehicleId: number) => {
    const v = vehicles.find(item => item.id === vehicleId);
    return v ? `${v.licensePlate} (${v.model})` : `Xe #${vehicleId}`;
  };

  const getVehiclePlate = (vehicleId: number) => {
    const v = vehicles.find(item => item.id === vehicleId);
    return v ? v.licensePlate : `Xe #${vehicleId}`;
  };

  const getCostTypeIcon = (type: string) => {
    switch (type) {
      case 'FUEL': return <Fuel size={14} />;
      case 'MAINTENANCE': return <Wrench size={14} />;
      case 'TOLL': return <Navigation size={14} />;
      case 'INSURANCE': return <ShieldCheck size={14} />;
      default: return <HelpCircle size={14} />;
    }
  };

  const totalFilteredAmount = costs.reduce((sum, item) => sum + (item.amount || 0), 0);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await onDelete(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                borderBottom: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <th style={{ padding: '0.875rem 1rem' }}>Mã</th>
                <th style={{ padding: '0.875rem 1rem' }}>Phương tiện</th>
                <th style={{ padding: '0.875rem 1rem' }}>Loại chi phí</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Số tiền (VNĐ)</th>
                <th style={{ padding: '0.875rem 1rem' }}>Ngày phát sinh</th>
                <th style={{ padding: '0.875rem 1rem' }}>Nội dung / Chứng từ</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '0.5rem' }} />
                    <div>Đang tải dữ liệu chi phí...</div>
                  </td>
                </tr>
              ) : costs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3.5rem 1rem', textAlign: 'center' }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.75rem',
                      maxWidth: '400px',
                      margin: '0 auto'
                    }}>
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent-amber)'
                      }}>
                        <Wallet size={28} />
                      </div>
                      <h4 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Chưa có khoản chi phí nào</h4>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        Chưa có khoản chi phí nào được ghi nhận cho bộ lọc hiện tại. Bấm nút bên dưới để tạo phiếu chi đầu tiên.
                      </p>
                      <button
                        className="btn btn-primary"
                        onClick={onCreateClick}
                        style={{ marginTop: '0.5rem' }}
                      >
                        + Tạo phiếu chi phí đầu tiên
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                costs.map((item) => {
                  const meta = COST_TYPE_LABELS[item.costType] || COST_TYPE_LABELS.OTHER;
                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '0.875rem 1rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', fontSize: '0.8125rem' }}>
                        #{item.id}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>
                        <span style={{ color: 'var(--text-main)' }}>{getVehicleDisplay(item.vehicleId)}</span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            padding: '0.25rem 0.625rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor: meta.bg,
                            color: meta.color,
                            border: `1px solid ${meta.border}`
                          }}
                        >
                          {getCostTypeIcon(item.costType)}
                          <span>{meta.label}</span>
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontWeight: 700, color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)', fontSize: '0.9375rem' }}>
                        {formatVND(item.amount)}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                        {item.costDate}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)', maxWidth: '280px' }}>
                        <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={item.description || ''}>
                          {item.description || <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Không có ghi chú</span>}
                        </div>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                          <button
                            onClick={() => onEdit(item)}
                            title="Chỉnh sửa phiếu chi"
                            style={{
                              padding: '0.375rem',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(59, 130, 246, 0.1)',
                              border: '1px solid rgba(59, 130, 246, 0.2)',
                              color: 'var(--accent-blue)',
                              cursor: 'pointer'
                            }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(item)}
                            title="Xóa phiếu chi"
                            style={{
                              padding: '0.375rem',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              color: 'var(--accent-rose)',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Dynamic Table Footer Summary */}
            {costs.length > 0 && (
              <tfoot>
                <tr style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.45)',
                  borderTop: '2px solid var(--border-color)',
                  fontWeight: 700
                }}>
                  <td colSpan={3} style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                    Tổng số phiếu chi: <strong style={{ color: 'var(--text-main)' }}>{costs.length}</strong>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--accent-amber)', fontSize: '1.0625rem', fontFamily: 'var(--font-mono)' }}>
                    {formatVND(totalFilteredAmount)}
                  </td>
                  <td colSpan={3} style={{ padding: '1rem', color: 'var(--text-dim)', fontSize: '0.8125rem' }}>
                    (Tổng cộng theo danh sách đang lọc)
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Xác Nhận Xóa Phiếu Chi Phí"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-rose)',
                flexShrink: 0
              }}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <p style={{ fontSize: '0.9375rem', lineHeight: 1.6 }}>
                  Bạn có chắc chắn muốn xóa phiếu chi <strong>{formatVND(deleteTarget.amount)}</strong> cho xe <strong>{getVehiclePlate(deleteTarget.vehicleId)}</strong>?
                </p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--accent-rose)', marginTop: '0.5rem', lineHeight: 1.5 }}>
                  ⚠️ Hành động này sẽ thay đổi số liệu báo cáo tài chính và không thể hoàn tác.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Hủy bỏ
              </Button>
              <button
                className="btn"
                style={{ backgroundColor: 'var(--accent-rose)', color: '#ffffff', fontWeight: 600 }}
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Đang xóa...' : 'Xác nhận xóa phiếu'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
