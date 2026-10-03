import React, { useState, useEffect } from 'react';
import { reportService } from '../services/reportService';
import {
  ReportSummary,
  MonthlyTrend,
  CostByType,
  TopVehicle,
} from '../../../types';
import { useToast } from '../../../context/ToastContext';
import { Skeleton, TableSkeleton } from '../../../components/common/Skeleton';
import {
  Car,
  Clock,
  Wrench,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Award,
  RotateCcw,
  ArrowUpRight,
  PieChart,
  BarChart3,
  Info,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { showToast } = useToast();
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Data states
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [costByType, setCostByType] = useState<CostByType[]>([]);
  const [topVehicles, setTopVehicles] = useState<TopVehicle[]>([]);

  // Hover state for interactive chart tooltip
  const [hoveredMonth, setHoveredMonth] = useState<MonthlyTrend | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const [sumData, trendData, typeData, topData] = await Promise.all([
        reportService.getSummary(selectedYear),
        reportService.getMonthlyTrends(selectedYear),
        reportService.getCostByType(selectedYear),
        reportService.getTopVehicles(5, selectedYear),
      ]);

      setSummary(sumData);
      setMonthlyTrends(trendData);
      setCostByType(typeData);
      setTopVehicles(topData);
    } catch {
      setHasError(true);
      showToast('error', 'Không thể tải toàn bộ dữ liệu bảng điều khiển');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedYear]);

  // Max amount for bar scaling
  const maxTrendAmount = Math.max(...monthlyTrends.map((t) => Number(t.amount)), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Header & Year Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            Bảng Điều khiển Phân tích & Thống kê Hạm đội
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '2px 0 0 0' }}>
            Chỉ số đo lường hiệu suất (KPI), biến động chi phí 12 tháng và cơ cấu tài chính
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.75rem', borderRadius: '10px' }}>
            <Calendar size={16} color="var(--accent-blue)" />
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Năm tài chính:
            </span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                fontWeight: 700,
                fontSize: '0.875rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value={2026} style={{ background: '#111827' }}>2026</option>
              <option value={2025} style={{ background: '#111827' }}>2025</option>
              <option value={2024} style={{ background: '#111827' }}>2024</option>
            </select>
          </div>

          <button onClick={fetchDashboardData} className="btn btn-secondary btn-icon" title="Làm mới số liệu">
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Error state */}
      {hasError && (
        <div
          className="glass-panel"
          style={{
            padding: '1.5rem',
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#fb7185' }}>
            <Info size={20} />
            <span>Không thể nạp dữ liệu thống kê từ máy chủ. Bấm nút bên cạnh để thử lại.</span>
          </div>
          <button onClick={fetchDashboardData} className="btn btn-secondary btn-sm">
            <RotateCcw size={14} /> Thử lại
          </button>
        </div>
      )}

      {/* 4 Metric KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        {/* Card 1: Total Vehicles */}
        <div className="glass-panel" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Tổng quy mô đội xe
              </span>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.375rem' }}>
                {isLoading ? <Skeleton width="80px" height="36px" /> : `${summary?.totalVehicles || 0} xe`}
              </div>
            </div>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-blue)',
              }}
            >
              <Car size={22} />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="pulse-dot" style={{ background: 'var(--accent-emerald)' }} />
            <span>Sẵn sàng hoạt động: {summary?.availableVehicles || 0} xe</span>
          </div>
        </div>

        {/* Card 2: In-Use Vehicles */}
        <div className="glass-panel" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Xe đang thực hiện chuyến
              </span>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '0.375rem' }}>
                {isLoading ? <Skeleton width="80px" height="36px" /> : `${summary?.inUseVehicles || 0} xe`}
              </div>
            </div>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(6, 182, 212, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-cyan)',
              }}
            >
              <Clock size={22} />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Tỷ lệ điều phối công suất: {summary?.totalVehicles ? Math.round(((summary.inUseVehicles || 0) / summary.totalVehicles) * 100) : 0}%
          </div>
        </div>

        {/* Card 3: Maintenance Vehicles (Clickable link to vehicles?status=MAINTENANCE) */}
        <a
          href="/vehicles?status=MAINTENANCE"
          className="glass-panel"
          style={{
            padding: '1.5rem',
            position: 'relative',
            overflow: 'hidden',
            textDecoration: 'none',
            display: 'block',
            cursor: 'pointer',
          }}
          title="Bấm để xem danh sách xe đang bảo dưỡng"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Xe đang bảo dưỡng
                </span>
                <ArrowUpRight size={14} color="var(--accent-amber)" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '0.375rem' }}>
                {isLoading ? <Skeleton width="80px" height="36px" /> : `${summary?.maintenanceVehicles || 0} xe`}
              </div>
            </div>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-amber)',
              }}
            >
              <Wrench size={22} />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--accent-amber)' }}>
            Bấm vào đây để lọc xem chi tiết &rarr;
          </div>
        </a>

        {/* Card 4: Total Cost This Month */}
        <div className="glass-panel" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Chi phí phát sinh tháng này
              </span>
              <div className="mono" style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '0.375rem' }}>
                {isLoading ? (
                  <Skeleton width="130px" height="36px" />
                ) : (
                  `${Number(summary?.currentMonthCost || 0).toLocaleString('vi-VN')} ₫`
                )}
              </div>
            </div>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-emerald)',
              }}
            >
              <DollarSign size={22} />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {(summary?.costChangePercentage || 0) >= 0 ? (
              <span style={{ color: 'var(--accent-rose)', display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: 700 }}>
                <TrendingUp size={14} /> +{summary?.costChangePercentage}%
              </span>
            ) : (
              <span style={{ color: 'var(--accent-emerald)', display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: 700 }}>
                <TrendingDown size={14} /> {summary?.costChangePercentage}%
              </span>
            )}
            <span style={{ color: 'var(--text-dim)' }}>so với tháng trước</span>
          </div>
        </div>
      </div>

      {/* Chart Section: 2 Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
        {/* Left: Monthly Trend Bar Chart */}
        <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={20} color="var(--accent-blue)" />
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, margin: 0 }}>
                Xu hướng chi phí 12 tháng ({selectedYear})
              </h3>
            </div>
            {hoveredMonth && (
              <div
                style={{
                  background: '#000000',
                  border: '1px solid rgba(59, 130, 246, 0.5)',
                  padding: '0.25rem 0.625rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  color: 'var(--accent-cyan)',
                  fontWeight: 600,
                  animation: 'fadeIn 0.15s ease',
                }}
              >
                Tháng {hoveredMonth.month < 10 ? '0' + hoveredMonth.month : hoveredMonth.month}/{selectedYear}:{' '}
                {Number(hoveredMonth.amount).toLocaleString('vi-VN')} ₫
              </div>
            )}
          </div>

          {isLoading ? (
            <Skeleton height="220px" borderRadius="12px" />
          ) : (
            <div style={{ height: '220px', display: 'flex', alignItems: 'flex-end', gap: '0.625rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', position: 'relative' }}>
              {monthlyTrends.map((t) => {
                const heightPct = Math.max(Math.round((Number(t.amount) / maxTrendAmount) * 100), 4);
                const isHovered = hoveredMonth?.month === t.month;
                return (
                  <div
                    key={t.month}
                    onMouseEnter={() => setHoveredMonth(t)}
                    onMouseLeave={() => setHoveredMonth(null)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%',
                      justifyContent: 'flex-end',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: `${heightPct}%`,
                        background: isHovered
                          ? 'linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%)'
                          : 'linear-gradient(180deg, rgba(59, 130, 246, 0.8) 0%, rgba(139, 92, 246, 0.5) 100%)',
                        borderRadius: '6px 6px 0 0',
                        boxShadow: isHovered ? '0 0 16px rgba(59, 130, 246, 0.6)' : 'none',
                        transition: 'all 0.25s ease',
                      }}
                    />
                    <span style={{ fontSize: '0.7rem', color: isHovered ? 'var(--text-main)' : 'var(--text-dim)', marginTop: '0.5rem', fontWeight: 600 }}>
                      {t.monthLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            <span>Đơn vị: VNĐ</span>
            <span>Rê chuột vào cột để xem chi tiết chi phí từng tháng</span>
          </div>
        </div>

        {/* Right: Cost Structure / Breakdown Chart */}
        <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <PieChart size={20} color="var(--accent-purple)" />
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, margin: 0 }}>
              Cơ cấu danh mục chi phí ({selectedYear})
            </h3>
          </div>

          {isLoading ? (
            <Skeleton height="220px" borderRadius="12px" />
          ) : costByType.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '0.875rem' }}>
              Chưa có dữ liệu chi phí trong năm {selectedYear}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, justifyContent: 'center' }}>
              {/* Stacked bar representation */}
              <div
                style={{
                  height: '24px',
                  width: '100%',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  display: 'flex',
                  background: 'rgba(255, 255, 255, 0.05)',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                }}
              >
                {costByType.map((item) => (
                  <div
                    key={item.type}
                    style={{
                      width: `${item.percentage}%`,
                      height: '100%',
                      background: item.color,
                      transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                    title={`${item.typeLabel}: ${item.percentage}%`}
                  />
                ))}
              </div>

              {/* Legend List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginTop: '0.5rem' }}>
                {costByType.map((item) => (
                  <div key={item.type} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }} />
                      <span style={{ color: 'var(--text-muted)' }}>{item.typeLabel}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className="mono" style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {Number(item.amount).toLocaleString('vi-VN')} ₫
                      </span>
                      <span className="badge badge-neutral" style={{ minWidth: '46px', textAlign: 'center' }}>
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Top 5 High-Cost Vehicles */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Award size={20} color="var(--accent-amber)" />
          <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, margin: 0 }}>
            Top 5 phương tiện có chi phí vận hành cao nhất ({selectedYear})
          </h3>
        </div>

        {isLoading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : topVehicles.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.875rem' }}>
            Chưa có số liệu phát sinh chi phí theo từng đầu xe.
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Hạng</th>
                  <th>Biển số xe</th>
                  <th>Hãng & Dòng xe</th>
                  <th>Tài xế phụ trách</th>
                  <th>Số lượt phát sinh</th>
                  <th style={{ textAlign: 'right' }}>Tổng chi phí (VNĐ)</th>
                </tr>
              </thead>
              <tbody>
                {topVehicles.map((tv) => (
                  <tr key={tv.vehicleId}>
                    <td>
                      <span
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          background: tv.rank === 1 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          color: tv.rank === 1 ? 'var(--accent-amber)' : 'var(--text-dim)',
                          border: tv.rank === 1 ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-color)',
                        }}
                      >
                        {tv.rank}
                      </span>
                    </td>
                    <td className="mono" style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
                      {tv.licensePlate}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {tv.brandModel}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {tv.driverName}
                    </td>
                    <td className="mono" style={{ color: 'var(--text-dim)' }}>
                      {tv.costCount} phiếu
                    </td>
                    <td className="mono" style={{ textAlign: 'right', fontWeight: 800, color: tv.rank === 1 ? 'var(--accent-rose)' : 'var(--text-main)', fontSize: '0.9375rem' }}>
                      {Number(tv.totalCost).toLocaleString('vi-VN')} ₫
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
