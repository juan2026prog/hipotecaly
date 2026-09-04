// ==============================================================================
// HIPOTECALY: Billing, Metering & Subscriptions Engine (Enterprise SaaS)
// ==============================================================================

import { SAAS_PLANS } from './pricingEngine';
import { SAAS_MODULE_CATALOG } from './moduleCatalogService';
import { supabaseAdmin } from '../../server/supabase';

export type TaxConfigurationStatus = 'NOT_CONFIGURED' | 'EXEMPT_APPROVED' | 'STANDARD_IVA_22';

export interface TenantSubscription {
  tenantId: string;
  planId: 'start' | 'professional' | 'platform' | 'enterprise' | 'unassigned' | 'trial';
  billingCycle: 'monthly' | 'annual';
  status: 'active' | 'trial' | 'unassigned' | 'past_due' | 'canceled';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  activeAddons: string[];
  isProvisionalPricing: boolean;
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
  taxStatus: TaxConfigurationStatus;
  taxUsd?: number; // No inventar IVA 0%. Si no está configurado, es undefined
  totalUsd: number;
  currency: 'USD' | 'UYU';
  paymentMethod: 'bank_transfer_manual' | 'institutional_invoice' | 'gateway_automated';
  paymentProcessingMode: 'MANUAL_RECONCILIATION' | 'GATEWAY_PENDING';
  isProvisionalPricing: boolean;
  paidAt?: string;
}

// ------------------------------------------------------------------------------
// CATÁLOGO DE TARIFAS DE REFERENCIA (ESTIMADAS / NO APROBADAS COMERCIALMENTE)
// ------------------------------------------------------------------------------

export const PROVISIONAL_PRICING_NOTICE =
  'TARIFAS DE REFERENCIA PROVISIONALES (NO APROBADAS OFICIALMENTE). El modelo de monetización y pricing final está sujeto a aprobación por la dirección comercial de HIPOTECALY.';

export const PROVISIONAL_PLAN_PRICES_USD: Record<string, { monthly: number; annualMonthly: number }> = {
  start: { monthly: 149, annualMonthly: 119 },
  professional: { monthly: 349, annualMonthly: 279 },
  platform: { monthly: 799, annualMonthly: 639 },
  enterprise: { monthly: 1800, annualMonthly: 1440 },
};

export const PROVISIONAL_ADDON_PRICES_USD: Record<string, number> = {
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
// SERVICIO DE SUSCRIPCIONES Y FACTURACIÓN CON PERSISTENCIA
// ------------------------------------------------------------------------------

export class BillingService {
  private static subscriptions: Map<string, TenantSubscription> = new Map();
  private static invoices: TenantInvoice[] = [];

  /**
   * Obtiene la suscripción de un tenant.
   * Si no tiene suscripción previa, devuelve estado explícito 'unassigned' o 'trial' sin regalar add-ons.
   */
  public static getSubscription(tenantId: string): TenantSubscription {
    if (this.subscriptions.has(tenantId)) {
      return this.subscriptions.get(tenantId)!;
    }

    // Estado explícito inicial sin plan de pago ni add-ons ficticios auto-asignados
    const initialSub: TenantSubscription = {
      tenantId,
      planId: 'trial',
      billingCycle: 'monthly',
      status: 'trial',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      activeAddons: [], // Cero add-ons por defecto
      isProvisionalPricing: true,
    };

    this.subscriptions.set(tenantId, initialSub);
    return initialSub;
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
   * Genera el estado de cuenta pro-forma para un tenant respetando:
   * - Precios marcados como provisionales.
   * - Estado fiscal 'NOT_CONFIGURED' (sin asumir IVA 0% ni inventar exoneraciones).
   * - Método de pago manual (no afirmar procesamiento automático si es manual).
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
    const planIdKey = sub.planId === 'trial' || sub.planId === 'unassigned' ? 'start' : sub.planId;
    const plan = SAAS_PLANS.find((p) => p.id === planIdKey) || SAAS_PLANS[0];
    const prices = PROVISIONAL_PLAN_PRICES_USD[planIdKey] || PROVISIONAL_PLAN_PRICES_USD.start;
    const baseRate = sub.billingCycle === 'annual' ? prices.annualMonthly : prices.monthly;

    const lineItems: InvoiceLineItem[] = [
      {
        description: `Plan HIPOTECALY ${plan.name} (${sub.billingCycle === 'annual' ? 'Facturación Anual' : 'Mensual'}) [Tarifa Provisoria]`,
        quantity: 1,
        unitPriceUsd: baseRate,
        totalUsd: baseRate,
      },
    ];

    // Add-ons formalmente contratados por el tenant
    for (const addonId of sub.activeAddons) {
      const addonModule = SAAS_MODULE_CATALOG.find((m) => m.id === addonId);
      const addonPrice = PROVISIONAL_ADDON_PRICES_USD[addonId] || 99;
      lineItems.push({
        description: `Add-On: ${addonModule ? addonModule.name : addonId} [Tarifa Provisoria]`,
        quantity: 1,
        unitPriceUsd: addonPrice,
        totalUsd: addonPrice,
      });
    }

    // Excedentes de uso (overages)
    if (meteredOverages?.extraCasesCount && meteredOverages.extraCasesCount > 0) {
      const unitCaseCost = 15; // Tarifa referencial
      lineItems.push({
        description: `Expedientes activos excedentes de cuota`,
        quantity: meteredOverages.extraCasesCount,
        unitPriceUsd: unitCaseCost,
        totalUsd: meteredOverages.extraCasesCount * unitCaseCost,
      });
    }

    if (meteredOverages?.extraAiUnitsCount && meteredOverages.extraAiUnitsCount > 0) {
      const unitAiCost = 10;
      lineItems.push({
        description: `Unidades CASO AI adicionales consumidas`,
        quantity: meteredOverages.extraAiUnitsCount,
        unitPriceUsd: unitAiCost,
        totalUsd: meteredOverages.extraAiUnitsCount * unitAiCost,
      });
    }

    const subtotalUsd = lineItems.reduce((acc, item) => acc + item.totalUsd, 0);

    // TRATAMIENTO FISCAL: NO asumir IVA 0% ni inventar exoneración.
    // Marcar taxStatus como NOT_CONFIGURED.
    const taxStatus: TaxConfigurationStatus = 'NOT_CONFIGURED';
    const totalUsd = subtotalUsd;

    const invoiceNumber = `PROV-INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

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
      taxStatus,
      taxUsd: undefined, // No inventar impuesto hasta que el admin fiscal lo configure
      totalUsd,
      currency: 'USD',
      paymentMethod: 'bank_transfer_manual',
      paymentProcessingMode: 'MANUAL_RECONCILIATION',
      isProvisionalPricing: true,
    };

    // Intentar persistir en Supabase
    void supabaseAdmin.from('tenant_invoices').insert({
      id: invoice.id,
      tenant_id: tenantId,
      invoice_number: invoice.invoiceNumber,
      period_start: invoice.issueDate,
      period_end: invoice.dueDate,
      status: invoice.status,
      plan_code: planIdKey,
      subtotal_usd: invoice.subtotalUsd,
      total_usd: invoice.totalUsd,
      payment_method: invoice.paymentMethod,
      line_items: invoice.lineItems,
    });

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
   * Conciliación manual de cobro
   */
  public static markInvoicePaid(invoiceId: string): boolean {
    const inv = this.invoices.find((i) => i.id === invoiceId);
    if (inv) {
      inv.status = 'paid';
      inv.paidAt = new Date().toISOString();

      try {
        supabaseAdmin
          .from('tenant_invoices')
          .update({ status: 'paid', paid_at: inv.paidAt })
          .eq('id', invoiceId);
      } catch {
        // Fallback
      }

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
