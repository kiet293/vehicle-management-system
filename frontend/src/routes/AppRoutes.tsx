import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LoginPage } from '../modules/user/pages/LoginPage';
import { DashboardPage } from '../modules/report/pages/DashboardPage';
import { VehiclePage } from '../modules/vehicle/pages/VehiclePage';
import { CostPage } from '../modules/cost/pages/CostPage';
import { UserPage } from '../modules/user/pages/UserPage';
import { EmailPage } from '../modules/email/pages/EmailPage';
import { NotFoundPage } from '../components/common/NotFoundPage';
import { MainLayout } from '../layouts/MainLayout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Dashboard Overview: Admin and Manager only */}
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
              <MainLayout>
                <DashboardPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Fleet & Vehicles: All roles */}
        <Route
          path="/vehicles"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'DRIVER']}>
              <MainLayout>
                <VehiclePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Expenses & Costs: All roles */}
        <Route
          path="/costs"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'DRIVER']}>
              <MainLayout>
                <CostPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* User Management: Admin and Manager only */}
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
              <MainLayout>
                <UserPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Notifications & Email Logs: Admin and Manager only */}
        <Route
          path="/emails"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
              <MainLayout>
                <EmailPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* 404 Not Found Page */}
        <Route
          path="*"
          element={
            <MainLayout>
              <NotFoundPage />
            </MainLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
