import React from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { DashboardPage } from '../modules/report/pages/DashboardPage';

export const AppRoutes: React.FC = () => {
  return (
    <MainLayout>
      <DashboardPage />
    </MainLayout>
  );
};
