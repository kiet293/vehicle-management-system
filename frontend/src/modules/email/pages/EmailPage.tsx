import React, { useState, useEffect } from 'react';
import { emailService } from '../services/emailService';
import { EmailLog, EmailType } from '../../../types';
import { useToast } from '../../../context/ToastContext';
import { TableSkeleton } from '../../../components/common/Skeleton';
import { EmptyState } from '../../../components/common/EmptyState';
import { EmailLogDetailModal } from '../components/EmailLogDetailModal';
import { EmailStatsCards } from '../components/EmailStatsCards';
import {
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Sparkles,
  Search,
  Filter,
  Eye,
} from 'lucide-react';

export const EmailPage: React.FC = () => {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterDays, setFilterDays] = useState(30);

  // Search & Type Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Modals state
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

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
        return <span className="badge badge-neutral">GỬI THỦ CÔNG</span>;
      case 'TEST':
        return <span className="badge badge-neutral">KIỂM TRA (TEST)</span>;
      case 'AUTO_NOTIFICATION':
      default:
        return <span className="badge badge-info">TỰ ĐỘNG</span>;
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
      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '-0.5rem' }}>
        <button onClick={fetchLogs} className="btn btn-secondary" title="Làm mới danh sách">
          <RotateCcw size={14} /> Làm mới
        </button>
      </div>

      {/* Summary Stats Overview */}
      <EmailStatsCards logs={logs} />

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
                    <div>{log.recipient}</div>
                    {log.sender && (
                      <div style={{ fontSize: '0.6875rem', color: 'var(--accent-amber)', fontWeight: 400, marginTop: '2px' }}>
                        Từ: {log.sender}
                      </div>
                    )}
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
      />
    </div>
  );
};

export default EmailPage;
