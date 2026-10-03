import apiClient from '../../../services/api';
import { ReportSummary } from '../types';

export const reportService = {
  getSummary: async (): Promise<ReportSummary> => {
    const response = await apiClient.get<ReportSummary>('/api/reports/summary');
    return response.data;
  },
};

export default reportService;
