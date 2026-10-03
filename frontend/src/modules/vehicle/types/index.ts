import { BaseEntity } from '../../../types/common';

export interface Vehicle extends BaseEntity {
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  assignedDriverId?: number | string;
}

export interface VehicleFilter {
  status?: string;
  brand?: string;
  search?: string;
}
