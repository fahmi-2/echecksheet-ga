// lib/analytics-mapper.ts

export interface AnalyticsResponse {
  success: boolean;
  data: Array<{
    date: string;
    status: string;
    count: number;
  }>;
}

export interface TopUsersResponse {
  success: boolean;
  data: Array<{
    name: string;
    count: number;
  }>;
}

export interface HistoryResponse {
  success: boolean;
  data: Array<{
    id: string | number;
    filledAt: string;
    area: string;
    status: string;
    ngCount: number;
    filledBy: string;
  }>;
}

export interface DashboardData {
  stats: {
    total: number;
    completed: number;
    pending: number;
    completionRate: string;
  };
  trendData: Array<{ date: string; count: number }>;
  distributionData: Array<{ category: string; status: string; count: number }>;
  topUsers: Array<{ name: string; count: number }>;
  historyData: Array<{
    filledAt: string;
    area: string;
    category: string;
    shift: string;
    status: string;
    ngCount: number;
    filledBy: string;
  }>;
}

/**
 * Build unified params for all analytics endpoints
 */
export function buildDashboardParams(
  formConfig: any,
  extraParams: {
    period?: string;
    dateFrom: string;
    dateTo: string;
    area?: string;
    inspectionType?: string;
  }
) {
  const params: any = {
    slug: formConfig.slug,
    dateFrom: extraParams.dateFrom,
    dateTo: extraParams.dateTo,
  };

  if (extraParams.area && extraParams.area !== 'All Category') {
    params.area = extraParams.area;
  }

  if (extraParams.inspectionType) {
    params.inspectionType = extraParams.inspectionType;
    params.formType = extraParams.inspectionType;
  }

  return params;
}

/**
 * Fetch analytics data (Chart & Stats)
 */
export async function fetchAnalytics(endpoint: string, params: any): Promise<AnalyticsResponse | null> {
  try {
    const queryString = new URLSearchParams(params).toString();
    const url = `/api${endpoint}?${queryString}`;
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    // Support multiple response formats
    if (data.success && Array.isArray(data.formattedData)) {
      return { success: true, data: data.formattedData };
    }
    if (data.success && Array.isArray(data.data)) {
      return { success: true, data: data.data };
    }
    if (Array.isArray(data)) {
      return { success: true, data };
    }
    
    return null;
  } catch (error) {
    console.error('❌ [Analytics] Fetch failed:', error);
    return null;
  }
}

/**
 * ✅ NEW: Fetch Top Users data
 */
export async function fetchTopUsers(
  endpoint: string = '/analytics/top-users',
  params: any
): Promise<TopUsersResponse['data']> {
  try {
    const queryString = new URLSearchParams(params).toString();
    const url = `/api${endpoint}?${queryString}`;
    
    console.log('👥 [TopUsers] Fetching:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      console.error('❌ [TopUsers] HTTP Error', response.status);
      return [];
    }
    
    const result = await response.json();
    
    if (result?.success && Array.isArray(result.data)) {
      console.log('✅ [TopUsers] Found', result.data.length, 'users');
      return result.data;
    }
    
    return [];
  } catch (error) {
    console.error('❌ [TopUsers] Fetch failed:', error);
    return [];
  }
}

/**
 * ✅ UPDATED: Fetch History data
 */
// Tambahkan parameter page di fungsi fetchHistory
export async function fetchHistory(
  endpoint: string = '/analytics/history',
  formType: string,
  area?: string,
  limit: number = 10,
  dateFrom?: string,
  dateTo?: string,
  page: number = 1  // ✅ Tambahkan parameter page
): Promise<{ data: DashboardData['historyData']; total: number; totalPages: number }> {
  try {
    const slug = formType.toLowerCase().replace(/\s+/g, '-');
    
    const params = new URLSearchParams({
      slug: slug,
      limit: limit.toString(),
      page: page.toString(),  // ✅ Kirim page ke API
    });
    
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    if (area && area !== 'All Category') params.append('area', area);
    
    const queryString = params.toString();
    const url = `/api${endpoint}?${queryString}`;
    
    console.log('📜 [History] Fetching:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [History] HTTP Error', response.status, errorText);
      return { data: [], total: 0, totalPages: 0 };
    }
    
    const result = await response.json();
    console.log('✅ [History] Response:', result);
    
    if (result?.success && Array.isArray(result.data)) {
      const historyData = result.data.map((record: any) => ({
        filledAt: record.filledAt || record.createdAt || record.date,
        area: record.area || record.zona || record.jenis_apd || record.area_code || 'N/A',
        category: formType,
        shift: 'Pagi',
        status: record.status || 'OK',
        ngCount: parseInt(record.ngCount) || 0,
        filledBy: record.filledBy || record.checker || record.inspector_name || record.inspector || record.checker_name || '-',
      }));
      
      return {
        data: historyData,
        total: result.total || historyData.length,
        totalPages: result.totalPages || 1,
      };
    }
    
    return { data: [], total: 0, totalPages: 0 };
  } catch (error) {
    console.error('❌ [History] Fetch failed:', error);
    return { data: [], total: 0, totalPages: 0 };
  }
}

/**
 * ✅ UPDATED: Map analytics data + topUsers + history to dashboard format
 */
export function mapAnalyticsToDashboard(
  analyticsData: Array<{ date: string; status: string; count: number }> | null | undefined,
  formLabel: string,
  topUsersData: Array<{ name: string; count: number }> = [],
  historyDataRaw: DashboardData['historyData'] = []
): DashboardData {
  // Handle null/undefined/empty analytics data
  if (!analyticsData || analyticsData.length === 0) {
    return {
      stats: { total: 0, completed: 0, pending: 0, completionRate: '0.0' },
      trendData: [],
      distributionData: [],
      topUsers: topUsersData,
      historyData: historyDataRaw,
    };
  }

  // Calculate Stats
  const totalOK = analyticsData
    .filter(d => d.status === 'OK')
    .reduce((sum, d) => sum + d.count, 0);
    
  const totalNG = analyticsData
    .filter(d => d.status === 'NG')
    .reduce((sum, d) => sum + d.count, 0);
    
  const total = totalOK + totalNG;
  const completionRate = total > 0 ? ((totalOK / total) * 100).toFixed(1) : '0.0';

  // Group by date for Trend
  const trendMap = new Map<string, number>();
  analyticsData.forEach(d => {
    const current = trendMap.get(d.date) || 0;
    trendMap.set(d.date, current + d.count);
  });

  const trendData = Array.from(trendMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Distribution per date
  const distributionData = analyticsData.map(d => ({
    category: d.date,
    status: d.status,
    count: d.count,
  }));

  return {
    stats: {
      total,
      completed: totalOK,
      pending: totalNG,
      completionRate,
    },
    trendData,
    distributionData,
    topUsers: topUsersData,
    historyData: historyDataRaw,
  };
}