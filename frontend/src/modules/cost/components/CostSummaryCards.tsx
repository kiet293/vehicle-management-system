import React from 'react';
import { CostSummary } from '../types';
import { DollarSign, Fuel, Wrench, Navigation, ShieldCheck } from 'lucide-react';

interface CostSummaryCardsProps {
  summary: CostSummary | null;
  loading?: boolean;
}

export const formatVND = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(amount || 0);
};

export const CostSummaryCards: React.FC<CostSummaryCardsProps> = ({ summary, loading }) => {
  const cards = [
    {
      title: 'Tổng chi phí phát sinh',
      amount: summary?.totalAmount || 0,
      count: summary?.totalCount || 0,
      icon: <DollarSign size={20} color="#f59e0b" />,
      borderColor: 'var(--accent-amber)',
      bgGlow: 'rgba(245, 158, 11, 0.08)'
    },
    {
      title: 'Nhiên liệu / Xăng dầu',
      amount: summary?.amountByType?.FUEL || 0,
      count: summary?.countByType?.FUEL || 0,
      icon: <Fuel size={20} color="#f59e0b" />,
      borderColor: '#f59e0b',
      bgGlow: 'rgba(245, 158, 11, 0.05)'
    },
    {
      title: 'Bảo dưỡng / Sửa chữa',
      amount: summary?.amountByType?.MAINTENANCE || 0,
      count: summary?.countByType?.MAINTENANCE || 0,
      icon: <Wrench size={20} color="#3b82f6" />,
      borderColor: '#3b82f6',
      bgGlow: 'rgba(59, 130, 246, 0.05)'
    },
    {
      title: 'Phí cầu đường (BOT)',
      amount: summary?.amountByType?.TOLL || 0,
      count: summary?.countByType?.TOLL || 0,
      icon: <Navigation size={20} color="#10b981" />,
      borderColor: '#10b981',
      bgGlow: 'rgba(16, 185, 129, 0.05)'
    },
    {
      title: 'Bảo hiểm phương tiện',
      amount: summary?.amountByType?.INSURANCE || 0,
      count: summary?.countByType?.INSURANCE || 0,
      icon: <ShieldCheck size={20} color="#8b5cf6" />,
      borderColor: '#8b5cf6',
      bgGlow: 'rgba(139, 92, 246, 0.05)'
    }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '1rem',
      marginBottom: '1.5rem'
    }}>
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="glass-panel"
          style={{
            padding: '1.25rem',
            borderLeft: `4px solid ${card.borderColor}`,
            backgroundColor: card.bgGlow,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              {card.title}
            </span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {card.icon}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
              {loading ? '...' : formatVND(card.amount)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
              {card.count} phiếu ghi nhận
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
