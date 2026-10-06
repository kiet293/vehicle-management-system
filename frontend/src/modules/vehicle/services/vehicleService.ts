import apiClient from '../../../services/api';
import { Vehicle, ApiResponse, VehicleStatus, VehicleTrip, VehicleType } from '../../../types';

export interface CreateVehicleData {
  licensePlate: string;
  brand: string;
  model: string;
  vehicleType: VehicleType;
  seatCapacity: number;
  manufactureYear: number;
  initialOdometer?: number;
  imageUrl?: string;
}

export interface UpdateVehicleData {
  brand?: string;
  model?: string;
  vehicleType?: VehicleType;
  seatCapacity?: number;
  manufactureYear?: number;
  currentOdometer?: number;
  lastMaintenanceOdometer?: number;
  imageUrl?: string;
}

export const vehicleService = {
  getVehicles: async (status?: VehicleStatus, brand?: string, search?: string): Promise<Vehicle[]> => {
    const res = await apiClient.get<ApiResponse<Vehicle[]>>('/api/vehicles', {
      params: { status, brand, search },
    });
    return res.data.data || [];
  },

  getBrands: async (): Promise<string[]> => {
    const res = await apiClient.get<ApiResponse<string[]>>('/api/vehicles/brands');
    return res.data.data || [];
  },

  getVehicleById: async (id: number): Promise<Vehicle> => {
    const res = await apiClient.get<ApiResponse<Vehicle>>(`/api/vehicles/${id}`);
    return res.data.data;
  },

  createVehicle: async (data: CreateVehicleData): Promise<Vehicle> => {
    const res = await apiClient.post<ApiResponse<Vehicle>>('/api/vehicles', data);
    return res.data.data;
  },

  updateVehicle: async (id: number, data: UpdateVehicleData): Promise<Vehicle> => {
    const res = await apiClient.put<ApiResponse<Vehicle>>(`/api/vehicles/${id}`, data);
    return res.data.data;
  },

  deleteVehicle: async (id: number): Promise<Vehicle> => {
    const res = await apiClient.delete<ApiResponse<Vehicle>>(`/api/vehicles/${id}`);
    return res.data.data;
  },

  assignDriver: async (id: number, driverId: number, driverName: string, driverEmail?: string): Promise<Vehicle> => {
    const res = await apiClient.post<ApiResponse<Vehicle>>(`/api/vehicles/${id}/assign`, {
      driverId,
      driverName,
      driverEmail,
    });
    return res.data.data;
  },

  returnVehicle: async (id: number, newOdometer: number, notes?: string): Promise<Vehicle> => {
    const res = await apiClient.post<ApiResponse<Vehicle>>(`/api/vehicles/${id}/return`, {
      newOdometer,
      notes,
    });
    return res.data.data;
  },

  updateStatus: async (id: number, status: VehicleStatus): Promise<Vehicle> => {
    const res = await apiClient.put<ApiResponse<Vehicle>>(`/api/vehicles/${id}/status`, { status });
    return res.data.data;
  },

  getTrips: async (vehicleId: number): Promise<VehicleTrip[]> => {
    const res = await apiClient.get<ApiResponse<VehicleTrip[]>>(`/api/vehicles/${vehicleId}/trips`);
    return res.data.data || [];
  },

  getCurrentTrip: async (vehicleId: number): Promise<VehicleTrip> => {
    const res = await apiClient.get<ApiResponse<VehicleTrip>>(`/api/vehicles/${vehicleId}/trips/current`);
    return res.data.data;
  },
};

export default vehicleService;
