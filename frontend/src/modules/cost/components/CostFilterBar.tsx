import React from 'react';
import { CostFilter, CostType, VehicleOption, COST_TYPE_LABELS } from '../types';
import { Search, Filter, RotateCcw, Calendar, Car } from 'lucide-react';

interface CostFilterBarProps {
  filter: CostFilter;
  vehicles: VehicleOption[];
  onChange: (newFilter: CostFilter) => void;
  onReset: () => void;
}

export const CostFilterBar: React.FC<CostFilterBarProps> = ({
  filter,
  vehicles,
  onChange,
  onReset
}) => {
  const costTypes: (CostType | '')[] = ['', 'FUEL', 'MAINTENANCE', 'TOLL', 'INSURANCE', 'OTHER'];

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9375rem' }}>
          <Filter size={18} color="var(--accent-cyan)" />
          <span>Bộ Lọc & Tìm Kiếm Chi Phí</span>
        </div>

        <button
          className="btn btn-secondary"
          onClick={onReset}
          style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}
          title="Xóa bộ lọc về mặc định"
        >
          <RotateCcw size={14} />
          <span>Đặt lại</span>
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '0.875rem',
        alignItems: 'flex-end'
      }}>
        {/* Search */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
            Tìm kiếm theo nội dung / hóa đơn
          </label>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="VD: Petrolimex, thay nhớt..."
              value={filter.search || ''}
              onChange={(e) => onChange({ ...filter, search: e.target.value })}
              style={{
                width: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                color: 'var(--text-main)',
                fontSize: '0.875rem'
              }}
            />
          </div>
        </div>

        {/* Vehicle filter */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
            Phương tiện
          </label>
          <div style={{ position: 'relative' }}>
            <Car size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <select
              value={filter.vehicleId || ''}
              onChange={(e) => onChange({ ...filter, vehicleId: e.target.value ? Number(e.target.value) : '' })}
              style={{
                width: '100%',
                backgroundColor: '#111827',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                color: 'var(--text-main)',
                fontSize: '0.875rem'
              }}
            >
              <option value="">Tất cả xe trong đội</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.licensePlate} - {v.model}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cost Type filter */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
            Loại chi phí
          </label>
          <select
            value={filter.costType || ''}
            onChange={(e) => onChange({ ...filter, costType: (e.target.value as CostType) || '' })}
            style={{
              width: '100%',
              backgroundColor: '#111827',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '0.5rem 0.75rem',
              color: 'var(--text-main)',
              fontSize: '0.875rem'
            }}
          >
            <option value="">Tất cả các loại</option>
            {costTypes.filter(Boolean).map((type) => (
              <option key={type} value={type}>
                {COST_TYPE_LABELS[type as CostType]?.label}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
            Từ ngày
          </label>
          <div style={{ position: 'relative' }}>
            <Calendar size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="date"
              value={filter.startDate || ''}
              onChange={(e) => onChange({ ...filter, startDate: e.target.value })}
              style={{
                width: '100%',
                backgroundColor: '#111827',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                color: 'var(--text-main)',
                fontSize: '0.875rem'
              }}
            />
          </div>
        </div>

        {/* End Date */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
            Đến ngày
          </label>
          <div style={{ position: 'relative' }}>
            <Calendar size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="date"
              value={filter.endDate || ''}
              onChange={(e) => onChange({ ...filter, endDate: e.target.value })}
              style={{
                width: '100%',
                backgroundColor: '#111827',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                color: 'var(--text-main)',
                fontSize: '0.875rem'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
