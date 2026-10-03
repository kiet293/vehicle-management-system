import apiClient from '../../../services/api';
import { User, ApiResponse, Role, UserStatus } from '../../../types';

export interface CreateUserData {
  username: string;
  password?: string;
  fullName: string;
  email: string;
  phone?: string;
  role: Role;
  driverLicenseNumber?: string;
  driverLicenseClass?: string;
}

export interface UpdateUserData {
  fullName?: string;
  email?: string;
  phone?: string;
  role?: Role;
  driverLicenseNumber?: string;
  driverLicenseClass?: string;
  password?: string;
}

export const userService = {
  getUsers: async (role?: Role, search?: string): Promise<User[]> => {
    const res = await apiClient.get<ApiResponse<User[]>>('/api/users', {
      params: { role, search },
    });
    return res.data.data || [];
  },

  getUserById: async (id: number): Promise<User> => {
    const res = await apiClient.get<ApiResponse<User>>(`/api/users/${id}`);
    return res.data.data;
  },

  createUser: async (data: CreateUserData): Promise<User> => {
    const res = await apiClient.post<ApiResponse<User>>('/api/users', data);
    return res.data.data;
  },

  updateUser: async (id: number, data: UpdateUserData): Promise<User> => {
    const res = await apiClient.put<ApiResponse<User>>(`/api/users/${id}`, data);
    return res.data.data;
  },

  updateStatus: async (id: number, status: UserStatus): Promise<User> => {
    const res = await apiClient.patch<ApiResponse<User>>(`/api/users/${id}/status`, { status });
    return res.data.data;
  },

  deleteUser: async (id: number): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/api/users/${id}`);
  },

  getAvailableDrivers: async (): Promise<User[]> => {
    const res = await apiClient.get<ApiResponse<User[]>>('/api/users/drivers/available');
    return res.data.data || [];
  },
};

export default userService;
