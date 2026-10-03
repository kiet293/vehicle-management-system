import apiClient from '../../../services/api';
import { EmailLog, ApiResponse, EmailType } from '../../../types';

export const emailService = {
  getLogs: async (days = 30, limit?: number): Promise<EmailLog[]> => {
    const res = await apiClient.get<ApiResponse<EmailLog[]>>('/api/email/logs', {
      params: { days, limit },
    });
    return res.data.data || [];
  },

  sendEmail: async (to: string, subject: string, content: string, type: EmailType = 'TEST'): Promise<EmailLog> => {
    const res = await apiClient.post<ApiResponse<EmailLog>>('/api/email/send', {
      to,
      subject,
      content,
      type,
    });
    return res.data.data;
  },

  sendTestAlert: async (type: EmailType): Promise<EmailLog> => {
    if (type === 'MAINTENANCE_ALERT') {
      const res = await apiClient.post<ApiResponse<EmailLog>>('/api/email/alerts/maintenance', {
        licensePlate: '29A-888.88',
        currentOdometer: 20050,
        lastMaintenanceOdometer: 15000,
        recipientEmail: 'manager@vms.com',
      });
      return res.data.data;
    } else if (type === 'HIGH_COST_ALERT') {
      const res = await apiClient.post<ApiResponse<EmailLog>>('/api/email/alerts/high-cost', {
        licensePlate: '30H-123.45',
        costType: 'MAINTENANCE',
        amount: 6500000,
        driverName: 'Nguyễn Văn An',
        description: 'Thay lốp và bảo dưỡng khẩn cấp dọc đường',
        recipientEmail: 'manager@vms.com',
      });
      return res.data.data;
    } else {
      const res = await apiClient.post<ApiResponse<EmailLog>>('/api/email/alerts/assignment', {
        licensePlate: '51K-999.99',
        driverName: 'Phạm Hoàng Bình',
        driverEmail: 'driver.binh@vms.com',
      });
      return res.data.data;
    }
  },
};

export default emailService;
