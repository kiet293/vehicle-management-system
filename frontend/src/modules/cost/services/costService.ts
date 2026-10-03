import apiClient from '../../../services/api';
import { Cost, CostSummary, ApiResponse, CostType } from '../../../types';

export interface CreateCostData {
  vehicleId: number;
  vehiclePlate: string;
  driverId?: number;
  driverName?: string;
  costType: CostType;
  amount: number;
  odometerAtCost?: number;
  costDate: string;
  description?: string;
  receiptImageUrl?: string;
}

export interface UpdateCostData {
  costType?: CostType;
  amount?: number;
  odometerAtCost?: number;
  costDate?: string;
  description?: string;
  receiptImageUrl?: string;
}

export const costService = {
  getCosts: async (
    vehicleId?: number,
    costType?: CostType,
    fromDate?: string,
    toDate?: string,
    driverId?: number,
    search?: string
  ): Promise<Cost[]> => {
    const res = await apiClient.get<ApiResponse<Cost[]>>('/api/costs', {
      params: { vehicleId, costType, fromDate, toDate, driverId, search },
    });
    return res.data.data || [];
  },

  getCostById: async (id: number): Promise<Cost> => {
    const res = await apiClient.get<ApiResponse<Cost>>(`/api/costs/${id}`);
    return res.data.data;
  },

  createCost: async (data: CreateCostData): Promise<Cost> => {
    const res = await apiClient.post<ApiResponse<Cost>>('/api/costs', data);
    return res.data.data;
  },

  updateCost: async (id: number, data: UpdateCostData): Promise<Cost> => {
    const res = await apiClient.put<ApiResponse<Cost>>(`/api/costs/${id}`, data);
    return res.data.data;
  },

  deleteCost: async (id: number): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/api/costs/${id}`);
  },

  getSummary: async (year?: number, month?: number): Promise<CostSummary> => {
    const res = await apiClient.get<ApiResponse<CostSummary>>('/api/costs/summary', {
      params: { year, month },
    });
    return res.data.data;
  },
};

export default costService;
