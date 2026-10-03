import { BaseEntity } from '../../../types/common';

export interface CostRecord extends BaseEntity {
  vehicleId: number | string;
  category: 'FUEL' | 'MAINTENANCE' | 'INSURANCE' | 'TOLL' | 'OTHER';
  amount: number;
  date: string;
  description?: string;
}

export interface CostFilter {
  vehicleId?: number | string;
  category?: string;
  startDate?: string;
  endDate?: string;
}
