import React from 'react';
import { LayoutGrid, List, Search } from 'lucide-react';
import { VehicleStatus } from '../../../types';

interface VehicleFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: VehicleStatus | 'ALL';
  onStatusChange: (value: VehicleStatus | 'ALL') => void;
  brandFilter: string;
  onBrandChange: (value: string) => void;
  brands: string[];
  viewMode: 'GRID' | 'TABLE';
  onViewModeChange: (value: 'GRID' | 'TABLE') => void;
}

export const VehicleFilters: React.FC<VehicleFiltersProps> = ({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  brandFilter,
  onBrandChange,
  brands,
  viewMode,
  onViewModeChange,
}) => (
  <div
    className="glass-panel"
    style={{
      padding: '1rem',
      display: 'flex',
      gap: '0.875rem',
      alignItems: 'center',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    }}
  >
    <div style={{ position: 'relative', minWidth: 'min(100%, 240px)', flex: '1 1 240px' }}>
      <Search
        size={18}
        style={{
          position: 'absolute',
          left: '0.875rem',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--text-dim)',
        }}
      />
      <input
        type="text"
        placeholder="Tìm biển số, hãng, tài xế..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="form-input"
        style={{ paddingLeft: '2.5rem', width: '100%' }}
      />
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flex: '1 1 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flex: '1 1 140px' }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
          Hãng:
        </span>
        <select
          value={brandFilter}
          onChange={(e) => onBrandChange(e.target.value)}
          className="form-select"
          style={{ width: '100%', minWidth: '110px' }}
        >
          <option value="ALL">Tất cả hãng</option>
          {brands.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flex: '1 1 150px' }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
          Trạng thái:
        </span>
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as VehicleStatus | 'ALL')}
          className="form-select"
          style={{ width: '100%', minWidth: '120px' }}
        >
          <option value="ALL">Tất cả</option>
          <option value="AVAILABLE">Sẵn sàng</option>
          <option value="IN_USE">Đang chạy</option>
          <option value="MAINTENANCE">Bảo dưỡng</option>
          <option value="DECOMMISSIONED">Ngừng chạy</option>
        </select>
      </div>

      <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', padding: '2px', marginLeft: 'auto' }}>
        <button
          onClick={() => onViewModeChange('GRID')}
          className={`btn btn-sm ${viewMode === 'GRID' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '8px', border: 'none' }}
          title="Dạng thẻ lưới"
        >
          <LayoutGrid size={16} />
        </button>
        <button
          onClick={() => onViewModeChange('TABLE')}
          className={`btn btn-sm ${viewMode === 'TABLE' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '8px', border: 'none' }}
          title="Dạng bảng dữ liệu"
        >
          <List size={16} />
        </button>
      </div>
    </div>
  </div>
);

export default VehicleFilters;