// ==============================================================================
// HIPOTECALY: Framework de Medición de Consumo y Usage Metering por Tenant
// ==============================================================================

export type MetricType =
  | 'active_cases'
  | 'user_seats'
  | 'ai_calls'
  | 'document_analyses'
  | 'property_valuations'
  | 'storage_mb'
  | 'api_calls'
  | 'notifications_sent';

export interface TenantUsageSummary {
  tenantId: string;
  period: string; // YYYY-MM
  activeCases: number;
  userSeats: number;
  aiCalls: number;
  documentAnalyses: number;
  propertyValuations: number;
  storageMb: number;
  apiCalls: number;
  notificationsSent: number;
  lastUpdated: string;
}

const tenantUsageStore = new Map<string, TenantUsageSummary>();

export async function getTenantUsage(tenantId: string): Promise<TenantUsageSummary> {
  const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM
  const key = `${tenantId}_${currentPeriod}`;

  if (tenantUsageStore.has(key)) {
    return tenantUsageStore.get(key)!;
  }

  // Fallback / Initial usage
  const initial: TenantUsageSummary = {
    tenantId,
    period: currentPeriod,
    activeCases: 4,
    userSeats: 2,
    aiCalls: 12,
    documentAnalyses: 8,
    propertyValuations: 3,
    storageMb: 145.2,
    apiCalls: 0,
    notificationsSent: 26,
    lastUpdated: new Date().toISOString(),
  };

  tenantUsageStore.set(key, initial);
  return initial;
}

export async function recordMetricEvent(
  tenantId: string,
  metric: MetricType,
  increment: number = 1
): Promise<TenantUsageSummary> {
  const usage = await getTenantUsage(tenantId);
  const currentPeriod = usage.period;
  const key = `${tenantId}_${currentPeriod}`;

  switch (metric) {
    case 'active_cases':
      usage.activeCases += increment;
      break;
    case 'user_seats':
      usage.userSeats += increment;
      break;
    case 'ai_calls':
      usage.aiCalls += increment;
      break;
    case 'document_analyses':
      usage.documentAnalyses += increment;
      break;
    case 'property_valuations':
      usage.propertyValuations += increment;
      break;
    case 'storage_mb':
      usage.storageMb += increment;
      break;
    case 'api_calls':
      usage.apiCalls += increment;
      break;
    case 'notifications_sent':
      usage.notificationsSent += increment;
      break;
  }

  usage.lastUpdated = new Date().toISOString();
  tenantUsageStore.set(key, usage);
  return usage;
}
