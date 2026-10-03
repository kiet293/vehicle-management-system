import React from 'react';
import { Car, Layers, Activity } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <header style={{
      borderBottom: '1px solid var(--border-color)',
      backgroundColor: 'rgba(10, 14, 23, 0.85)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0.875rem 2rem'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'var(--gradient-brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Car size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 800, fontSize: '1.125rem', letterSpacing: '-0.02em' }}>
                Vehicle Management System
              </span>
              <span className="badge badge-info">
                Base Skeleton
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Microservices Architecture • Spring Boot 3.x & React
            </p>
          </div>
        </div>

        {/* Navigation / Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            <Layers size={16} color="var(--accent-cyan)" />
            <span>6 Microservices</span>
          </div>
          <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-color)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            <Activity size={16} color="var(--accent-emerald)" />
            <span>Gateway Port: <strong className="mono" style={{ color: 'var(--text-main)' }}>8080</strong></span>
          </div>
        </div>
      </div>
    </header>
  );
};
