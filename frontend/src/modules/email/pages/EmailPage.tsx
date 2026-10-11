import React, { useState, useEffect } from 'react';
import { emailService } from '../services/emailService';
import { vehicleService } from '../../vehicle/services/vehicleService';
import { EmailLog, EmailType, Vehicle } from '../../../types';
import { useToast } from '../../../context/ToastContext';
import { TableSkeleton } from '../../../components/common/Skeleton';
import { EmptyState } from '../../../components/common/EmptyState';
import { EmailLogDetailModal } from '../components/EmailLogDetailModal';
import { EmailStatsCards } from '../components/EmailStatsCards';
import { ActiveIncidentsPanel } from '../components/ActiveIncidentsPanel';
import { VehicleIncidentModal } from '../components/VehicleIncidentModal';
import {
  Bell,
  Mail,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  RotateCcw,
  Sparkles,
  Search,
  Filter,
  Eye,
  Send,
} from 'lucide-react';

export const EmailPage: React.FC = () => {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [filterDays, setFilterDays] = useState(30);

  // Vehicle incident data
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [selectedIncidentVehicle, setSelectedIncidentVehicle] = useState<Vehicle | null>(null);

  // Search & Type Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Modals state
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  // Latest Send Status Banner Feedback
  const [latestStatus, setLatestStatus] = useState<{
    type: 'SUCCESS' | 'FAILED';
    message: string;
    recipient: string;
    subject: string;
    statusBadge: string;
    time: string;
  } | null>(null);

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

  const fetchVehicles = async () => {
    setIsLoadingVehicles(true);
    try {
      const data = await vehicleService.getVehicles();
      setVehicles(data);
    } catch {
      // Graceful fallback
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchVehicles();
  }, [filterDays]);

  const handleOpenIncidentModal = (vehicle?: Vehicle | null) => {
    setSelectedIncidentVehicle(vehicle || null);
    setIsIncidentModalOpen(true);
  };

  const handleSendQuickTest = async (type: EmailType) => {
    setIsSendingTest(true);
    try {
      const result = await emailService.sendTestAlert(type);
      if (result.success && result.data) {
        const isSmtp = result.data.status === 'SENT';
        const statusLabel = isSmtp ? 'ĐÃ GỬI (SMTP GMAIL)' : 'MÔ PHỎNG (MOCK_SENT)';
        const msg = isSmtp
          ? `Đã gửi thành công qua SMTP Gmail: "${result.data.subject}"`
          : `Đã ghi nhận gửi thành công (Mô phỏng): "${result.data.subject}"`;

        setLatestStatus({
          type: 'SUCCESS',
          message: msg,
          recipient: result.data.recipient,
          subject: result.data.subject,
          statusBadge: statusLabel,
          time: new Date().toLocaleTimeString('vi-VN'),
        });

        showToast('success', msg);
        fetchLogs();
      } else {
        const errMsg = result.message || 'Gửi cảnh báo thử nghiệm thất bại.';
        setLatestStatus({
          type: 'FAILED',
          message: errMsg,
          recipient: 'N/A',
          subject: type,
          statusBadge: 'THẤT BẠI (FAILED)',
          time: new Date().toLocaleTimeString('vi-VN'),
        });
        showToast('error', errMsg);
      }
    } catch {
      const errMsg = 'Lỗi kết nối khi kích hoạt gửi email thử nghiệm.';
      setLatestStatus({
        type: 'FAILED',
        message: errMsg,
        recipient: 'N/A',
        subject: type,
        statusBadge: 'THẤT BẠI (FAILED)',
        time: new Date().toLocaleTimeString('vi-VN'),
      });
      showToast('error', errMsg);
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleResendFromLog = async (log: EmailLog) => {
    try {
      const res = await emailService.sendEmail({
        to: log.recipient,
        subject: log.subject,
        content: log.content,
        type: log.type,
      });
      if (res.success) {
        showToast('success', `Đã tự động gửi lại thông báo tới: ${log.recipient}`);
        fetchLogs();
      } else {
        showToast('error', res.message || 'Gửi lại email thất bại');
      }
    } catch {
      showToast('error', 'Lỗi kết nối khi gửi lại email');
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
          <Sparkles size={12} /> GIẢ LẬP (MOCK)
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
    switch (type) {
      case 'MAINTENANCE_ALERT':
        return <span className="badge badge-warning">CẢNH BÁO BẢO DƯỠNG</span>;
      case 'HIGH_COST_ALERT':
        return <span className="badge badge-danger">CHI PHÍ ĐỘT BIẾN</span>;
      case 'ASSIGNMENT_NOTIFICATION':
        return <span className="badge badge-info">BÀN GIAO XE</span>;
      case 'MANUAL':
        return <span className="badge badge-purple">GỬI THỦ CÔNG</span>;
      case 'TEST':
        return <span className="badge badge-neutral">KIỂM TRA (TEST)</span>;
      case 'AUTO_NOTIFICATION':
        return <span className="badge badge-success">TỰ ĐỘNG (AUTO)</span>;
      default:
        return <span className="badge badge-neutral">THÔNG BÁO</span>;
    }
  };

  // Filter logs by search term and type
  const filteredLogs = logs.filter((log) => {
    const matchSearch =
      searchTerm.trim() === '' ||
      log.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.content.toLowerCase().includes(searchTerm.toLowerCase());

    const matchType = typeFilter === 'ALL' || log.type === typeFilter;

    return matchSearch && matchType;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner & Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-blue)',
            }}
          >
            <Bell size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
              Dịch Vụ Email &amp; Cảnh Báo Bảo Dưỡng
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
              Backend Email Service (Port 8084) • Tự động gửi cảnh báo &amp; Giám sát hoạt động
            </p>
          </div>
        </div>

        {/* Action Buttons Header */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleOpenIncidentModal()}
            className="btn btn-primary"
            style={{ fontWeight: 600 }}
          >
            <AlertTriangle size={15} />
            <span>Thông Báo Sự Cố Cho Khách Hàng</span>
          </button>

          <button onClick={fetchLogs} className="btn btn-secondary" title="Làm mới danh sách">
            <RotateCcw size={14} /> Làm mới
          </button>
        </div>
      </div>

      {/* Latest Execution Status Feedback Card */}
      {latestStatus && (
        <div
          className="glass-panel"
          style={{
            padding: '1rem 1.25rem',
            background:
              latestStatus.type === 'SUCCESS'
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)'
                : 'linear-gradient(135deg, rgba(244, 63, 94, 0.15) 0%, rgba(225, 29, 72, 0.08) 100%)',
            border: `1px solid ${
              latestStatus.type === 'SUCCESS' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)'
            }`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            {latestStatus.type === 'SUCCESS' ? (
              <CheckCircle2 size={24} color="var(--accent-emerald)" />
            ) : (
              <XCircle size={24} color="var(--accent-rose)" />
            )}
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {latestStatus.type === 'SUCCESS' ? 'TRẠNG THÁI GỬI EMAIL: THÀNH CÔNG' : 'TRẠNG THÁI GỬI EMAIL: THẤT BẠI'}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {latestStatus.message} • Người nhận: <span style={{ color: 'var(--accent-cyan)' }}>{latestStatus.recipient}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className={latestStatus.type === 'SUCCESS' ? 'badge badge-success' : 'badge badge-danger'}>
              {latestStatus.statusBadge}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{latestStatus.time}</span>
            <button
              onClick={() => setLatestStatus(null)}
              className="btn btn-secondary btn-sm"
              style={{ padding: '2px 8px', fontSize: '0.75rem' }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Summary Stats Overview */}
      <EmailStatsCards logs={logs} />

      {/* Active Incidents & Issue Alert Section */}
      <ActiveIncidentsPanel
        vehicles={vehicles}
        isLoading={isLoadingVehicles}
        onSelectIncidentVehicle={(v) => handleOpenIncidentModal(v)}
        onOpenGeneralIncident={() => handleOpenIncidentModal()}
      />

      {/* Quick Test Trigger Panel */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={16} color="var(--accent-cyan)" />
            Nút gửi email test nhanh (Mô phỏng các kịch bản cảnh báo VMS)
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Nhấn vào các nút bên dưới để kiểm thử tính năng gửi cảnh báo tự động của hệ thống
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleSendQuickTest('MAINTENANCE_ALERT')}
            className="btn btn-secondary btn-sm"
            disabled={isSendingTest}
            title="Thử gửi cảnh báo bảo dưỡng định kỳ khi xe đạt mốc 5.000 km"
          >
            <AlertTriangle size={14} color="var(--accent-amber)" />
            <span>Test Cảnh Báo Bảo Dưỡng</span>
          </button>

          <button
            onClick={() => handleSendQuickTest('HIGH_COST_ALERT')}
            className="btn btn-secondary btn-sm"
            disabled={isSendingTest}
            title="Thử gửi cảnh báo chi phí đột biến > 5.000.000 ₫"
          >
            <Mail size={14} color="var(--accent-rose)" />
            <span>Test Chi Phí Đột Biến</span>
          </button>

          <button
            onClick={() => handleSendQuickTest('ASSIGNMENT_NOTIFICATION')}
            className="btn btn-secondary btn-sm"
            disabled={isSendingTest}
            title="Thử gửi thông báo điều chuyển và bàn giao xe cho tài xế"
          >
            <Send size={14} color="var(--accent-blue)" />
            <span>Test Bàn Giao Xe</span>
          </button>

          <button
            onClick={() => handleSendQuickTest('TEST')}
            className="btn btn-secondary btn-sm"
            disabled={isSendingTest}
            title="Gửi email test ping kiểm tra kết nối máy chủ"
          >
            <CheckCircle2 size={14} color="var(--accent-emerald)" />
            <span>Test Ping SMTP</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flex: 1, minWidth: '280px', maxWidth: '500px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px' }}
              placeholder="Tìm theo email người nhận, tiêu đề hoặc nội dung..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Filter size={14} color="var(--text-muted)" />
            <select
              className="form-select"
              style={{ width: 'auto', padding: '0.45rem 0.75rem', fontSize: '0.8125rem' }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">Tất cả loại cảnh báo</option>
              <option value="AUTO_NOTIFICATION">Tự động (Auto)</option>
              <option value="MAINTENANCE_ALERT">Cảnh báo bảo dưỡng</option>
              <option value="HIGH_COST_ALERT">Chi phí đột biến</option>
              <option value="ASSIGNMENT_NOTIFICATION">Bàn giao xe</option>
              <option value="MANUAL">Gửi thủ công</option>
              <option value="TEST">Thử nghiệm (Test)</option>
            </select>
          </div>

          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.45rem 0.75rem', fontSize: '0.8125rem' }}
            value={filterDays}
            onChange={(e) => setFilterDays(Number(e.target.value))}
          >
            <option value={7}>7 ngày qua</option>
            <option value={30}>30 ngày qua</option>
            <option value={90}>90 ngày qua</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      {isLoading ? (
        <TableSkeleton rows={5} columns={5} />
      ) : filteredLogs.length === 0 ? (
        <EmptyState
          icon={<Bell size={32} />}
          title={searchTerm || typeFilter !== 'ALL' ? 'Không tìm thấy email phù hợp bộ lọc' : 'Chưa có nhật ký email nào'}
          description={
            searchTerm || typeFilter !== 'ALL'
              ? 'Thử điều chỉnh từ khóa tìm kiếm hoặc chọn loại cảnh báo khác.'
              : 'Hệ thống sẽ tự động ghi nhận khi các thông báo bảo dưỡng hoặc chi phí phát sinh.'
          }
          actionText="Làm mới danh sách"
          onAction={fetchLogs}
        />
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '160px' }}>Thời gian gửi</th>
                <th>Người nhận</th>
                <th>Phân loại</th>
                <th>Tiêu đề &amp; Nội dung cảnh báo</th>
                <th style={{ textAlign: 'center', width: '150px' }}>Trạng thái</th>
                <th style={{ textAlign: 'right', width: '100px' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedLog(log)}
                >
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
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {log.content}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {getStatusBadge(log.status)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLog(log);
                      }}
                      title="Xem chi tiết nội dung email"
                    >
                      <Eye size={12} /> Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Log Detail Modal */}
      <EmailLogDetailModal
        isOpen={selectedLog !== null}
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
        onResend={handleResendFromLog}
      />

      {/* Vehicle Incident Notification Modal */}
      <VehicleIncidentModal
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
        onSuccess={() => {
          fetchLogs();
          fetchVehicles();
        }}
        vehicles={vehicles}
        initialVehicle={selectedIncidentVehicle}
      />
    </div>
  );
};

export default EmailPage;
