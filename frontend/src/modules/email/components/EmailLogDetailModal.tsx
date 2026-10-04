import React from 'react';
import {
  Clock,
  User,
  CheckCircle2,
  Sparkles,
  XCircle,
  Copy,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { EmailLog } from '../types';
import { useToast } from '../../../context/ToastContext';

interface EmailLogDetailModalProps {
  log: EmailLog | null;
  isOpen: boolean;
  onClose: () => void;
  onResend?: (log: EmailLog) => void;
}

export const EmailLogDetailModal: React.FC<EmailLogDetailModalProps> = ({
  log,
  isOpen,
  onClose,
  onResend,
}) => {
  const { showToast } = useToast();

  if (!log) return null;

  const handleCopyContent = () => {
    navigator.clipboard.writeText(log.content);
    showToast('info', 'Đã sao chép nội dung email vào clipboard');
  };

  const getStatusBadge = () => {
    if (log.status === 'SENT') {
      return (
        <span className="badge badge-success">
          <CheckCircle2 size={12} /> ĐÃ GỬI (SMTP GMAIL)
        </span>
      );
    }
    if (log.status === 'MOCK_SENT') {
      return (
        <span className="badge badge-info">
          <Sparkles size={12} /> MÔ PHỎNG GỬI (MOCK_SENT)
        </span>
      );
    }
    return (
      <span className="badge badge-danger">
        <XCircle size={12} /> THẤT BẠI (FAILED)
      </span>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chi Tiết Bản Ghi Email" maxWidth="600px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Status banner */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Trạng thái gửi:</span>
            {getStatusBadge()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} />
            {new Date(log.sentAt).toLocaleString('vi-VN')}
          </div>
        </div>

        {/* Error message if failed */}
        {log.status === 'FAILED' && log.errorMessage && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#fb7185',
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
            }}
          >
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Chi tiết lỗi:</strong> {log.errorMessage}
            </div>
          </div>
        )}

        {/* Metadata fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '2px' }}>
              MÃ BẢN GHI (LOG ID)
            </div>
            <code style={{ fontSize: '0.8125rem', color: 'var(--accent-purple)' }}>{log.id}</code>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '2px' }}>
              NGƯỜI NHẬN (RECIPIENT)
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={14} />
              {log.recipient}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '2px' }}>
              TIÊU ĐỀ THƯ (SUBJECT)
            </div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {log.subject}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>NỘI DUNG THƯ (CONTENT)</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleCopyContent}
                style={{ padding: '2px 8px', fontSize: '0.75rem' }}
              >
                <Copy size={12} /> Sao chép
              </button>
            </div>
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '0.875rem',
                fontSize: '0.8125rem',
                color: 'var(--text-main)',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6,
                maxHeight: '260px',
                overflowY: 'auto',
              }}
            >
              {log.content}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Đóng
          </button>
          {onResend && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                onClose();
                onResend(log);
              }}
            >
              <RotateCcw size={14} />
              <span>Gửi lại hoặc Soạn lại</span>
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default EmailLogDetailModal;
