import apiClient from '../../../services/api';
import { User, UserFilter } from '../types';

export const userService = {
  getUsers: async (filter?: UserFilter): Promise<User[]> => {
    const response = await apiClient.get<User[]>('/api/users', { params: filter });
    return response.data;
  },

  getUserById: async (id: number | string): Promise<User> => {
    const response = await apiClient.get<User>(`/api/users/${id}`);
    return response.data;
  },
};

export default userService;
