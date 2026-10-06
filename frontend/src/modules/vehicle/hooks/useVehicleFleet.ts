import { useCallback, useEffect, useState } from 'react';
import { vehicleService } from '../services/vehicleService';
import { Vehicle, VehicleStatus } from '../../../types';

const STATUSES_FROM_URL: VehicleStatus[] = ['AVAILABLE', 'IN_USE', 'MAINTENANCE'];

export const useVehicleFleet = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | 'ALL'>('ALL');
  const [brandFilter, setBrandFilter] = useState<string>('ALL');
  const [brands, setBrands] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const st = params.get('status');
    if (st && STATUSES_FROM_URL.includes(st as VehicleStatus)) {
      setStatusFilter(st as VehicleStatus);
    }
  }, []);

  const loadBrands = useCallback(async () => {
    try {
      setBrands(await vehicleService.getBrands());
    } catch {
      // Keep the last known list on failure so the dropdown never goes blank
    }
  }, []);

  useEffect(() => {
    void loadBrands();
  }, [loadBrands]);

  // If the selected brand disappears (e.g. its last vehicle was deleted or
  // renamed), reset the filter so the dropdown never shows a stale value.
  useEffect(() => {
    if (brandFilter !== 'ALL' && !brands.includes(brandFilter)) {
      setBrandFilter('ALL');
    }
  }, [brands, brandFilter]);

  const fetchVehicles = useCallback(async () => {
    setIsLoading(true);
    setErrorBanner(null);
    try {
      const data = await vehicleService.getVehicles(
        statusFilter === 'ALL' ? undefined : statusFilter,
        brandFilter === 'ALL' ? undefined : brandFilter,
        search
      );
      setVehicles(data);
    } catch {
      setErrorBanner('Không thể tải danh sách đội xe. Vui lòng bấm [Thử lại]');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, brandFilter, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVehicles();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchVehicles]);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setBrandFilter('ALL');
  };

  const hasActiveFilter = search !== '' || statusFilter !== 'ALL' || brandFilter !== 'ALL';

  return {
    vehicles,
    isLoading,
    errorBanner,
    fetchVehicles,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    brandFilter,
    setBrandFilter,
    brands,
    loadBrands,
    viewMode,
    setViewMode,
    clearFilters,
    hasActiveFilter,
  };
};

export type VehicleFleet = ReturnType<typeof useVehicleFleet>;

export default useVehicleFleet;