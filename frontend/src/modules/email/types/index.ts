export interface EmailNotification {
  recipient: string;
  subject: string;
  body: string;
  templateId?: string;
  variables?: Record<string, string>;
}

export interface EmailSendResult {
  messageId: string;
  status: 'SENT' | 'QUEUED' | 'FAILED';
  timestamp: string;
}
