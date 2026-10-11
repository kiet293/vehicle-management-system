import { EmailLog, EmailType, EmailStatus, ApiResponse } from '../../../types';

export type { EmailLog, EmailType, EmailStatus, ApiResponse };

export interface SendEmailRequest {
  to: string;
  subject: string;
  content: string;
  type?: EmailType;
}

export interface MaintenanceAlertRequest {
  licensePlate: string;
  currentOdometer: number;
  lastMaintenanceOdometer: number;
  recipientEmail?: string;
}

export interface HighCostAlertRequest {
  licensePlate: string;
  costType: string;
  amount: number;
  driverName: string;
  description: string;
  recipientEmail?: string;
}

export interface AssignmentAlertRequest {
  licensePlate: string;
  driverName: string;
  driverEmail?: string;
}

export interface EmailNotification {
  recipient: string;
  subject: string;
  body: string;
  templateId?: string;
  variables?: Record<string, string>;
}

export interface EmailSendResult {
  messageId: string;
  status: 'SENT' | 'MOCK_SENT' | 'FAILED';
  timestamp: string;
  errorMessage?: string;
}
