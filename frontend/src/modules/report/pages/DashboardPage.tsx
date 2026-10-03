import React, { useMemo } from 'react';
import { ServiceMetadata } from '../../../types/common';
import { ServiceCard } from '../components/ServiceCard';
import { useHealthCheck } from '../../../hooks/useHealthCheck';
import { 
  Network, 
  Database, 
  Terminal, 
  CheckCircle, 
  Radio, 
  ExternalLink, 
  HardDrive,
  RefreshCw
} from 'lucide-react';

const SERVICES: ServiceMetadata[] = [
  {
    id: 'gateway',
    name: 'API Gateway',
    port: 8080,
    dockerUrl: 'http://api-gateway:8080',
    routePrefix: '/api/**',
    description: 'Central entrypoint routing client requests to backend microservices.',
    category: 'gateway',
  },
  {
    id: 'user',
    name: 'User Service',
    port: 8081,
    dockerUrl: 'http://user-service:8081',
    routePrefix: '/api/auth/**, /api/users/**',
    description: 'Manages user accounts, authentication tokens, and user profiles.',
    database: 'user_db',
    category: 'business',
  },
  {
    id: 'vehicle',
    name: 'Vehicle Service',
    port: 8082,
    dockerUrl: 'http://vehicle-service:8082',
    routePrefix: '/api/vehicles/**',
    description: 'Manages fleet inventory, vehicle registration, and status records.',
    database: 'vehicle_db',
    category: 'business',
  },
  {
    id: 'cost',
    name: 'Cost Service',
    port: 8083,
    dockerUrl: 'http://cost-service:8083',
    routePrefix: '/api/costs/**',
    description: 'Tracks fuel, maintenance, insurance, and operating expenses.',
    database: 'cost_db',
    category: 'business',
  },
  {
    id: 'email',
    name: 'Email Service',
    port: 8084,
    dockerUrl: 'http://email-service:8084',
    routePrefix: '/api/email/**',
    description: 'Dispatches notifications, reminders, and alerts (stateless).',
    category: 'business',
  },
  {
    id: 'report',
    name: 'Report Service',
    port: 8085,
    dockerUrl: 'http://report-service:8085',
    routePrefix: '/api/reports/**',
    description: 'Aggregates vehicle utilization and expenditure summaries.',
    database: 'report_db',
    category: 'business',
  },
];

export const DashboardPage: React.FC = () => {
  const { healthMap, isCheckingAll, pingService, pingAllServices } = useHealthCheck(SERVICES);

  const databases = useMemo(() => [
    { name: 'user_db', service: 'User Service', port: 3306 },
    { name: 'vehicle_db', service: 'Vehicle Service', port: 3306 },
    { name: 'cost_db', service: 'Cost Service', port: 3306 },
    { name: 'report_db', service: 'Report Service', port: 3306 },
  ], []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Hero Banner */}
      <section className="glass-panel" style={{
        padding: '2.5rem',
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.9) 0%, rgba(30, 41, 59, 0.6) 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: '780px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span className="badge badge-success">
              <CheckCircle size={14} /> Base Infrastructure Active
            </span>
            <span className="badge badge-neutral mono">
              v0.1.0
            </span>
          </div>

          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.03em', marginBottom: '1rem' }}>
            Microservices Platform <span className="text-gradient">Base Skeleton</span>
          </h1>

          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
            All six independent Spring Boot 3.x microservices, Docker networking, API Gateway routing, 
            logical MySQL databases, and React frontend skeleton have been configured. 
            Ready for subsequent business feature iterations.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-primary"
              onClick={pingAllServices}
              disabled={isCheckingAll}
            >
              <RefreshCw size={16} className={isCheckingAll ? 'animate-spin' : ''} />
              <span>Ping All Health Checks</span>
            </button>
            <a 
              href="http://localhost:8080/actuator/health" 
              target="_blank" 
              rel="noreferrer"
              className="btn btn-secondary"
            >
              <ExternalLink size={16} />
              <span>Gateway Actuator</span>
            </a>
          </div>
        </div>
      </section>

      {/* Architecture Topology View */}
      <section className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <Network size={20} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Architecture & Routing Topology</h2>
          </div>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Network: <strong className="mono" style={{ color: 'var(--text-main)' }}>vehicle-management-network</strong>
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          padding: '1.25rem',
          borderRadius: '12px'
        }}>
          <div style={{ borderLeft: '3px solid var(--accent-blue)', paddingLeft: '0.875rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Client UI Layer</span>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginTop: '0.25rem' }}>React 18 + Vite</div>
            <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-blue)' }}>Port 5173</div>
          </div>

          <div style={{ borderLeft: '3px solid var(--accent-purple)', paddingLeft: '0.875rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>API Gateway</span>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginTop: '0.25rem' }}>Spring Cloud Gateway</div>
            <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-purple)' }}>Port 8080 (Reverse Proxy)</div>
          </div>

          <div style={{ borderLeft: '3px solid var(--accent-cyan)', paddingLeft: '0.875rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Backend Core</span>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginTop: '0.25rem' }}>5 Microservices</div>
            <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>Ports 8081 - 8085</div>
          </div>

          <div style={{ borderLeft: '3px solid var(--accent-emerald)', paddingLeft: '0.875rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Persistence</span>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginTop: '0.25rem' }}>MySQL 8.0</div>
            <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>Port 3306 (4 Schemas)</div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <Radio size={20} color="var(--accent-blue)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Microservices Status Monitor</h2>
          </div>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Each service exposes <code className="mono" style={{ color: 'var(--accent-cyan)' }}>/actuator/health</code>
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '1.5rem'
        }}>
          {SERVICES.map((service) => (
            <ServiceCard 
              key={service.id}
              service={service}
              health={healthMap[service.id]}
              onPing={pingService}
            />
          ))}
        </div>
      </section>

      {/* Logical Databases Overview */}
      <section className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem' }}>
          <HardDrive size={20} color="var(--accent-emerald)" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Logical Databases (MySQL 8.0)</h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem'
        }}>
          {databases.map((db) => (
            <div key={db.name} style={{
              padding: '1rem',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-emerald)'
              }}>
                <Database size={18} />
              </div>
              <div>
                <div className="mono" style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--accent-emerald)' }}>
                  {db.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Assigned: {db.service}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Development Quick Info */}
      <section className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
          <Terminal size={20} color="var(--accent-purple)" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Development Commands</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
          <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', padding: '1rem', borderRadius: '10px' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', display: 'block', marginBottom: '0.375rem' }}>
              DOCKER COMPOSE BUILD & START
            </span>
            <code className="mono" style={{ color: '#38bdf8', fontSize: '0.875rem' }}>
              docker compose up --build
            </code>
          </div>

          <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', padding: '1rem', borderRadius: '10px' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', display: 'block', marginBottom: '0.375rem' }}>
              STOP DOCKER COMPOSE
            </span>
            <code className="mono" style={{ color: '#f43f5e', fontSize: '0.875rem' }}>
              docker compose down
            </code>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
