// lib/dashboard-config.ts

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface FormConfig {
  type: string;
  label: string;
  slug: string;
  inspectionType?: 'inspeksi' | 'preventive';
  analyticsEndpoint: string;
  historyEndpoint: string;
  buildCustomParams?: (baseParams: Record<string, string>, options: any) => Record<string, string>;
}

// ✅ FIX: Make AnalyticsParams extend Record<string, string | undefined> to allow optional properties
export interface AnalyticsParams extends Record<string, string | undefined> {
  slug: string;
  dateFrom: string;
  dateTo: string;
  period: string;
  inspectionType?: string;
  area?: string;
}

// ============================================
// FORM TYPES CONFIGURATION
// ============================================

export const FORM_TYPES = [
  { value: 'All Category', label: 'Semua Kategori' },
  { value: 'APAR', label: 'APAR Inspection' },
  { value: 'Fire Alarm', label: 'Fire Alarm Inspection' },
  { value: 'Emergency Lamp', label: 'Emergency Lamp Inspection' },
  { value: 'APD', label: 'APD Distribution' },
  { value: 'Toilet', label: 'Toilet Inspection' },
  { value: 'Electrical', label: 'Electrical Installation' },
  { value: 'Lift Barang - Inspeksi', label: 'Lift Barang - Inspeksi 3 Bulan' },
  { value: 'Lift Barang - Preventive', label: 'Lift Barang - Preventive Maintenance' },
  
  // ✅ TAMBAHKAN 3 FORM BARU INI
  { value: 'Exit Lamp', label: 'Exit Lamp & Titik Kumpul' },
  { value: 'Pintu Darurat', label: 'Pintu Darurat' },
  { value: 'Titik Kumpul', label: 'Titik Kumpul & Jalur Evakuasi' },
] as const;

export type FormTypeValue = typeof FORM_TYPES[number]['value'];

// ============================================
// FORM CONFIG MAPPING
// ============================================

const FORM_CONFIGS: Record<string, FormConfig> = {
  'All Category': {
    type: 'All',
    label: 'Semua Kategori',
    slug: 'all',
    analyticsEndpoint: '/analytics',
    historyEndpoint: '/apar/history',
  },
  'APAR': {
    type: 'APAR',
    label: 'APAR Inspection',
    slug: 'apar',
    analyticsEndpoint: '/analytics',
    historyEndpoint: '/apar/history',
  },
  'Fire Alarm': {
    type: 'Fire Alarm',
    label: 'Fire Alarm Inspection',
    slug: 'fire-alarm',
    analyticsEndpoint: '/analytics',
    historyEndpoint: '/fire-alarm/history',
  },
  'Emergency Lamp': {
    type: 'Emergency Lamp',
    label: 'Emergency Lamp Inspection',
    slug: 'emergency-lamp',
    analyticsEndpoint: '/analytics',
    historyEndpoint: '/emergency-lamp/history',
  },
  'APD': {
    type: 'APD',
    label: 'APD Distribution',
    slug: 'apd',
    analyticsEndpoint: '/analytics',
    historyEndpoint: '/apd/history',
  },
  'Toilet': {
    type: 'Toilet',
    label: 'Toilet Inspection',
    slug: 'toilet',
    analyticsEndpoint: '/analytics',
    historyEndpoint: '/toilet-inspections/history',
  },
  'Electrical': {
    type: 'Electrical',
    label: 'Electrical Installation',
    slug: 'electrical',
    analyticsEndpoint: '/analytics',
    historyEndpoint: '/electrical_inspections',
  },
  'Lift Barang - Inspeksi': {
    type: 'Lift Barang - Inspeksi',
    label: 'Lift Barang - Inspeksi 3 Bulan',
    slug: 'lift-barang',
    inspectionType: 'inspeksi',
    analyticsEndpoint: '/analytics',
    historyEndpoint: '/lift-barang/inspeksi/history',
  },
  'Lift Barang - Preventive': {
    type: 'Lift Barang - Preventive',
    label: 'Lift Barang - Preventive Maintenance',
    slug: 'lift-barang',
    inspectionType: 'preventive',
    analyticsEndpoint: '/analytics',
    historyEndpoint: '/lift-barang/preventive/history',
  },
  // ✅ Exit Lamp
  'Exit Lamp': {
    type: 'Exit Lamp',
    label: 'Exit Lamp & Titik Kumpul',
    slug: 'exit-lamp',
    analyticsEndpoint: '/analytics',
    historyEndpoint: '/exit-lamp/history',
  },
  
  // ✅ Pintu Darurat
  'Pintu Darurat': {
    type: 'Pintu Darurat',
    label: 'Pintu Darurat',
    slug: 'pintu-darurat',
    analyticsEndpoint: '/analytics',
    historyEndpoint: '/pintu-darurat/history',
  },
  
  // ✅ Titik Kumpul
  'Titik Kumpul': {
    type: 'Titik Kumpul',
    label: 'Titik Kumpul & Jalur Evakuasi',
    slug: 'titik-kumpul',
    analyticsEndpoint: '/analytics',
    historyEndpoint: '/titik-kumpul/history',
  },
};


// ============================================
// CONSTANTS - ✅ FIX 2: Declare only ONCE
// ============================================

export const FORMS_WITH_AREA_FILTER = [
  'APAR',
  'Fire Alarm', 
  'Emergency Lamp',
  'Toilet',
  'Electrical',
  'Lift Barang - Inspeksi',
  'Lift Barang - Preventive',
] as const;

export const ANALYTICS_PERIODS = [
  { value: 'daily', label: 'Harian' },
  { value: 'weekly', label: 'Mingguan' },
  { value: 'monthly', label: 'Bulanan' },
] as const;

export const HISTORY_LIMITS = [10, 20, 50, 100] as const;

// ============================================
// PUBLIC FUNCTIONS
// ============================================

export function getFormConfig(formType: string): FormConfig | null {
  const config = FORM_CONFIGS[formType];
  
  if (!config) {
    console.warn(`⚠️ Form config not found for type: "${formType}"`);
    return null;
  }
  
  return { ...config };
}

// ✅ FIX 3: Return type should be Record<string, string> for compatibility
export function buildAnalyticsParams(
  config: FormConfig,
  options: {
    period: string;
    dateFrom: string;
    dateTo: string;
    area?: string;
  }
): Record<string, string> {  // ✅ Change return type to Record<string, string>
  const params: Record<string, string> = {
    slug: config.slug,
    dateFrom: options.dateFrom,
    dateTo: options.dateTo,
    period: options.period,
  };
  
  if (config.inspectionType) {
    params.inspectionType = config.inspectionType;
    console.log(`🔧 [Config] Added inspectionType: ${config.inspectionType} for slug: ${config.slug}`);
  }
  
  if (options.area && options.area !== 'All Category' && options.area !== 'Semua Kategori') {
    const areaParamMap: Record<string, string> = {
      'fire-alarm': 'zona',
      'apd': 'jenis_apd',
      'toilet': 'area_code',
      'electrical': 'area',
      'apar': 'area',
      'emergency-lamp': 'area',
      'lift-barang': 'area',
    };
    
    const paramName = areaParamMap[config.slug] || 'area';
    params[paramName] = options.area;
    console.log(`🔧 [Config] Added area filter: ${paramName}=${options.area}`);
  }
  
  if (config.buildCustomParams && typeof config.buildCustomParams === 'function') {
    return config.buildCustomParams(params, options);
  }
  
  console.log(`🔧 [Config] Final params for ${config.slug}:`, params);
  return params;
}

export function buildHistoryUrl(
  config: FormConfig,
  options?: {
    area?: string;
    limit?: number;
    page?: number;
  }
): string {
  const params = new URLSearchParams();
  
  if (options?.limit) {
    params.append('limit', options.limit.toString());
  }
  
  if (options?.page) {
    params.append('page', options.page.toString());
  }
  
  if (options?.area && options.area !== 'All Category' && options.area !== 'Semua Kategori') {
    const areaParamMap: Record<string, string> = {
      'fire-alarm': 'zona',
      'apd': 'jenis_apd',
      'toilet': 'area_code',
    };
    const paramName = areaParamMap[config.slug] || 'area';
    params.append(paramName, options.area);
  }
  
  if (config.inspectionType && config.slug === 'lift-barang') {
    params.append('inspectionType', config.inspectionType);
  }
  
  const queryString = params.toString();
  return `/api${config.historyEndpoint}${queryString ? `?${queryString}` : ''}`;
}

export function requiresInspectionType(formType: string): boolean {
  const config = getFormConfig(formType);
  return !!config?.inspectionType;
}

export function getFormsBySlug(slug: string): FormConfig[] {
  return Object.values(FORM_CONFIGS).filter(config => config.slug === slug);
}

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
  FORM_TYPES,
  getFormConfig,
  buildAnalyticsParams,
  buildHistoryUrl,
  requiresInspectionType,
  getFormsBySlug,
};