import React from 'react';
import { Compass, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div
        className="glass-panel"
        style={{
          maxWidth: '520px',
          width: '100%',
          padding: '3rem 2rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '24px',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-rose)',
          }}
        >
          <Compass size={40} />
        </div>

        <div className="mono" style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--accent-rose)', lineHeight: 1 }}>
          404
        </div>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
          Rất tiếc! Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
        </h2>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.5, margin: 0 }}>
          Lộ trình bạn yêu cầu không nằm trong hệ thống định tuyến của VMS. Hãy kiểm tra lại đường dẫn hoặc quay về màn hình làm việc chính.
        </p>

        <a href="/" className="btn btn-primary" style={{ marginTop: '0.5rem', textDecoration: 'none' }}>
          <Home size={18} />
          <span>Quay về Trang chủ</span>
        </a>
      </div>
    </div>
  );
};

export default NotFoundPage;
