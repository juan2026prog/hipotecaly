// ==============================================================================
// HIPOTECALY: QA Action Guard
// Intercepta acciones con efectos externos irreversibles (cobros, WhatsApps, firmas notariales)
// cuando se opera con una sesión QA
// ==============================================================================

import { adminQaService } from './adminQaService';

export interface GuardedActionResult<T = any> {
  allowed: boolean;
  executed: boolean;
  message?: string;
  result?: T;
}

export class QaActionGuard {
  /**
   * Verifica si la sesión actual corresponde a un usuario QA
   */
  public static isQaSession(user?: any): boolean {
    if (user?.app_metadata?.is_qa_user || user?.user_metadata?.is_qa_user) {
      return true;
    }
    return adminQaService.isQaActive();
  }

  /**
   * Ejecuta una acción externa solo si NO se está en sesión QA.
   * Si es sesión QA, muestra notificación preventiva y retorna de forma segura.
   */
  public static async executeExternalAction<T>(
    actionName: string,
    actionFn: () => Promise<T>,
    options?: {
      onBlockedNotice?: (msg: string) => void;
      mockFallbackResult?: T;
    }
  ): Promise<GuardedActionResult<T>> {
    if (this.isQaSession()) {
      const notice = `Acción no ejecutada porque estás utilizando una sesión QA (${actionName}).`;
      
      if (options?.onBlockedNotice) {
        options.onBlockedNotice(notice);
      } else if (typeof window !== 'undefined') {
        // Notificación estándar
        console.warn(`[QA GUARD INTERCEPT]: ${notice}`);
      }

      return {
        allowed: false,
        executed: false,
        message: notice,
        result: options?.mockFallbackResult,
      };
    }

    const res = await actionFn();
    return {
      allowed: true,
      executed: true,
      result: res,
    };
  }
}
