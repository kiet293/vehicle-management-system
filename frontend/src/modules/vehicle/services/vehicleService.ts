import apiClient from '../../../services/api';
import { Vehicle, VehicleFilter } from '../types';

export const vehicleService = {
  getVehicles: async (filter?: VehicleFilter): Promise<Vehicle[]> => {
    const response = await apiClient.get<Vehicle[]>('/api/vehicles', { params: filter });
    return response.data;
  },

  getVehicleById: async (id: number | string): Promise<Vehicle> => {
    const response = await apiClient.get<Vehicle>(`/api/vehicles/${id}`);
    return response.data;
  },
};

export default vehicleService;
