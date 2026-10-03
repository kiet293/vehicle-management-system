import React from 'react';
import { ServiceMetadata, ServiceHealth } from '../../../types/common';
import { Server, Database, RefreshCw, XCircle, Clock } from 'lucide-react';

interface ServiceCardProps {
  service: ServiceMetadata;
  health?: ServiceHealth;
  onPing: (service: ServiceMetadata) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, health, onPing }) => {
  const isUp = health?.status === 'UP';
  const isDown = health?.status === 'DOWN';
  const isChecking = health?.status === 'CHECKING';

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-blue)'
            }}>
              <Server size={18} />
            </div>
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 700 }}>{service.name}</h3>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
            {service.description}
          </p>
        </div>

        {/* Status Badge */}
        {isChecking ? (
          <span className="badge badge-warning">
            <Clock size={12} /> Checking
          </span>
        ) : isUp ? (
          <span className="badge badge-success">
            <span className="pulse-dot" /> UP ({health?.responseTime}ms)
          </span>
        ) : isDown ? (
          <span className="badge badge-warning" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <XCircle size={12} /> Offline
          </span>
        ) : (
          <span className="badge badge-neutral">
            Ready
          </span>
        )}
      </div>

      {/* Details Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '0.75rem',
        padding: '0.875rem',
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        borderRadius: '10px',
        fontSize: '0.8125rem'
      }}>
        <div>
          <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>PORT</span>
          <span className="mono" style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{service.port}</span>
        </div>
        <div>
          <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>ROUTE</span>
          <span className="mono" style={{ color: 'var(--text-main)' }}>{service.routePrefix}</span>
        </div>
        <div>
          <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>INTERNAL URL</span>
          <span className="mono" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{service.dockerUrl}</span>
        </div>
        <div>
          <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>DATABASE</span>
          <span className="mono" style={{ color: service.database ? 'var(--accent-emerald)' : 'var(--text-dim)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {service.database ? (
              <>
                <Database size={12} /> {service.database}
              </>
            ) : (
              'None (Stateless)'
            )}
          </span>
        </div>
      </div>

      {/* Footer Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '0.5rem',
        borderTop: '1px solid var(--border-color)',
        marginTop: 'auto'
      }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          {health?.lastChecked ? `Checked ${health.lastChecked}` : 'Health: /actuator/health'}
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => onPing(service)}
          disabled={isChecking}
          style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}
        >
          <RefreshCw size={12} className={isChecking ? 'animate-spin' : ''} />
          <span>Ping Health</span>
        </button>
      </div>
    </div>
  );
};

export default ServiceCard;
