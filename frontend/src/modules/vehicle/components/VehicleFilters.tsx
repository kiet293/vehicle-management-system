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
      padding: '1rem 1.25rem',
      display: 'flex',
      gap: '1rem',
      alignItems: 'center',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    }}
  >
    <div style={{ position: 'relative', minWidth: '280px', flex: 1 }}>
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
        placeholder="Tìm theo biển số (vd: 29A), hãng xe, tài xế..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="form-input"
        style={{ paddingLeft: '2.5rem' }}
      />
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          Hãng xe:
        </span>
        <select
          value={brandFilter}
          onChange={(e) => onBrandChange(e.target.value)}
          className="form-select"
          style={{ width: 'auto', minWidth: '150px' }}
        >
          <option value="ALL">Tất cả hãng</option>
          {brands.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          Trạng thái:
        </span>
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as VehicleStatus | 'ALL')}
          className="form-select"
          style={{ width: 'auto', minWidth: '150px' }}
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="AVAILABLE">Sẵn sàng (AVAILABLE)</option>
          <option value="IN_USE">Đang chạy (IN_USE)</option>
          <option value="MAINTENANCE">Bảo dưỡng (MAINTENANCE)</option>
          <option value="DECOMMISSIONED">Ngừng khai thác</option>
        </select>
      </div>

      <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', padding: '2px' }}>
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