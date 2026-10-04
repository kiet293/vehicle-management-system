import React from 'react';
import { Mail, AlertTriangle, DollarSign, CheckCircle2, ShieldCheck } from 'lucide-react';
import { EmailLog } from '../types';

interface EmailStatsCardsProps {
  logs: EmailLog[];
}

export const EmailStatsCards: React.FC<EmailStatsCardsProps> = ({ logs }) => {
  const total = logs.length;
  const maintenanceCount = logs.filter((l) => l.type === 'MAINTENANCE_ALERT').length;
  const costCount = logs.filter((l) => l.type === 'HIGH_COST_ALERT').length;
  const successCount = logs.filter((l) => l.status === 'SENT' || l.status === 'MOCK_SENT').length;
  const failedCount = logs.filter((l) => l.status === 'FAILED').length;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
      }}
    >
      {/* Total Sent */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Tổng Email Đã Gửi
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.25rem' }}>
              {total}
            </div>
          </div>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-blue)',
            }}
          >
            <Mail size={20} />
          </div>
        </div>
        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <CheckCircle2 size={12} />
          <span>{successCount} thành công</span>
          {failedCount > 0 && (
            <span style={{ color: 'var(--accent-rose)', marginLeft: '6px' }}>• {failedCount} thất bại</span>
          )}
        </div>
      </div>

      {/* Maintenance Alerts */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Cảnh Báo Bảo Dưỡng
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent-amber)', marginTop: '0.25rem' }}>
              {maintenanceCount}
            </div>
          </div>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-amber)',
            }}
          >
            <AlertTriangle size={20} />
          </div>
        </div>
        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Tự động kích hoạt khi xe &gt; 5.000 km
        </div>
      </div>

      {/* High Cost Alerts */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Cảnh Báo Chi Phí Lớn
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent-rose)', marginTop: '0.25rem' }}>
              {costCount}
            </div>
          </div>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(244, 63, 94, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-rose)',
            }}
          >
            <DollarSign size={20} />
          </div>
        </div>
        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Ngưỡng phát hiện khoản chi &gt; 5.000.000 ₫
        </div>
      </div>

      {/* System Service Status */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Cơ Chế Cô Lập Lỗi
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-emerald)', marginTop: '0.5rem' }}>
              Fault-Isolated
            </div>
          </div>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-emerald)',
            }}
          >
            <ShieldCheck size={20} />
          </div>
        </div>
        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Hỗ trợ JavaMailSender &amp; Gmail SMTP
        </div>
      </div>
    </div>
  );
};

export default EmailStatsCards;
