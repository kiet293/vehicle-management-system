import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  Sparkles,
  CheckCircle2,
  XCircle,
  FileText,
  User,
  Info,
} from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { emailService } from '../services/emailService';
import { EmailType, EmailLog } from '../types';
import { useToast } from '../../../context/ToastContext';

interface EmailComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialRecipient?: string;
  initialSubject?: string;
  initialContent?: string;
  initialType?: EmailType;
}

const PRESET_RECIPIENTS = [
  { label: 'Ban Quản Lý', email: 'manager@vms.com' },
  { label: 'Tài xế An', email: 'driver.an@vms.com' },
  { label: 'Phòng Kế Toán', email: 'ketoan@vms.com' },
  { label: 'Gara Kỹ Thuật', email: 'gara.auto@vms.com' },
];

const TEMPLATES: Record<string, { label: string; subject: string; content: string; type: EmailType }> = {
  maintenance: {
    label: 'Cảnh báo Bảo dưỡng',
    subject: '[VMS CẢNH BÁO] Xe 29A-888.88 đã đến hạn bảo dưỡng định kỳ',
    content: `Kính gửi Ban Quản lý và Lái xe phụ trách,\n\nPhương tiện biển số 29A-888.88 đã đạt 20.050 km, vượt ngưỡng định mức 5.000 km kể từ lần bảo dưỡng gần nhất (15.000 km).\n\nKhuyến nghị thực hiện:\n1. Thay dầu nhớt và lọc nhớt động cơ\n2. Kiểm tra má phanh và dầu phanh\n3. Kiểm tra hệ thống treo và áp suất lốp\n\nVui lòng đưa xe vào xưởng dịch vụ trước ngày 10/10/2026.\n\nTrân trọng,\nHệ thống VMS`,
    type: 'MAINTENANCE_ALERT',
  },
  highCost: {
    label: 'Cảnh báo Chi phí lớn',
    subject: '[VMS CẢNH BÁO] Phát sinh phiếu chi lớn cho xe 30H-123.45',
    content: `Kính gửi Quản lý Đội xe,\n\nHệ thống vừa ghi nhận một khoản chi phí vượt ngưỡng định mức cảnh báo (> 5.000.000 ₫):\n- Biển số xe: 30H-123.45\n- Loại chi phí: Sửa chữa & Thay thế phụ tùng\n- Số tiền: 6.500.000 ₫\n- Người thực hiện: Nguyễn Văn An\n\nVui lòng kiểm tra hóa đơn chứng từ và duyệt phê duyệt trên hệ thống.\n\nTrân trọng,\nPhòng Kế toán VMS`,
    type: 'HIGH_COST_ALERT',
  },
  assignment: {
    label: 'Bàn giao Phương tiện',
    subject: '[VMS] Thông báo bàn giao phương tiện: 51K-999.99',
    content: `Chào anh/chị,\n\nBạn đã được phê duyệt bàn giao quản lý phương tiện biển kiểm soát 51K-999.99 (Toyota Camry 2.5Q).\nVui lòng kiểm tra hiện trạng xe, sổ kiểm định và mức nhiên liệu trước khi ký nhận.\n\nChúc anh/chị có những hành trình thuận lợi và an toàn!\n\nTrân trọng,\nĐội xe VMS`,
    type: 'ASSIGNMENT_NOTIFICATION',
  },
  testPing: {
    label: 'Kiểm tra Hệ thống (Test)',
    subject: '[TEST] Kiểm tra kết nối dịch vụ Email Service VMS',
    content: `Đây là email thử nghiệm kết nối hệ thống VMS.\nNếu bạn nhận được email này, cấu hình SMTP và mạng phân phối thông báo đang hoạt động ổn định.\nThời gian gửi: ${new Date().toLocaleString('vi-VN')}`,
    type: 'TEST',
  },
};

export const EmailComposerModal: React.FC<EmailComposerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialRecipient = '',
  initialSubject = '',
  initialContent = '',
  initialType = 'MANUAL',
}) => {
  const { showToast } = useToast();

  const [to, setTo] = useState(initialRecipient);
  const [subject, setSubject] = useState(initialSubject);
  const [content, setContent] = useState(initialContent);
  const [type, setType] = useState<EmailType>(initialType);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<{
    status: 'SUCCESS' | 'FAILED';
    message: string;
    log?: EmailLog;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTo(initialRecipient);
      setSubject(initialSubject);
      setContent(initialContent);
      setType(initialType);
      setLastResult(null);
    }
  }, [isOpen, initialRecipient, initialSubject, initialContent, initialType]);

  const applyTemplate = (templateKey: string) => {
    const tmpl = TEMPLATES[templateKey];
    if (tmpl) {
      setSubject(tmpl.subject);
      setContent(tmpl.content);
      setType(tmpl.type);
      setLastResult(null);
    }
  };

  const validate = (): string | null => {
    if (!to.trim()) return 'Vui lòng nhập địa chỉ email người nhận.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim())) {
      return 'Địa chỉ email không đúng định dạng hợp lệ.';
    }
    if (!subject.trim()) return 'Vui lòng nhập tiêu đề email.';
    if (!content.trim()) return 'Vui lòng nhập nội dung email.';
    return null;
  };

  const handleSend = async (isTestMode = false) => {
    const error = validate();
    if (error) {
      showToast('error', error);
      return;
    }

    setIsSubmitting(true);
    setLastResult(null);

    try {
      const emailTypeToSend = isTestMode ? 'TEST' : type;
      const res = await emailService.sendEmail({
        to: to.trim(),
        subject: subject.trim(),
        content: content.trim(),
        type: emailTypeToSend,
      });

      if (res.success && res.data) {
        const isSmtpSuccess = res.data.status === 'SENT';
        const msg = isSmtpSuccess
          ? `Gửi email thành công qua máy chủ SMTP Gmail tới: ${res.data.recipient}`
          : `Gửi email thành công ở chế độ Giả lập (Mock Sent) tới: ${res.data.recipient}`;

        setLastResult({
          status: 'SUCCESS',
          message: msg,
          log: res.data,
        });

        showToast('success', msg);
        onSuccess();
      } else {
        const failMsg = res.message || 'Gửi email không thành công do máy chủ từ chối kết nối.';
        setLastResult({
          status: 'FAILED',
          message: failMsg,
          log: res.data,
        });
        showToast('error', failMsg);
      }
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Lỗi hệ thống khi gửi email. Vui lòng kiểm tra lại dịch vụ.';
      setLastResult({
        status: 'FAILED',
        message: errorMessage,
      });
      showToast('error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Soạn & Gửi Email Cảnh Báo" maxWidth="640px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Status result card (Thành công / Thất bại) */}
        {lastResult && (
          <div
            className="glass-panel"
            style={{
              padding: '1rem 1.25rem',
              borderRadius: '12px',
              border: `1px solid ${
                lastResult.status === 'SUCCESS' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)'
              }`,
              background:
                lastResult.status === 'SUCCESS'
                  ? 'rgba(16, 185, 129, 0.08)'
                  : 'rgba(244, 63, 94, 0.08)',
              display: 'flex',
              gap: '0.875rem',
              alignItems: 'flex-start',
            }}
          >
            {lastResult.status === 'SUCCESS' ? (
              <CheckCircle2 size={24} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
            ) : (
              <XCircle size={24} color="var(--accent-rose)" style={{ flexShrink: 0, marginTop: '2px' }} />
            )}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: lastResult.status === 'SUCCESS' ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                  marginBottom: '2px',
                }}
              >
                {lastResult.status === 'SUCCESS' ? 'TRẠNG THÁI: GỬI THÀNH CÔNG' : 'TRẠNG THÁI: GỬI THẤT BẠI'}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                {lastResult.message}
              </div>
              {lastResult.log && (
                <div
                  style={{
                    marginTop: '6px',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <span>Mã ID: <code>{lastResult.log.id.slice(0, 8)}...</code></span>
                  <span>Trạng thái: <strong>{lastResult.log.status}</strong></span>
                  <span>Thời gian: {new Date(lastResult.log.sentAt).toLocaleTimeString('vi-VN')}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Templates quick selector */}
        <div>
          <label className="form-label" style={{ marginBottom: '6px' }}>
            <FileText size={14} /> Mẫu nội dung gợi ý nhanh:
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {Object.entries(TEMPLATES).map(([key, t]) => (
              <button
                key={key}
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => applyTemplate(key)}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem' }}
              >
                <Sparkles size={12} color="var(--accent-cyan)" /> {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recipient Input & Suggestions */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">
            <User size={14} /> Người nhận (To) <span style={{ color: 'var(--accent-rose)' }}>*</span>
          </label>
          <input
            type="email"
            className="form-input"
            placeholder="vd: manager@vms.com hoặc driver.an@vms.com"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setLastResult(null);
            }}
          />
          <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.375rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', alignSelf: 'center' }}>Gợi ý:</span>
            {PRESET_RECIPIENTS.map((p) => (
              <button
                key={p.email}
                type="button"
                className="badge badge-neutral"
                style={{ cursor: 'pointer', border: 'none' }}
                onClick={() => setTo(p.email)}
              >
                {p.label} ({p.email})
              </button>
            ))}
          </div>
        </div>

        {/* Email Type */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">
            <Info size={14} /> Loại email & phân loại cảnh báo
          </label>
          <select
            className="form-select"
            value={type}
            onChange={(e) => setType(e.target.value as EmailType)}
          >
            <option value="MANUAL">Gửi thủ công (Thông báo thông thường)</option>
            <option value="MAINTENANCE_ALERT">Cảnh báo bảo dưỡng định kỳ</option>
            <option value="HIGH_COST_ALERT">Cảnh báo phát sinh chi phí lớn</option>
            <option value="ASSIGNMENT_NOTIFICATION">Thông báo điều phối bàn giao xe</option>
            <option value="TEST">Thử nghiệm hệ thống (Test)</option>
          </select>
        </div>

        {/* Subject Input */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">
            <Mail size={14} /> Tiêu đề email (Subject) <span style={{ color: 'var(--accent-rose)' }}>*</span>
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="vd: [VMS CẢNH BÁO] Xe 29A-888.88 cần bảo dưỡng khẩn cấp"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setLastResult(null);
            }}
          />
        </div>

        {/* Content Textarea */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">
            <FileText size={14} /> Nội dung thông báo (Content) <span style={{ color: 'var(--accent-rose)' }}>*</span>
          </label>
          <textarea
            className="form-textarea"
            rows={6}
            placeholder="Nhập nội dung chi tiết hoặc sử dụng các mẫu soạn sẵn ở trên..."
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setLastResult(null);
            }}
            style={{ fontFamily: 'var(--font-sans)', resize: 'vertical' }}
          />
        </div>

        {/* Buttons / Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-color)',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          {/* Quick test button */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleSend(true)}
            disabled={isSubmitting}
            title="Gửi email ở chế độ thử nghiệm"
          >
            <Sparkles size={14} color="var(--accent-amber)" />
            <span>Nút Gửi Test Nhanh</span>
          </button>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Đóng
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleSend(false)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span>Đang gửi...</span>
              ) : (
                <>
                  <Send size={16} />
                  <span>Gửi Email Ngay</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EmailComposerModal;
