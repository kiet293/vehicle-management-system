import { BaseEntity } from '../../../types/common';

export interface User extends BaseEntity {
  username: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'MANAGER' | 'DRIVER';
  active: boolean;
}

export interface UserFilter {
  role?: string;
  search?: string;
  active?: boolean;
}
