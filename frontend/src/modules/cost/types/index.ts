export type CostType = 'FUEL' | 'MAINTENANCE' | 'TOLL' | 'INSURANCE' | 'OTHER';

export interface CostRecord {
  id: number;
  vehicleId: number;
  costType: CostType;
  amount: number;
  costDate: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CostFormData {
  vehicleId: number | '';
  costType: CostType;
  amount: number | '';
  costDate: string;
  description: string;
}

export interface CostFilter {
  vehicleId?: number | '';
  costType?: CostType | '';
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface CostSummary {
  totalAmount: number;
  totalCount: number;
  amountByType: Record<CostType, number>;
  countByType: Record<CostType, number>;
}

export interface VehicleOption {
  id: number;
  licensePlate: string;
  model: string;
}

export const COST_TYPE_LABELS: Record<CostType, { label: string; color: string; bg: string; border: string }> = {
  FUEL: {
    label: 'Nhiên liệu / Xăng dầu',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.3)'
  },
  MAINTENANCE: {
    label: 'Bảo dưỡng / Sửa chữa',
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(59, 130, 246, 0.3)'
  },
  TOLL: {
    label: 'Phí cầu đường (BOT)',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.3)'
  },
  INSURANCE: {
    label: 'Bảo hiểm phương tiện',
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.12)',
    border: 'rgba(139, 92, 246, 0.3)'
  },
  OTHER: {
    label: 'Chi phí khác',
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.12)',
    border: 'rgba(148, 163, 184, 0.3)'
  }
};
