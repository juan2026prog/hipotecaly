// ==============================================================================
// HIPOTECALY: Billing, Metering & Subscriptions Engine (Enterprise SaaS)
// ==============================================================================

import { SAAS_PLANS } from './pricingEngine';
import { SAAS_MODULE_CATALOG } from './moduleCatalogService';

export interface TenantSubscription {
  tenantId: string;
  planId: 'start' | 'professional' | 'platform' | 'enterprise';
  billingCycle: 'monthly' | 'annual';
  status: 'active' | 'past_due' | 'canceled';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  activeAddons: string[];
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPriceUsd: number;
  totalUsd: number;
}

export interface TenantInvoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  planName: string;
  lineItems: InvoiceLineItem[];
  subtotalUsd: number;
  taxUsd: number;
  totalUsd: number;
  currency: 'USD' | 'UYU';
  paymentMethod: 'bank_transfer_uy' | 'card_online' | 'institutional_invoice';
  paidAt?: string;
}

// ------------------------------------------------------------------------------
// CATÁLOGO DE TARIFAS BASE DE REFERENCIA
// ------------------------------------------------------------------------------

export const PLAN_BASE_PRICES_USD: Record<string, { monthly: number; annualMonthly: number }> = {
  start: { monthly: 149, annualMonthly: 119 },
  professional: { monthly: 349, annualMonthly: 279 },
  platform: { monthly: 799, annualMonthly: 639 },
  enterprise: { monthly: 1800, annualMonthly: 1440 },
};

export const ADDON_PRICES_USD: Record<string, number> = {
  capital_syndication: 149,
  docs_ai_intelligence: 199,
  risk_ai_consistency: 199,
  valuation_appraisal_network: 99,
  servicing_loan_management: 199,
  servicing_payment_reconciliation: 99,
  whitelabel_custom_domain: 149,
  analytics_advanced_reporting: 149,
};

// ------------------------------------------------------------------------------
// SERVICIO DE SUSCRIPCIONES Y FACTURACIÓN
// ------------------------------------------------------------------------------

export class BillingService {
  private static subscriptions: Map<string, TenantSubscription> = new Map();
  private static invoices: TenantInvoice[] = [];

  /**
   * Obtiene o inicializa la suscripción activa de un tenant
   */
  public static getSubscription(tenantId: string): TenantSubscription {
    if (this.subscriptions.has(tenantId)) {
      return this.subscriptions.get(tenantId)!;
    }

    // Default: Professional mensual
    const defaultSub: TenantSubscription = {
      tenantId,
      planId: 'professional',
      billingCycle: 'monthly',
      status: 'active',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      activeAddons: ['capital_syndication'],
    };

    this.subscriptions.set(tenantId, defaultSub);
    return defaultSub;
  }

  /**
   * Actualiza el plan o ciclo de facturación de un tenant
   */
  public static updateSubscription(
    tenantId: string,
    updates: Partial<Pick<TenantSubscription, 'planId' | 'billingCycle' | 'activeAddons' | 'status'>>
  ): TenantSubscription {
    const sub = this.getSubscription(tenantId);
    const updated: TenantSubscription = {
      ...sub,
      ...updates,
    };
    this.subscriptions.set(tenantId, updated);
    return updated;
  }

  /**
   * Genera el estado de cuenta y factura pro-forma periódica para un tenant
   */
  public static generatePeriodInvoice(
    tenantId: string,
    meteredOverages?: {
      extraCasesCount?: number;
      extraUsersCount?: number;
      extraAiUnitsCount?: number;
    }
  ): TenantInvoice {
    const sub = this.getSubscription(tenantId);
    const plan = SAAS_PLANS.find((p) => p.id === sub.planId) || SAAS_PLANS[1];
    const prices = PLAN_BASE_PRICES_USD[sub.planId] || PLAN_BASE_PRICES_USD.professional;
    const baseRate = sub.billingCycle === 'annual' ? prices.annualMonthly : prices.monthly;

    const lineItems: InvoiceLineItem[] = [
      {
        description: `Plan HIPOTECALY ${plan.name} (${sub.billingCycle === 'annual' ? 'Facturación Anual' : 'Mensual'})`,
        quantity: 1,
        unitPriceUsd: baseRate,
        totalUsd: baseRate,
      },
    ];

    // Add-ons contratados
    for (const addonId of sub.activeAddons) {
      const addonModule = SAAS_MODULE_CATALOG.find((m) => m.id === addonId);
      const addonPrice = ADDON_PRICES_USD[addonId] || 99;
      lineItems.push({
        description: `Add-On: ${addonModule ? addonModule.name : addonId}`,
        quantity: 1,
        unitPriceUsd: addonPrice,
        totalUsd: addonPrice,
      });
    }

    // Excedentes de uso (overages)
    if (meteredOverages?.extraCasesCount && meteredOverages.extraCasesCount > 0) {
      const unitCaseCost = 15; // USD 15 por expediente excedente
      lineItems.push({
        description: `Expedientes activos excedentes de cuota`,
        quantity: meteredOverages.extraCasesCount,
        unitPriceUsd: unitCaseCost,
        totalUsd: meteredOverages.extraCasesCount * unitCaseCost,
      });
    }

    if (meteredOverages?.extraAiUnitsCount && meteredOverages.extraAiUnitsCount > 0) {
      const unitAiCost = 10; // USD 10 por unidad CASO AI excedente
      lineItems.push({
        description: `Unidades CASO AI adicionales consumidas`,
        quantity: meteredOverages.extraAiUnitsCount,
        unitPriceUsd: unitAiCost,
        totalUsd: meteredOverages.extraAiUnitsCount * unitAiCost,
      });
    }

    const subtotalUsd = lineItems.reduce((acc, item) => acc + item.totalUsd, 0);
    const taxUsd = 0; // Exoneración / B2B Exportación de software
    const totalUsd = subtotalUsd + taxUsd;

    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const invoice: TenantInvoice = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tenantId,
      invoiceNumber,
      issueDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      planName: plan.name,
      lineItems,
      subtotalUsd,
      taxUsd,
      totalUsd,
      currency: 'USD',
      paymentMethod: 'bank_transfer_uy',
    };

    this.invoices.unshift(invoice);
    return invoice;
  }

  /**
   * Obtiene el listado de facturas emitidas para un tenant
   */
  public static getInvoices(tenantId: string): TenantInvoice[] {
    return this.invoices.filter((i) => i.tenantId === tenantId);
  }

  /**
   * Concilia y marca una factura como pagada
   */
  public static markInvoicePaid(invoiceId: string): boolean {
    const inv = this.invoices.find((i) => i.id === invoiceId);
    if (inv) {
      inv.status = 'paid';
      inv.paidAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  /**
   * Resetea almacén para tests
   */
  public static resetStore(): void {
    this.subscriptions.clear();
    this.invoices = [];
  }
}
