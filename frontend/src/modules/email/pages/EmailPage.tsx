import React, { useState, useEffect } from 'react';
import { emailService } from '../services/emailService';
import { EmailLog, EmailType } from '../../../types';
import { useToast } from '../../../context/ToastContext';
import { TableSkeleton } from '../../../components/common/Skeleton';
import { EmptyState } from '../../../components/common/EmptyState';
import {
  Bell,
  Mail,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  RotateCcw,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export const EmailPage: React.FC = () => {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [filterDays, setFilterDays] = useState(30);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await emailService.getLogs(filterDays);
      setLogs(data);
    } catch {
      showToast('error', 'Không thể nạp nhật ký cảnh báo email');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterDays]);

  const handleSendTest = async (type: EmailType) => {
    setIsSendingTest(true);
    try {
      const result = await emailService.sendTestAlert(type);
      showToast('success', `Đã kích hoạt cảnh báo thử nghiệm thành công: "${result.subject}"`);
      fetchLogs();
    } catch {
      showToast('error', 'Không thể kích hoạt gửi thử');
    } finally {
      setIsSendingTest(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'SENT') {
      return (
        <span className="badge badge-success">
          <CheckCircle2 size={12} /> ĐÃ GỬI (SMTP)
        </span>
      );
    }
    if (status === 'MOCK_SENT') {
      return (
        <span className="badge badge-info">
          <Sparkles size={12} /> GIẢ LẬP GỬI (MOCK)
        </span>
      );
    }
    return (
      <span className="badge badge-danger">
        <XCircle size={12} /> THẤT BẠI
      </span>
    );
  };

  const getTypeBadge = (type: EmailType) => {
    if (type === 'MAINTENANCE_ALERT') {
      return <span className="badge badge-warning">CẢNH BÁO BẢO DƯỠNG</span>;
    }
    if (type === 'HIGH_COST_ALERT') {
      return <span className="badge badge-danger">CHI PHÍ ĐỘT BIẾN</span>;
    }
    if (type === 'ASSIGNMENT_NOTIFICATION') {
      return <span className="badge badge-info">BÀN GIAO XE</span>;
    }
    return <span className="badge badge-neutral">THÔNG BÁO</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner & Title */}
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
            <Bell size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 700, margin: 0 }}>
              Nhật ký Cảnh báo & Dịch vụ Email
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
              Giám sát ngưỡng bảo dưỡng định kỳ, chi phí đột biến và thông báo tự động
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select
            className="form-control"
            style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.8125rem' }}
            value={filterDays}
            onChange={(e) => setFilterDays(Number(e.target.value))}
          >
            <option value={7}>7 ngày qua</option>
            <option value={30}>30 ngày qua</option>
            <option value={90}>90 ngày qua</option>
          </select>
          <button
            onClick={() => handleSendTest('MAINTENANCE_ALERT')}
            className="btn btn-secondary btn-sm"
            disabled={isSendingTest}
            title="Thử gửi cảnh báo bảo dưỡng"
          >
            <AlertTriangle size={14} color="var(--accent-amber)" />
            <span>Test Cảnh báo BD</span>
          </button>
          <button
            onClick={() => handleSendTest('HIGH_COST_ALERT')}
            className="btn btn-secondary btn-sm"
            disabled={isSendingTest}
            title="Thử gửi cảnh báo chi phí lớn"
          >
            <Mail size={14} color="var(--accent-rose)" />
            <span>Test Cảnh báo Chi phí</span>
          </button>
          <button onClick={fetchLogs} className="btn btn-secondary btn-sm">
            <RotateCcw size={14} /> Làm mới
          </button>
        </div>
      </div>

      {/* Fault Isolation Information Box */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.05) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-emerald)',
            flexShrink: 0,
          }}
        >
          <ShieldCheck size={20} />
        </div>
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
            Nguyên tắc Cô lập lỗi (Fault Isolation Architecture)
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
            Email Service hoạt động phi trạng thái (Stateless) dưới nền. Ngay cả khi mất kết nối SMTP hoặc lỗi mạng ngoại vi, các giao dịch tạo chi phí và cập nhật km ở các dịch vụ khác vẫn hoàn thành thành công 100%.
          </p>
        </div>
      </div>

      {/* Logs Table */}
      {isLoading ? (
        <TableSkeleton rows={5} columns={5} />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={<Bell size={32} />}
          title="Chưa có cảnh báo nào phát sinh"
          description="Đội xe đang vận hành ổn định trong phạm vi an toàn. Hệ thống sẽ tự động gửi email khi có xe đến hạn bảo dưỡng hoặc chi phí đột biến."
          actionText="Kích hoạt cảnh báo thử nghiệm"
          onAction={() => handleSendTest('MAINTENANCE_ALERT')}
        />
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '160px' }}>Thời gian gửi</th>
                <th>Người nhận</th>
                <th>Loại thông báo</th>
                <th>Tiêu đề & Nội dung cảnh báo</th>
                <th style={{ textAlign: 'right', width: '150px' }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="mono" style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      {new Date(log.sentAt).toLocaleString('vi-VN')}
                    </div>
                  </td>
                  <td className="mono" style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
                    {log.recipient}
                  </td>
                  <td>{getTypeBadge(log.type)}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem' }}>
                      {log.subject}
                    </div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        marginTop: '3px',
                        lineHeight: 1.4,
                        maxWidth: '520px',
                      }}
                    >
                      {log.content}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {getStatusBadge(log.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmailPage;
