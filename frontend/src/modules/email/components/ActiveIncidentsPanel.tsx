import React from 'react';
import {
  AlertTriangle,
  Wrench,
  Send,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { Vehicle } from '../../../types';

interface ActiveIncidentsPanelProps {
  vehicles: Vehicle[];
  isLoading: boolean;
  onSelectIncidentVehicle: (vehicle: Vehicle) => void;
  onOpenGeneralIncident: () => void;
}

export const ActiveIncidentsPanel: React.FC<ActiveIncidentsPanelProps> = ({
  vehicles,
  isLoading,
  onSelectIncidentVehicle,
  onOpenGeneralIncident,
}) => {
  // Automatically identify vehicles with issues or incidents
  const incidentVehicles = vehicles.filter(
    (v) => v.maintenanceDue || v.status === 'MAINTENANCE' || v.status === 'DECOMMISSIONED'
  );

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      {/* Header section */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: incidentVehicles.length > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: incidentVehicles.length > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)',
            }}
          >
            {incidentVehicles.length > 0 ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Mục Sự Cố &amp; Cảnh Báo Phương Tiện Cần Thông Báo</span>
              {incidentVehicles.length > 0 && (
                <span className="badge badge-danger" style={{ fontSize: '0.75rem' }}>
                  {incidentVehicles.length} sự cố phát hiện
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Tự động phát hiện xe quá hạn bảo dưỡng hoặc đang bảo trì để gửi email thông báo cho khách hàng
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenGeneralIncident}
          className="btn btn-secondary btn-sm"
          style={{ fontWeight: 600 }}
        >
          <ShieldAlert size={14} color="var(--accent-amber)" />
          <span>Tạo Thông Báo Sự Cố Mới</span>
        </button>
      </div>

      {/* Incident Cards Grid */}
      {isLoading ? (
        <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
          Đang quét dữ liệu phương tiện từ hệ thống...
        </div>
      ) : incidentVehicles.length === 0 ? (
        <div
          style={{
            padding: '1.25rem',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px dashed rgba(16, 185, 129, 0.3)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckCircle2 size={20} color="var(--accent-emerald)" />
            <div style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>
              <strong>Tất cả phương tiện đều đang vận hành an toàn!</strong> Không có xe nào quá hạn bảo dưỡng hoặc gặp sự cố bảo trì.
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenGeneralIncident}
            className="btn btn-secondary btn-sm"
          >
            <span>Gửi thông báo chủ động</span>
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '0.875rem',
          }}
        >
          {incidentVehicles.map((v) => {
            const kmOver = v.currentOdometer - v.lastMaintenanceOdometer;
            const isMaintenance = v.status === 'MAINTENANCE';
            const isDue = v.maintenanceDue;

            return (
              <div
                key={v.id}
                style={{
                  background: 'var(--bg-card)',
                  border: isMaintenance
                    ? '1px solid rgba(239, 68, 68, 0.4)'
                    : '1px solid rgba(245, 158, 11, 0.4)',
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.875rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div>
                      <span className="mono" style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {v.licensePlate}
                      </span>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {v.brand} {v.model} ({v.manufactureYear})
                      </div>
                    </div>
                    {isMaintenance ? (
                      <span className="badge badge-danger">
                        <Wrench size={11} /> ĐANG BẢO TRÌ
                      </span>
                    ) : isDue ? (
                      <span className="badge badge-warning">
                        <AlertTriangle size={11} /> QUÁ HẠN BẢO DƯỠNG
                      </span>
                    ) : (
                      <span className="badge badge-neutral">SỰ CỐ KHÁC</span>
                    )}
                  </div>

                  <div
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.625rem 0.75rem',
                      background: 'var(--bg-card-subtle, rgba(255, 255, 255, 0.04))',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      lineHeight: 1.5,
                      color: 'var(--text-main)',
                    }}
                  >
                    <div>
                      📍 <strong>Hiện trạng:</strong> {isMaintenance ? 'Xe đang tại xưởng bảo trì kỹ thuật' : 'Đã đến mốc kiểm định bảo dưỡng định kỳ'}
                    </div>
                    <div style={{ marginTop: '2px', color: 'var(--text-muted)' }}>
                      📊 <strong>Số km:</strong> {v.currentOdometer.toLocaleString('vi-VN')} km ({kmOver > 0 ? `vượt +${kmOver.toLocaleString('vi-VN')} km` : 'chuẩn mốc'})
                    </div>
                    {v.assignedDriverName && (
                      <div style={{ marginTop: '2px', color: 'var(--accent-cyan)' }}>
                        👤 <strong>Tài xế phụ trách:</strong> {v.assignedDriverName}
                      </div>
                    )}
                  </div>
                </div>

                {/* Send Email Action Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
                  <button
                    type="button"
                    onClick={() => onSelectIncidentVehicle(v)}
                    className="btn btn-primary btn-sm"
                    style={{ fontWeight: 600, width: '100%', justifyContent: 'center' }}
                  >
                    <Send size={13} />
                    <span>Gửi Mail Cho Khách Hàng</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActiveIncidentsPanel;
