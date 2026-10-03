import apiClient from '../../../services/api';
import { EmailNotification, EmailSendResult } from '../types';

export const emailService = {
  sendNotification: async (payload: EmailNotification): Promise<EmailSendResult> => {
    const response = await apiClient.post<EmailSendResult>('/api/email/send', payload);
    return response.data;
  },
};

export default emailService;
