import React from 'react';
import { Navbar } from '../components/common/Navbar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1, maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '2rem' }}>
        {children}
      </main>
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        padding: '1.5rem 2rem',
        backgroundColor: 'rgba(10, 14, 23, 0.9)',
        marginTop: 'auto'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.8125rem',
          color: 'var(--text-dim)'
        }}>
          <div>
            Vehicle Management System • Cloud & Microservices Architecture Coursework
          </div>
          <div>
            Spring Boot 3.3.4 • Java 21 • React 18 • Docker Compose
          </div>
        </div>
      </footer>
    </div>
  );
};
