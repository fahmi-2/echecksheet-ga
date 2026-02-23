'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/lib/auth-context';
import { FORM_TYPES, getFormConfig, buildAnalyticsParams } from '../../lib/dashboard-config';
import { 
  fetchAnalytics, 
  fetchHistory, 
  fetchTopUsers,
  mapAnalyticsToDashboard, 
  type DashboardData,
  type AnalyticsResponse,
} from '../../lib/analytics-mapper';
import { onDashboardRefresh, shouldRefreshForForm } from '@/lib/dashboard-events';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

interface DashboardStats {
  total: number;
  completed: number;
  pending: number;
  completionRate: string;
}

export default function GADashboard() {
  const { user } = useAuth();
  
  // ✅ Ref untuk table container (untuk scroll position)
  const tableContainerRef = useRef<HTMLDivElement>(null);
  
  // State
  const [selectedForm, setSelectedForm] = useState<string>('All Category');
  const [activeMonth, setActiveMonth] = useState<number>(new Date().getMonth());
  const [activeYear, setActiveYear] = useState<number>(new Date().getFullYear());
  
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  // ✅ Pagination State untuk History
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [scrollPosition, setScrollPosition] = useState<number>(0);
  const itemsPerPage = 10;

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const formConfig = getFormConfig(selectedForm);
      
      if (!formConfig) {
        throw new Error('Konfigurasi form tidak ditemukan');
      }

      const year = activeYear;
      const month = activeMonth;
      
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      const dateFrom = firstDay.toISOString().split('T')[0];
      const dateTo = lastDay.toISOString().split('T')[0];

      console.log('\n📊 === DASHBOARD LOAD START ===');
      console.log('📊 Form:', selectedForm);
      console.log('📊 Config:', formConfig);
      console.log('📊 Date range:', dateFrom, 'to', dateTo);
      
      const analyticsParams = buildAnalyticsParams(formConfig, {
        period: 'daily',
        dateFrom,
        dateTo,
        area: selectedForm !== 'All Category' ? selectedForm : undefined,
      });

      console.log('🔍 Analytics params:', analyticsParams);

      const [analyticsResult, topUsersResult, historyResult] = await Promise.allSettled([
        fetchAnalytics(formConfig.analyticsEndpoint, analyticsParams),
        fetchTopUsers('/analytics/top-users', analyticsParams),
        fetchHistory(
          '/analytics/history',
          formConfig.slug,
          selectedForm !== 'All Category' ? selectedForm : undefined,
          itemsPerPage,
          analyticsParams.dateFrom,
          analyticsParams.dateTo,
          currentPage
        )
      ]);

      console.log('📥 Analytics result status:', analyticsResult.status);
      console.log('👥 Top Users result status:', topUsersResult.status);
      console.log('📥 History result status:', historyResult.status);

      let analytics: AnalyticsResponse | null = null;
      if (analyticsResult.status === 'fulfilled') {
        analytics = analyticsResult.value;
        console.log('✅ Analytics value:', analytics);
        console.log('✅ Analytics.data length:', analytics?.data?.length);
      } else {
        console.error('❌ Analytics rejected:', analyticsResult.reason);
      }

      let topUsers: DashboardData['topUsers'] = [];
      if (topUsersResult.status === 'fulfilled') {
        topUsers = topUsersResult.value;
        console.log('✅ Top Users records:', topUsers.length);
      } else {
        console.error('❌ Top Users rejected:', topUsersResult.reason);
      }

      let historyData: DashboardData['historyData'] = [];
      if (historyResult.status === 'fulfilled') {
        historyData = historyResult.value.data || [];
        setTotalRecords(historyResult.value.total || 0);
        setTotalPages(historyResult.value.totalPages || 1);
        console.log('✅ History records:', historyData.length);
        console.log('✅ Total records:', historyResult.value.total);
      } else {
        console.error('❌ History rejected:', historyResult.reason);
      }

      const mappedData = mapAnalyticsToDashboard(
        analytics?.data && analytics.data.length > 0 ? analytics.data : null, 
        formConfig.label,
        topUsers,
        historyData
      );
      
      console.log('📊 Mapped dashboard data:');
      console.log('  - Stats:', mappedData.stats);
      console.log('  - Trend data length:', mappedData.trendData.length);
      console.log('  - Top Users length:', mappedData.topUsers.length);
      console.log('  - History length:', mappedData.historyData.length);
      
      setDashboardData(mappedData);
      setLastRefresh(new Date());
      
      console.log('📊 === DASHBOARD LOAD END ===\n');
      
    } catch (error) {
      console.error('❌ Critical error in loadDashboardData:', error);
      setError('Gagal memuat data. Silakan refresh halaman.');
      
      setDashboardData({
        stats: { total: 0, completed: 0, pending: 0, completionRate: '0.0' },
        trendData: [],
        distributionData: [],
        topUsers: [],
        historyData: [],
      });
      
    } finally {
      setIsLoading(false);
    }
  }, [selectedForm, activeMonth, activeYear, currentPage]);

  // Effect 1: Load data saat filter berubah
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // ✅ Auto-refresh interval (1 JAM = 3600000 ms)
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing dashboard data (1 hour interval)...');
      loadDashboardData();
    }, 3600000);

    return () => clearInterval(interval);
  }, [loadDashboardData]);

  // Effect 3: Listen untuk refresh event dari form lain
  useEffect(() => {
    const cleanup = onDashboardRefresh(
      (formType?: string) => {
        console.log('📡 Received refresh event from form:', formType);
        
        if (shouldRefreshForForm(selectedForm, formType || undefined)) {
          console.log('✅ Refreshing dashboard for form:', selectedForm);
          loadDashboardData();
        }
      },
      { debounceMs: 500 }
    );
    
    return cleanup;
  }, [selectedForm, loadDashboardData]);

  // Effect 4: Refresh saat tab menjadi visible (focus)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Dashboard tab became visible, refreshing...');
        loadDashboardData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadDashboardData]);

  // ✅ Effect: Smooth scroll ke table saat page berubah
  useEffect(() => {
    if (scrollPosition > 0 && tableContainerRef.current) {
      window.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      });
      setScrollPosition(0);
    }
  }, [currentPage, scrollPosition]);

  // ✅ Pagination Handlers dengan scroll position
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      if (tableContainerRef.current) {
        setScrollPosition(tableContainerRef.current.offsetTop - 100);
      }
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      if (tableContainerRef.current) {
        setScrollPosition(tableContainerRef.current.offsetTop - 100);
      }
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageChange = (page: number) => {
    if (tableContainerRef.current) {
      setScrollPosition(tableContainerRef.current.offsetTop - 100);
    }
    setCurrentPage(page);
  };

  // Memoized calculations
  const stats = useMemo<DashboardStats>(() => {
    return dashboardData?.stats || { total: 0, completed: 0, pending: 0, completionRate: '0.0' };
  }, [dashboardData]);

 // ✅ FIX 1: Trend Chart (Line Chart) - Date Labels
// ✅ FIX 1: Trend Chart (Line Chart) - Date Labels
// ✅ FIX: Trend Chart (Line Chart) - Date Labels
const trendChartData = useMemo(() => {
  if (!dashboardData?.trendData || dashboardData.trendData.length === 0) {
    return { labels: [], datasets: [] };
  }
  
  const labels = dashboardData.trendData.map(item => {
    if (item.date.includes('-')) {
      const parts = item.date.split('-');
      // ✅ Ambil langsung dari string API (sudah timezone Asia/Jakarta)
      const year = parts[0];
      const month = parts[1];
      const day = parts[2];
      
      // Format: DD/MM atau MM/YY
      if (day && day !== '01') {
        return `${day}/${month}`;
      }
      return `${month}/${year?.slice(2)}`;
    }
    return item.date;
  });

  return {
    labels,
    datasets: [{
      label: 'Total Inspeksi',
      data: dashboardData.trendData.map(item => item.count),
      borderColor: '#1976d2',
      backgroundColor: 'rgba(25, 118, 210, 0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#1976d2',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
    }]
  };
}, [dashboardData]);

// ✅ FIX 2: Distribution Chart (Bar Chart) - Group by Area, not Date
const distributionChartData = useMemo(() => {
  if (!dashboardData?.distributionData || dashboardData.distributionData.length === 0) {
    return { labels: [], datasets: [] };
  }
  
  // ✅ Group data by area, not by date
  const areaMap = new Map<string, { ok: number; ng: number }>();
  
  dashboardData.distributionData.forEach(item => {
    // Gunakan area dari historyData atau category dari distributionData
    const area = item.category || 'Unknown';
    
    if (!areaMap.has(area)) {
      areaMap.set(area, { ok: 0, ng: 0 });
    }
    
    const current = areaMap.get(area)!;
    if (item.status === 'OK') {
      current.ok += item.count;
    } else if (item.status === 'NG') {
      current.ng += item.count;
    }
  });
  
  const labels = Array.from(areaMap.keys());
  const okData = labels.map(area => areaMap.get(area)!.ok);
  const ngData = labels.map(area => areaMap.get(area)!.ng);
  
  return {
    labels,
    datasets: [
      { 
        label: 'OK', 
        data: okData, 
        backgroundColor: '#10B981', 
        barPercentage: 0.8,
        barThickness: 20,
      },
      { 
        label: 'NG', 
        data: ngData, 
        backgroundColor: '#F59E0B', 
        barPercentage: 0.8,
        barThickness: 20,
      }
    ]
  };
}, [dashboardData]);

// ❌ HAPUS BAGIAN INI
const formatDateTime = (dateString: string): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    // ✅ FIX: Gunakan timezone lokal dengan opsi explicit
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta' // ✅ Explicit timezone
    });
  } catch {
    return dateString;
  }
};
  const topUsers = useMemo(() => dashboardData?.topUsers || [], [dashboardData]);
  const historyData = useMemo(() => dashboardData?.historyData || [], [dashboardData]);

  // Helpers
  const userName = user?.fullName || 'User';
  if (!user) return null;

  const getMonthName = (monthIndex: number): string => {
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return months[monthIndex];
  };

  const changeMonth = (direction: number) => {
    let newMonth = activeMonth + direction;
    let newYear = activeYear;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    else if (newMonth > 11) { newMonth = 0; newYear++; }
    setActiveMonth(newMonth);
    setActiveYear(newYear);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  // RENDER
  return (
    <>
      <Sidebar userName={userName} />
      <div className="dashboard-container">
        <main className="main-content">
          
          {/* HEADER */}
          <div className="header-section">
            <div className="header-content">
              <div className="header-text">
                <h1 className="page-title">📊 GA Dashboard</h1>
                <p className="page-subtitle">Wawasan berbasis data untuk peningkatan kualitas inspeksi</p>
                <p className="last-refresh">
                  Terakhir diperbarui: {lastRefresh.toLocaleTimeString('id-ID')}
                  <span className="auto-refresh-info"> (Auto-refresh: 1 jam)</span>
                </p>
              </div>
              
              <div className="header-controls">
                <div className="filter-container">
                  <label htmlFor="formFilter" className="filter-label">Form:</label>
                  <select
                    id="formFilter"
                    value={selectedForm}
                    onChange={(e) => {
                      setSelectedForm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="category-dropdown"
                  >
                    {FORM_TYPES.map(form => (
                      <option key={form.value} value={form.value}>{form.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* MONTH NAVIGATION */}
          <div className="month-navigation">
            <button onClick={() => changeMonth(-1)} className="month-btn month-btn-prev">
              ← Bulan Lalu
            </button>
            <span className="month-display">{getMonthName(activeMonth)} {activeYear}</span>
            <button onClick={() => changeMonth(1)} className="month-btn month-btn-next">
              Bulan Depan →
            </button>
          </div>

          {/* LOADING & ERROR */}
          {isLoading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Memuat data {getFormConfig(selectedForm)?.label}...</p>
              <p className="loading-sub">Auto-refresh setiap 1 jam</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <strong>⚠️ Error: </strong> {error}
              <button onClick={loadDashboardData} className="retry-btn">Coba Lagi</button>
            </div>
          )}

          {/* DASHBOARD CONTENT */}
          {!isLoading && !error && dashboardData && (
            <>
              {/* Stats Cards */}
              <div className="stats-grid">
                <div className="stat-card primary">
                  <div className="stat-icon">📋</div>
                  <div className="stat-value">{stats.total}</div>
                  <div className="stat-label">Total Inspeksi</div>
                </div>
                <div className="stat-card success">
                  <div className="stat-icon">✓</div>
                  <div className="stat-value">{stats.completed}</div>
                  <div className="stat-label">Item OK</div>
                </div>
                <div className="stat-card warning">
                  <div className="stat-icon">✗</div>
                  <div className="stat-value">{stats.pending}</div>
                  <div className="stat-label">Item NG</div>
                </div>
                <div className="stat-card info">
                  <div className="stat-icon">📊</div>
                  <div className="stat-value">{stats.completionRate}%</div>
                  <div className="stat-label">Compliance Rate</div>
                </div>
              </div>

              {/* Trend Chart */}
              <div className="chart-box large">
                <h3 className="chart-title">
                  📈 Aktivitas {getFormConfig(selectedForm)?.label.replace(/^[^\s]+\s/, '')} (7 Periode Terakhir)
                </h3>
                <div className="chart-container large">
                  {trendChartData.labels.length > 0 ? (
                    <Line data={trendChartData} options={{
                      responsive: true, maintainAspectRatio: false,
                      plugins: { 
                        legend: { position: 'top' as const }, 
                        tooltip: { callbacks: { label: (ctx) => `Total: ${ctx.parsed.y} inspeksi` } } 
                      },
                      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                    }} />
                  ) : (
                    <div className="empty-chart">
                      <p>📭 Belum ada data untuk periode ini</p>
                      <p className="empty-chart-sub">Data akan auto-refresh setiap 1 jam</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Charts Grid */}
              <div className="charts-grid">
                {/* Distribution Chart */}
                <div className="chart-box">
                  <h3 className="chart-title">📊 Distribusi OK/NG per Area</h3>
                  <div className="chart-container">
                    {distributionChartData.labels.length > 0 ? (
                      <Bar data={distributionChartData} options={{
                        responsive: true, maintainAspectRatio: false, indexAxis: 'y' as const,
                        plugins: { legend: { position: 'top' as const } },
                        scales: { x: { beginAtZero: true, stacked: true }, y: { stacked: true } }
                      }} />
                    ) : (
                      <p className="empty-chart">Belum ada data distribusi.</p>
                    )}
                  </div>
                </div>

                {/* Top Users */}
                <div className="chart-box">
                  <h3 className="chart-title">🏆 Top Inspector</h3>
                  <div className="top-users">
                    {topUsers.length > 0 ? (
                      topUsers.map((userItem, i) => {
                        const maxCount = topUsers[0]?.count || 1;
                        const progress = Math.min((userItem.count / maxCount) * 100, 100);
                        return (
                          <div key={i} className="user-item">
                            <div className="user-rank-badge">{i + 1}</div>
                            <div className="user-content">
                              <div className="user-header">
                                <span className="user-name">{userItem.name}</span>
                                <span className="user-count">{userItem.count}</span>
                              </div>
                              <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="empty-chart">Belum ada data inspector.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* History Table with Pagination */}
              <div className="section">
                <div className="section-header">
                  <h2 className="section-title">📜 Riwayat Terbaru</h2>
                  <div className="section-actions">
                    {totalRecords > 0 && (
                      <span className="record-count">
                        Total: {totalRecords} records | Halaman {currentPage} dari {totalPages}
                      </span>
                    )}
                    <button onClick={loadDashboardData} className="refresh-btn" title="Refresh manual">
                      🔄 Refresh
                    </button>
                  </div>
                </div>
                {historyData.length > 0 ? (
                  <>
                    <div className="history-table-container" ref={tableContainerRef}>
                      <table className="history-table">
                        <thead>
                          <tr>
                            <th style={{ width: '60px', textAlign: 'center' }}>No</th>
                            <th>Waktu</th>
                            <th>Area</th>
                            <th>Status</th>
                            <th>Item NG</th>
                            <th>PIC</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historyData.map((item, i) => {
                            const rowNumber = (currentPage - 1) * itemsPerPage + i + 1;
                            return (
                              <tr key={i} className={item.ngCount > 0 ? 'row-warning' : ''}>
                                <td className="row-number">{rowNumber}</td>
                                <td>{formatDateTime(item.filledAt)}</td>
                                <td>{item.area}</td>
                                <td>
                                  <span className={`status-badge ${item.status === 'OK' ? 'ok' : 'ng'}`}>
                                    {item.status}
                                  </span>
                                </td>
                                <td>
                                  {item.ngCount > 0 ? (
                                    <span className="ng-count">{item.ngCount} ⚠️</span>
                                  ) : (
                                    <span className="ok-count">0</span>
                                  )}
                                </td>
                                <td>{item.filledBy || '–'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="pagination-controls">
                        <button 
                          onClick={handlePreviousPage} 
                          disabled={currentPage === 1}
                          className="pagination-btn"
                        >
                          ← Sebelumnya
                        </button>
                        
                        <div className="page-numbers">
                          {getPageNumbers().map(page => (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`page-btn ${currentPage === page ? 'active' : ''}`}
                            >
                              {page}
                            </button>
                          ))}
                        </div>
                        
                        <button 
                          onClick={handleNextPage} 
                          disabled={currentPage === totalPages}
                          className="pagination-btn"
                        >
                          Berikutnya →
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="empty-activity">Belum ada riwayat untuk form ini.</p>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* CSS Styles */}
      <style jsx>{`
        .dashboard-container {
          display: flex;
          min-height: 100vh;
          background-color: #f5f7fa;
        }

        .main-content {
          flex: 1;
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }

        .header-section {
          background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
          color: white;
          padding: 24px;
          border-radius: 16px;
          margin-bottom: 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 24px;
        }

        .header-text h1 {
          margin: 0 0 8px 0;
          font-size: 2rem;
          font-weight: 700;
        }

        .header-text p {
          margin: 0;
          opacity: 0.9;
          font-size: 1.1rem;
        }

        .last-refresh {
          margin-top: 8px;
          font-size: 0.9rem;
          opacity: 0.85;
          font-style: italic;
        }

        .auto-refresh-info {
          font-size: 0.85rem;
          opacity: 0.7;
          margin-left: 8px;
        }

        .header-controls {
          display: flex;
          flex-direction: column;
          gap: 16px;
          align-items: flex-end;
        }

        .filter-container {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255, 255, 255, 0.15);
          padding: 12px 20px;
          border-radius: 12px;
        }

        .filter-label {
          font-weight: 600;
          font-size: 0.95rem;
        }

        .category-dropdown {
          padding: 8px 16px;
          border: none;
          border-radius: 8px;
          background: white;
          color: #333;
          font-weight: 500;
          cursor: pointer;
          min-width: 220px;
          font-size: 0.95rem;
        }

        .category-dropdown:focus {
          outline: 2px solid #64b5f6;
        }

        .month-navigation {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          margin-bottom: 24px;
          padding: 16px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .month-btn {
          padding: 10px 20px;
          background: #1976d2;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.95rem;
        }

        .month-btn:hover {
          background: #0d47a1;
          transform: translateY(-2px);
        }

        .month-display {
          font-size: 1.4rem;
          font-weight: 700;
          color: #1976d2;
          min-width: 180px;
          text-align: center;
        }

        .loading-state {
          text-align: center;
          padding: 60px 24px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .spinner {
          display: inline-block;
          width: 50px;
          height: 50px;
          border: 4px solid #e0e0e0;
          border-top-color: #1976d2;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        .loading-state p {
          color: #666;
          font-size: 1.1rem;
          margin: 8px 0;
        }

        .loading-sub {
          font-size: 0.9rem;
          color: #999;
          font-style: italic;
        }

        .error-state {
          background: #fef2f2;
          color: #dc2626;
          padding: 16px 20px;
          border-radius: 8px;
          margin-bottom: 24px;
          border-left: 4px solid #dc2626;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .retry-btn {
          margin-left: auto;
          padding: 8px 16px;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.2s;
        }

        .retry-btn:hover {
          background: #b91c1c;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          text-align: center;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }

        .stat-card.primary {
          background: linear-gradient(135deg, #3B82F6, #2563EB);
          color: white;
        }

        .stat-card.success {
          background: linear-gradient(135deg, #10B981, #059669);
          color: white;
        }

        .stat-card.warning {
          background: linear-gradient(135deg, #F59E0B, #D97706);
          color: white;
        }

        .stat-card.info {
          background: linear-gradient(135deg, #6366F1, #4F46E5);
          color: white;
        }

        .stat-icon {
          font-size: 2.5rem;
          margin-bottom: 12px;
        }

        .stat-value {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 8px;
          line-height: 1;
        }

        .stat-label {
          font-size: 0.95rem;
          opacity: 0.95;
          font-weight: 500;
        }

        .chart-box {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .chart-box.large {
          padding: 32px;
        }

        .chart-title {
          margin: 0 0 20px 0;
          font-size: 1.25rem;
          color: #1f2937;
          font-weight: 600;
        }

        .chart-container {
          height: 280px;
        }

        .chart-container.large {
          height: 380px;
        }

        .empty-chart {
          text-align: center;
          color: #94a3b8;
          padding: 40px 20px;
          font-size: 1rem;
        }

        .empty-chart-sub {
          font-size: 0.9rem;
          margin-top: 8px;
          opacity: 0.8;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 24px;
          margin-bottom: 24px;
        }

        .top-users {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .user-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 14px 16px;
          background: #f9fafb;
          border-radius: 8px;
          transition: background 0.2s;
        }

        .user-item:hover {
          background: #f3f4f6;
        }

        .user-rank-badge {
          width: 36px;
          height: 36px;
          background: #1976d2;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.1rem;
          flex-shrink: 0;
        }

        .user-content {
          flex: 1;
          min-width: 0;
        }

        .user-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .user-name {
          font-weight: 600;
          color: #1f2937;
          font-size: 0.95rem;
        }

        .user-count {
          background: #1976d2;
          color: white;
          padding: 4px 14px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.85rem;
        }

        .progress-bar {
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #10B981, #059669);
          transition: width 0.3s ease;
          border-radius: 4px;
        }

        .section {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 2px solid #e5e7eb;
        }

        .section-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .section-title {
          margin: 0;
          font-size: 1.3rem;
          color: #1f2937;
          font-weight: 700;
        }

        .record-count {
          color: #6b7280;
          font-size: 0.95rem;
          background: #f3f4f6;
          padding: 6px 12px;
          border-radius: 20px;
        }

        .refresh-btn {
          padding: 6px 12px;
          background: #1976d2;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          font-size: 0.9rem;
          transition: all 0.2s;
        }

        .refresh-btn:hover {
          background: #0d47a1;
        }

        .history-table-container {
          overflow-x: auto;
          max-height: 400px;
          overflow-y: auto;
        }

        .history-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }

        .history-table th,
        .history-table td {
          padding: 14px 16px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }

        .history-table th {
          background: #f9fafb;
          font-weight: 600;
          color: #1f2937;
          position: sticky;
          top: 0;
          z-index: 1;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .history-table tr:hover {
          background: #f9fafb;
        }

        .history-table tr.row-warning {
          background: #fffbeb;
        }

        .history-table tr.row-warning:hover {
          background: #fef3c7;
        }

        .status-badge {
          padding: 6px 14px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.8rem;
          display: inline-block;
        }

        .status-badge.ok {
          background: #d1fae5;
          color: #065f46;
        }

        .status-badge.ng {
          background: #fef3c7;
          color: #92400e;
        }

        .ng-count {
          color: #d97706;
          font-weight: 600;
        }

        .ok-count {
          color: #059669;
          font-weight: 600;
        }

        .empty-activity {
          text-align: center;
          color: #6b7280;
          padding: 40px;
          font-size: 1.1rem;
        }

        /* ✅ Row Number Column */
        .row-number {
          text-align: center;
          font-weight: 600;
          color: #6b7280;
          background: #f9fafb;
        }

        .history-table tr:hover .row-number {
          background: #f3f4f6;
        }

        .history-table tr.row-warning .row-number {
          background: #fffbeb;
        }

        .history-table tr.row-warning:hover .row-number {
          background: #fef3c7;
        }

        /* ✅ Pagination Styles */
        .pagination-controls {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
        }

        .pagination-btn {
          padding: 8px 16px;
          background: #1976d2;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          font-size: 0.9rem;
          transition: all 0.2s;
        }

        .pagination-btn:hover:not(:disabled) {
          background: #0d47a1;
        }

        .pagination-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .page-numbers {
          display: flex;
          gap: 6px;
        }

        .page-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          font-size: 0.9rem;
          transition: all 0.2s;
          color: #374151;
        }

        .page-btn:hover {
          background: #f3f4f6;
          border-color: #1976d2;
        }

        .page-btn.active {
          background: #1976d2;
          color: white;
          border-color: #1976d2;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 1024px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }
          
          .header-content {
            flex-direction: column;
            align-items: stretch;
          }
          
          .header-controls {
            align-items: stretch;
          }
        }

        @media (max-width: 768px) {
          .main-content {
            padding: 16px;
          }
          
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .month-navigation {
            flex-direction: column;
            gap: 12px;
          }
          
          .month-display {
            font-size: 1.2rem;
          }
          
          .chart-box, .chart-box.large {
            padding: 20px;
          }
          
          .chart-title {
            font-size: 1.1rem;
          }
          
          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          
          .pagination-controls {
            flex-wrap: wrap;
          }
        }

        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
          
          .stat-value {
            font-size: 2rem;
          }
          
          .history-table th,
          .history-table td {
            padding: 10px 12px;
            font-size: 0.85rem;
          }
          
          .page-btn {
            width: 32px;
            height: 32px;
            font-size: 0.85rem;
          }
        }
      `}</style>
    </>
  );
}