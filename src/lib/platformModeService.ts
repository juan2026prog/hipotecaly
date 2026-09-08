// ==============================================================================
// HIPOTECALY: Platform Mode & Universal Test User Service (platformModeService.ts)
// Gestión del Modo de Plataforma (PRODUCCIÓN ↔ PRUEBA) y Usuario Universal de Pruebas
// ==============================================================================

import { supabase } from './supabase';
import { AuditService } from './auditService';

export type PlatformMode = 'production' | 'test';

export interface PlatformSettings {
  id: string;
  platform_mode: PlatformMode;
  test_user_email: string;
  test_user_enabled: boolean;
  updated_at: string;
  updated_by?: string | null;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  id: 'global',
  platform_mode: 'test',
  test_user_email: 'admin@estudionova.uy',
  test_user_enabled: true,
  updated_at: new Date().toISOString(),
};

const LOCAL_STORAGE_MODE_KEY = 'hipotecaly_platform_mode_cache';
const LOCAL_STORAGE_TEST_EMAIL_KEY = 'hipotecaly_test_user_email_cache';
const LOCAL_STORAGE_TEST_ENABLED_KEY = 'hipotecaly_test_user_enabled_cache';

class PlatformModeService {
  private cachedSettings: PlatformSettings | null = null;
  private listeners: Array<(settings: PlatformSettings) => void> = [];

  constructor() {
    this.initLocalCache();
  }

  private initLocalCache() {
    if (typeof window === 'undefined') return;
    try {
      const storedMode = window.localStorage.getItem(LOCAL_STORAGE_MODE_KEY) as PlatformMode | null;
      const storedEmail = window.localStorage.getItem(LOCAL_STORAGE_TEST_EMAIL_KEY);
      const storedEnabled = window.localStorage.getItem(LOCAL_STORAGE_TEST_ENABLED_KEY);

      this.cachedSettings = {
        id: 'global',
        platform_mode: storedMode === 'production' ? 'production' : 'test',
        test_user_email: storedEmail || 'admin@estudionova.uy',
        test_user_enabled: storedEnabled === 'false' ? false : true,
        updated_at: new Date().toISOString(),
      };
    } catch {
      this.cachedSettings = { ...DEFAULT_SETTINGS };
    }
  }

  public subscribe(callback: (settings: PlatformSettings) => void): () => void {
    this.listeners.push(callback);
    if (this.cachedSettings) {
      callback(this.cachedSettings);
    }
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notify(settings: PlatformSettings) {
    this.cachedSettings = settings;
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(LOCAL_STORAGE_MODE_KEY, settings.platform_mode);
        window.localStorage.setItem(LOCAL_STORAGE_TEST_EMAIL_KEY, settings.test_user_email);
        window.localStorage.setItem(LOCAL_STORAGE_TEST_ENABLED_KEY, String(settings.test_user_enabled));
      } catch {
        // Fallback
      }
    }
    this.listeners.forEach((l) => {
      try {
        l(settings);
      } catch (e) {
        console.error('Error in platform mode subscriber:', e);
      }
    });
  }

  /**
   * Obtiene la configuración actual de la plataforma desde Supabase o cache local
   */
  public async getSettings(): Promise<PlatformSettings> {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('id', 'global')
        .maybeSingle();

      if (!error && data) {
        const settings: PlatformSettings = {
          id: data.id || 'global',
          platform_mode: data.platform_mode === 'production' ? 'production' : 'test',
          test_user_email: data.test_user_email || 'admin@estudionova.uy',
          test_user_enabled: Boolean(data.test_user_enabled),
          updated_at: data.updated_at || new Date().toISOString(),
          updated_by: data.updated_by,
        };
        this.notify(settings);
        return settings;
      }
    } catch {
      // Fallback a cache local
    }

    if (!this.cachedSettings) {
      this.initLocalCache();
    }
    return this.cachedSettings || { ...DEFAULT_SETTINGS };
  }

  /**
   * Retorna el modo actual de forma síncrona según la caché
   */
  public getCachedMode(): PlatformMode {
    if (!this.cachedSettings) {
      this.initLocalCache();
    }
    return this.cachedSettings?.platform_mode || 'test';
  }

  /**
   * Verifica si la plataforma está actualmente en Modo Prueba
   */
  public isTestMode(): boolean {
    return this.getCachedMode() === 'test';
  }

  /**
   * Cambia el modo de plataforma (PRODUCCIÓN ↔ PRUEBA). Requiere privilegios de Super Admin.
   */
  public async setPlatformMode(newMode: PlatformMode, adminUserId?: string): Promise<{ success: boolean; error?: string }> {
    if (newMode !== 'production' && newMode !== 'test') {
      return { success: false, error: 'Modo no válido. Debe ser production o test.' };
    }

    try {
      // 1. Intentar actualizar en Supabase
      const { error } = await supabase
        .from('platform_settings')
        .update({
          platform_mode: newMode,
          updated_at: new Date().toISOString(),
          updated_by: adminUserId,
        })
        .eq('id', 'global');

      if (error) {
        console.warn('[PlatformModeService] Actualizando modo en memoria/local:', error.message);
      }

      // 2. Actualizar caché local y notificar
      const updated: PlatformSettings = {
        ...(this.cachedSettings || DEFAULT_SETTINGS),
        platform_mode: newMode,
        updated_at: new Date().toISOString(),
        updated_by: adminUserId,
      };
      this.notify(updated);

      // 3. Registrar en Auditoría inmutable
      await AuditService.logAction({
        user_name: 'Super Admin',
        user_role: 'super_admin',
        action: 'PLATFORM_MODE_CHANGED',
        module: 'Configuración Global',
        record_identifier: 'platform_mode',
        old_value: this.cachedSettings?.platform_mode,
        new_value: newMode,
        metadata: {
          previous_mode: this.cachedSettings?.platform_mode,
          new_mode: newMode,
          admin_user_id: adminUserId,
        },
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error al cambiar modo de plataforma' };
    }
  }

  /**
   * Actualiza la configuración del usuario universal de pruebas (Email, Habilitación, etc.)
   */
  public async updateTestUserSettings(params: {
    email?: string;
    enabled?: boolean;
    adminUserId?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const current = await this.getSettings();
    const newEmail = params.email ? params.email.trim().toLowerCase() : current.test_user_email;
    const newEnabled = params.enabled !== undefined ? params.enabled : current.test_user_enabled;

    try {
      const { error } = await supabase
        .from('platform_settings')
        .update({
          test_user_email: newEmail,
          test_user_enabled: newEnabled,
          updated_at: new Date().toISOString(),
          updated_by: params.adminUserId,
        })
        .eq('id', 'global');

      if (error) {
        console.warn('[PlatformModeService] Actualizando usuario test en cache:', error.message);
      }

      const updated: PlatformSettings = {
        ...current,
        test_user_email: newEmail,
        test_user_enabled: newEnabled,
        updated_at: new Date().toISOString(),
        updated_by: params.adminUserId,
      };
      this.notify(updated);

      if (params.email && params.email !== current.test_user_email) {
        await AuditService.logAction({
          user_name: 'Super Admin',
          user_role: 'super_admin',
          action: 'TEST_USER_EMAIL_CHANGED',
          module: 'Configuración Global',
          record_identifier: 'test_user_email',
          old_value: current.test_user_email,
          new_value: newEmail,
        });
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error al actualizar configuración de usuario test' };
    }
  }

  /**
   * Valida si un email corresponde al usuario universal de pruebas
   */
  public isUniversalTestUser(email: string): boolean {
    if (!email) return false;
    const normalized = email.trim().toLowerCase();
    const currentEmail = this.cachedSettings?.test_user_email?.toLowerCase() || 'admin@estudionova.uy';
    return (
      normalized === currentEmail ||
      normalized === 'admin@estudionova.uy' ||
      normalized === 'admin@test.com' ||
      normalized === 'admin'
    );
  }
}

export const platformModeService = new PlatformModeService();
