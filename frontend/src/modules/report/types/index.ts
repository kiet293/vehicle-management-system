import { BaseEntity } from '../../../types/common';

export interface ReportSummary extends BaseEntity {
  totalVehicles: number;
  activeVehicles: number;
  totalExpenses: number;
  period: string;
}

export interface MetricCardData {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}
