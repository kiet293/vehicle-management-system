import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, LoginResponse, ApiResponse } from '../types';
import apiClient from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isDriver: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('vms_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('vms_auth_token');
  });

  // Keep state synced with localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('vms_auth_token', token);
    } else {
      localStorage.removeItem('vms_auth_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('vms_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('vms_user');
    }
  }, [user]);

  const login = useCallback(async (username: string, password: string): Promise<User> => {
    const res = await apiClient.post<ApiResponse<LoginResponse>>('/api/auth/login', { username, password });
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Đăng nhập không thành công');
    }

    const { token: receivedToken, user: receivedUser } = res.data.data;
    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('vms_auth_token');
    localStorage.removeItem('vms_user');
    window.location.href = '/login';
  }, []);

  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER';
  const isDriver = user?.role === 'DRIVER';
  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      isAuthenticated,
      isAdmin,
      isManager,
      isDriver
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
