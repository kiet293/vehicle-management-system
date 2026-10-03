export interface ServiceMetadata {
  id: string;
  name: string;
  port: number;
  dockerUrl: string;
  routePrefix: string;
  description: string;
  database?: string;
  category: 'gateway' | 'business' | 'infra';
}

export type HealthStatusType = 'UP' | 'DOWN' | 'CHECKING' | 'UNKNOWN';

export interface ServiceHealth {
  status: HealthStatusType;
  responseTime?: number;
  lastChecked?: string;
  error?: string;
}

export interface HealthCheckResponse {
  status: string;
  components?: Record<string, { status: string; details?: unknown }>;
}

export interface BaseEntity {
  id: number | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  errorCode?: string;
}
