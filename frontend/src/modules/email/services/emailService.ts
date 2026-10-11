import apiClient from '../../../services/api';
import {
  EmailLog,
  ApiResponse,
  EmailType,
  SendEmailRequest,
  MaintenanceAlertRequest,
  HighCostAlertRequest,
  AssignmentAlertRequest,
} from '../types';

export const emailService = {
  getLogs: async (days = 30, limit?: number): Promise<EmailLog[]> => {
    const res = await apiClient.get<ApiResponse<EmailLog[]>>('/api/v1/emails/logs', {
      params: { days, limit },
    });
    return res.data.data || [];
  },

  sendEmail: async (request: SendEmailRequest): Promise<ApiResponse<EmailLog>> => {
    const res = await apiClient.post<ApiResponse<EmailLog>>('/api/v1/emails/send', {
      to: request.to,
      subject: request.subject,
      content: request.content,
      type: request.type || 'MANUAL',
    });
    return res.data;
  },

  sendMaintenanceAlert: async (payload: MaintenanceAlertRequest): Promise<ApiResponse<EmailLog>> => {
    const res = await apiClient.post<ApiResponse<EmailLog>>('/api/v1/emails/alerts/maintenance', payload);
    return res.data;
  },

  sendHighCostAlert: async (payload: HighCostAlertRequest): Promise<ApiResponse<EmailLog>> => {
    const res = await apiClient.post<ApiResponse<EmailLog>>('/api/v1/emails/alerts/high-cost', payload);
    return res.data;
  },

  sendAssignmentAlert: async (payload: AssignmentAlertRequest): Promise<ApiResponse<EmailLog>> => {
    const res = await apiClient.post<ApiResponse<EmailLog>>('/api/v1/emails/alerts/assignment', payload);
    return res.data;
  },

  sendTestAlert: async (type: EmailType, customRecipient?: string): Promise<ApiResponse<EmailLog>> => {
    if (type === 'MAINTENANCE_ALERT') {
      return emailService.sendMaintenanceAlert({
        licensePlate: '29A-888.88',
        currentOdometer: 20050,
        lastMaintenanceOdometer: 15000,
        recipientEmail: customRecipient,
      });
    } else if (type === 'HIGH_COST_ALERT') {
      return emailService.sendHighCostAlert({
        licensePlate: '30H-123.45',
        costType: 'MAINTENANCE',
        amount: 6500000,
        driverName: 'Nguyễn Văn An',
        description: 'Thay lốp và bảo dưỡng khẩn cấp dọc đường',
        recipientEmail: customRecipient,
      });
    } else if (type === 'ASSIGNMENT_NOTIFICATION') {
      return emailService.sendAssignmentAlert({
        licensePlate: '51K-999.99',
        driverName: 'Phạm Hoàng Bình',
        driverEmail: customRecipient,
      });
    } else {
      return emailService.sendEmail({
        to: customRecipient || '',
        subject: '[TEST] Kiểm tra kết nối Dịch vụ Gửi Email VMS',
        content: `Hệ thống VMS thực hiện gửi email thử nghiệm thành công vào lúc: ${new Date().toLocaleString('vi-VN')}.\nMáy chủ SMTP và hệ thống dự phòng Fault Isolation đang vận hành bình thường.`,
        type: 'TEST',
      });
    }
  },
};

export default emailService;
