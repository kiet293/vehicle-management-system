export * from './common';

export type Role = 'ADMIN' | 'MANAGER' | 'DRIVER';
export type UserStatus = 'ACTIVE' | 'LOCKED';

export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  role: Role;
  driverLicenseNumber?: string;
  driverLicenseClass?: string;
  status: UserStatus;
  createdAt?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export type VehicleType = 'SEDAN' | 'SUV' | 'PICKUP' | 'VAN' | 'TRUCK';
export type VehicleStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'DECOMMISSIONED';

export type TripStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface VehicleTrip {
  id: number;
  vehicleId: number;
  vehiclePlate: string;
  driverId?: number;
  driverName?: string;
  startOdometer: number;
  endOdometer?: number;
  distanceKm?: number;
  status: TripStatus;
  startedAt: string;
  endedAt?: string;
  notes?: string;
  durationMinutes?: number;
}

export interface Vehicle {
  id: number;
  licensePlate: string;
  brand: string;
  model: string;
  vehicleType: VehicleType;
  seatCapacity: number;
  manufactureYear: number;
  currentOdometer: number;
  lastMaintenanceOdometer: number;
  status: VehicleStatus;
  assignedDriverId?: number;
  assignedDriverName?: string;
  imageUrl?: string;
  maintenanceDue: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type CostType = 'FUEL' | 'TOLL' | 'MAINTENANCE' | 'INSURANCE' | 'OTHER';

export interface Cost {
  id: number;
  vehicleId: number;
  vehiclePlate: string;
  driverId?: number;
  driverName?: string;
  costType: CostType;
  amount: number;
  odometerAtCost?: number;
  costDate: string;
  description?: string;
  receiptImageUrl?: string;
  createdAt?: string;
}

export interface CostSummary {
  totalAmount: number;
  totalCount: number;
  thisMonthTotal: number;
  lastMonthTotal: number;
  percentChange: number;
  byType: Record<string, number>;
  monthlyTotals: Record<number, number>;
}

export type EmailType = 'MAINTENANCE_ALERT' | 'HIGH_COST_ALERT' | 'ASSIGNMENT_NOTIFICATION' | 'TEST' | 'MANUAL' | 'AUTO_NOTIFICATION';
export type EmailStatus = 'SENT' | 'MOCK_SENT' | 'FAILED';

export interface EmailLog {
  id: string;
  recipient: string;
  subject: string;
  content: string;
  type: EmailType;
  status: EmailStatus;
  errorMessage?: string;
  sentAt: string;
}

export interface ReportSummary {
  totalVehicles: number;
  availableVehicles: number;
  inUseVehicles: number;
  maintenanceVehicles: number;
  currentMonthCost: number;
  previousMonthCost: number;
  costChangePercentage: number;
  currentMonthCount: number;
}

export interface MonthlyTrend {
  month: number;
  monthLabel: string;
  amount: number;
  count: number;
}

export interface CostByType {
  type: string;
  typeLabel: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface TopVehicle {
  rank: number;
  vehicleId: number;
  licensePlate: string;
  brandModel: string;
  driverName: string;
  costCount: number;
  totalCost: number;
}
