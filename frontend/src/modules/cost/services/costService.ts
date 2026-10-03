import apiClient from '../../../services/api';
import { CostRecord, CostFilter, CostFormData, CostSummary, VehicleOption, CostType } from '../types';

// Mock initial data used as seamless fallback if backend service is currently offline
let localFallbackRecords: CostRecord[] = [
  {
    id: 1,
    vehicleId: 1,
    costType: 'FUEL',
    amount: 850000,
    costDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    description: 'Đổ đầy bình dầu Diesel cho xe tải 29C-123.45',
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    vehicleId: 1,
    costType: 'TOLL',
    amount: 70000,
    costDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    description: 'Vé qua trạm thu phí cao tốc Pháp Vân - Cầu Giẽ',
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    vehicleId: 2,
    costType: 'MAINTENANCE',
    amount: 2500000,
    costDate: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
    description: 'Thay nhớt máy, lọc gió và kiểm tra hệ thống phanh xe 29A-678.90',
    createdAt: new Date().toISOString()
  },
  {
    id: 4,
    vehicleId: 2,
    costType: 'FUEL',
    amount: 500000,
    costDate: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    description: 'Đổ xăng RON 95 cây xăng Petrolimex số 12',
    createdAt: new Date().toISOString()
  },
  {
    id: 5,
    vehicleId: 3,
    costType: 'INSURANCE',
    amount: 8900000,
    costDate: new Date(Date.now() - 86400000 * 10).toISOString().split('T')[0],
    description: 'Phí bảo hiểm trách nhiệm dân sự và vật chất xe 2 năm',
    createdAt: new Date().toISOString()
  },
  {
    id: 6,
    vehicleId: 1,
    costType: 'FUEL',
    amount: 900000,
    costDate: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
    description: 'Đổ dầu Diesel cho chặng vận chuyển hàng Hải Phòng',
    createdAt: new Date().toISOString()
  }
];

export const DEFAULT_VEHICLES: VehicleOption[] = [
  { id: 1, licensePlate: '29C-123.45', model: 'Xe tải Hyundai Mighty (3.5T)' },
  { id: 2, licensePlate: '29A-678.90', model: 'Xe 7 chỗ Toyota Innova' },
  { id: 3, licensePlate: '30H-999.88', model: 'Xe khách 16 chỗ Ford Transit' },
  { id: 4, licensePlate: '51D-456.78', model: 'Xe tải Isuzu QKR 270 (2.5T)' },
];

export const costService = {
  getCosts: async (filter?: CostFilter): Promise<CostRecord[]> => {
    try {
      const params: Record<string, any> = {};
      if (filter?.vehicleId) params.vehicleId = filter.vehicleId;
      if (filter?.costType) params.costType = filter.costType;
      if (filter?.startDate) params.startDate = filter.startDate;
      if (filter?.endDate) params.endDate = filter.endDate;
      if (filter?.search) params.search = filter.search;

      const response = await apiClient.get<any>('/api/costs', { params });
      // If backend returns ApiResponse envelope
      if (response.data && response.data.data !== undefined) {
        return response.data.data;
      }
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.warn('Backend cost-service not reachable via Gateway, using client-side cache:', error);
      let filtered = [...localFallbackRecords];
      if (filter?.vehicleId) {
        filtered = filtered.filter(c => c.vehicleId === Number(filter.vehicleId));
      }
      if (filter?.costType) {
        filtered = filtered.filter(c => c.costType === filter.costType);
      }
      if (filter?.startDate) {
        filtered = filtered.filter(c => c.costDate >= filter.startDate!);
      }
      if (filter?.endDate) {
        filtered = filtered.filter(c => c.costDate <= filter.endDate!);
      }
      if (filter?.search && filter.search.trim()) {
        const query = filter.search.trim().toLowerCase();
        filtered = filtered.filter(c => (c.description || '').toLowerCase().includes(query));
      }
      return filtered;
    }
  },

  getCostById: async (id: number): Promise<CostRecord> => {
    try {
      const response = await apiClient.get<any>(`/api/costs/${id}`);
      if (response.data && response.data.data !== undefined) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      const found = localFallbackRecords.find(c => c.id === id);
      if (found) return found;
      throw new Error(`Phiếu chi #${id} không tìm thấy`);
    }
  },

  getCostsByVehicleId: async (vehicleId: number): Promise<CostRecord[]> => {
    try {
      const response = await apiClient.get<any>(`/api/costs/vehicle/${vehicleId}`);
      if (response.data && response.data.data !== undefined) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      return localFallbackRecords.filter(c => c.vehicleId === vehicleId);
    }
  },

  createCost: async (formData: CostFormData): Promise<CostRecord> => {
    const payload = {
      vehicleId: Number(formData.vehicleId),
      costType: formData.costType,
      amount: Number(formData.amount),
      costDate: formData.costDate,
      description: formData.description.trim() || undefined
    };

    try {
      const response = await apiClient.post<any>('/api/costs', payload);
      const created = response.data?.data || response.data;
      // Also update local fallback cache
      localFallbackRecords.unshift(created);
      return created;
    } catch (error) {
      console.warn('POST /api/costs failed, saving to local fallback:', error);
      const newRecord: CostRecord = {
        id: Date.now(),
        vehicleId: Number(formData.vehicleId),
        costType: formData.costType,
        amount: Number(formData.amount),
        costDate: formData.costDate,
        description: formData.description.trim() || undefined,
        createdAt: new Date().toISOString()
      };
      localFallbackRecords.unshift(newRecord);
      return newRecord;
    }
  },

  updateCost: async (id: number, formData: CostFormData): Promise<CostRecord> => {
    const payload = {
      vehicleId: Number(formData.vehicleId),
      costType: formData.costType,
      amount: Number(formData.amount),
      costDate: formData.costDate,
      description: formData.description.trim() || undefined
    };

    try {
      const response = await apiClient.put<any>(`/api/costs/${id}`, payload);
      const updated = response.data?.data || response.data;
      const index = localFallbackRecords.findIndex(c => c.id === id);
      if (index !== -1) {
        localFallbackRecords[index] = { ...localFallbackRecords[index], ...updated };
      }
      return updated;
    } catch (error) {
      console.warn(`PUT /api/costs/${id} failed, updating local fallback:`, error);
      const index = localFallbackRecords.findIndex(c => c.id === id);
      if (index !== -1) {
        localFallbackRecords[index] = {
          ...localFallbackRecords[index],
          vehicleId: Number(formData.vehicleId),
          costType: formData.costType,
          amount: Number(formData.amount),
          costDate: formData.costDate,
          description: formData.description.trim() || undefined,
          updatedAt: new Date().toISOString()
        };
        return localFallbackRecords[index];
      }
      throw new Error(`Phiếu chi #${id} không tìm thấy`);
    }
  },

  deleteCost: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`/api/costs/${id}`);
    } catch (error) {
      console.warn(`DELETE /api/costs/${id} failed, deleting from local fallback:`, error);
    }
    localFallbackRecords = localFallbackRecords.filter(c => c.id !== id);
  },

  getCostSummary: async (filter?: { vehicleId?: number; startDate?: string; endDate?: string }): Promise<CostSummary> => {
    try {
      const response = await apiClient.get<any>('/api/costs/summary', { params: filter });
      if (response.data && response.data.data !== undefined) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      // Calculate from local records
      const records = await costService.getCosts(filter as CostFilter);
      let totalAmount = 0;
      const amountByType: Record<CostType, number> = {
        FUEL: 0,
        MAINTENANCE: 0,
        TOLL: 0,
        INSURANCE: 0,
        OTHER: 0
      };
      const countByType: Record<CostType, number> = {
        FUEL: 0,
        MAINTENANCE: 0,
        TOLL: 0,
        INSURANCE: 0,
        OTHER: 0
      };

      for (const item of records) {
        totalAmount += item.amount;
        if (amountByType[item.costType] !== undefined) {
          amountByType[item.costType] += item.amount;
          countByType[item.costType] += 1;
        }
      }

      return {
        totalAmount,
        totalCount: records.length,
        amountByType,
        countByType
      };
    }
  },

  getVehicles: async (): Promise<VehicleOption[]> => {
    try {
      const response = await apiClient.get<any>('/api/vehicles');
      const data = response.data?.data || response.data;
      if (Array.isArray(data) && data.length > 0) {
        return data.map((v: any) => ({
          id: v.id,
          licensePlate: v.licensePlate || v.license_plate,
          model: `${v.brand || ''} ${v.model || ''} (${v.type || 'Xe'})`.trim()
        }));
      }
    } catch (e) {
      // Vehicle service not yet available
    }
    return DEFAULT_VEHICLES;
  }
};

export default costService;
