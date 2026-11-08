import apiClient from './api';
import { ApiResponse, AppNotification } from '../types';

export const notificationService = {
  /**
   * Lấy danh sách thông báo dành riêng cho người dùng hiện tại
   */
  getNotifications: async (userId?: number, email?: string, role?: string): Promise<AppNotification[]> => {
    try {
      const res = await apiClient.get<ApiResponse<AppNotification[]>>('/api/v1/emails/notifications', {
        params: { userId, email, role },
      });
      return res.data.data || [];
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
      return [];
    }
  },

  /**
   * Đánh dấu 1 thông báo là đã đọc
   */
  markAsRead: async (id: string): Promise<boolean> => {
    try {
      const res = await apiClient.put<ApiResponse<boolean>>(`/api/v1/emails/notifications/${id}/read`);
      return !!res.data.data;
    } catch {
      return false;
    }
  },

  /**
   * Đánh dấu tất cả thông báo của người dùng là đã đọc
   */
  markAllAsRead: async (userId?: number, email?: string, role?: string): Promise<number> => {
    try {
      const res = await apiClient.put<ApiResponse<{ updatedCount: number }>>(
        '/api/v1/emails/notifications/read-all',
        null,
        {
          params: { userId, email, role },
        }
      );
      return res.data.data?.updatedCount || 0;
    } catch {
      return 0;
    }
  },

  /**
   * Gửi sự kiện thông báo mới (Giao xe, Thu hồi xe, Trả xe, Cảnh báo...)
   */
  createNotificationEvent: async (payload: {
    type: string;
    vehiclePlate?: string;
    vehicleId?: number;
    targetUserId?: number;
    targetUserEmail?: string;
    targetRole?: string;
    actorName?: string;
    title?: string;
    message?: string;
    newOdometer?: number;
    notes?: string;
  }): Promise<AppNotification | null> => {
    try {
      const res = await apiClient.post<ApiResponse<AppNotification>>('/api/v1/emails/notifications/event', payload);
      // Phát sự kiện toàn cục để Navbar tự động cập nhật ngay lập tức
      window.dispatchEvent(new CustomEvent('vms-notification-refresh'));
      return res.data.data;
    } catch (err) {
      console.warn('Failed to post notification event:', err);
      return null;
    }
  },
};

export default notificationService;

