import apiClient from '../../../services/api';
import {
  ReportSummary,
  MonthlyTrend,
  CostByType,
  TopVehicle,
  ApiResponse,
} from '../../../types';

export const reportService = {
  getSummary: async (year?: number, month?: number): Promise<ReportSummary> => {
    const res = await apiClient.get<ApiResponse<ReportSummary>>('/api/reports/summary', {
      params: { year, month },
    });
    return res.data.data;
  },

  getMonthlyTrends: async (year?: number): Promise<MonthlyTrend[]> => {
    const res = await apiClient.get<ApiResponse<MonthlyTrend[]>>('/api/reports/monthly-trends', {
      params: { year },
    });
    return res.data.data || [];
  },

  getCostByType: async (year?: number): Promise<CostByType[]> => {
    const res = await apiClient.get<ApiResponse<CostByType[]>>('/api/reports/cost-by-type', {
      params: { year },
    });
    return res.data.data || [];
  },

  getTopVehicles: async (limit = 5, year?: number): Promise<TopVehicle[]> => {
    const res = await apiClient.get<ApiResponse<TopVehicle[]>>('/api/reports/top-vehicles', {
      params: { limit, year },
    });
    return res.data.data || [];
  },
};

export default reportService;
