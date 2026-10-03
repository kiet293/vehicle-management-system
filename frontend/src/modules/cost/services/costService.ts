import apiClient from '../../../services/api';
import { CostRecord, CostFilter } from '../types';

export const costService = {
  getCosts: async (filter?: CostFilter): Promise<CostRecord[]> => {
    const response = await apiClient.get<CostRecord[]>('/api/costs', { params: filter });
    return response.data;
  },

  getCostById: async (id: number | string): Promise<CostRecord> => {
    const response = await apiClient.get<CostRecord>(`/api/costs/${id}`);
    return response.data;
  },
};

export default costService;
