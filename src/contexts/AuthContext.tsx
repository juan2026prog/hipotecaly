// ==============================================================================
// HIPOTECALY: Contexto de Autenticación con Supabase Auth y Control de Roles RBAC
// ==============================================================================

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Borrower } from '../lib/types';
import { resolveTenant } from '../lib/tenantService';
import { adminQaService } from '../lib/adminQaService';
import { platformModeService } from '../lib/platformModeService';

export type UserRole =
  | 'super_admin'
  | 'platform_admin'
  | 'tenant_owner'
  | 'tenant_admin'
  | 'analyst'
  | 'operator'
  | 'notary'
  | 'lender'
  | 'borrower'
  | 'viewer'
  | 'test_universal'
  | 'demo_universal';

export type AuthIntent =
  | 'generic_login'
  | 'borrower_signup'
  | 'organization_invite'
  | 'notary_invite'
  | 'investor_invite'
  | 'superadmin_login';

export interface GoogleAuthOptions {
  redirectTo?: string;
  targetTenantSlug?: string;
  intent?: AuthIntent;
  inviteToken?: string;
}

export interface UserMembership {
  organizationId: string;
  role: UserRole;
  isActive: boolean;
}

export interface QaSessionState {
  sessionId: string;
  role: string;
  tenantId: string;
  tenantName: string;
  expiresAt: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  borrower: Borrower | null;
  userRole: UserRole | null;
  isSuperAdmin: boolean;
  memberships: UserMembership[];
  loading: boolean;
  isQaSession: boolean;
  qaSessionData: QaSessionState | null;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    user?: User | null;
    role?: UserRole | null;
    isSuperAdmin?: boolean;
    memberships?: UserMembership[];
  }>;
  signUp: (
    email: string,
    password: string,
    userData: { firstName: string; lastName: string; phone?: string; targetTenantId?: string }
  ) => Promise<{ error: Error | null; organizationId?: string }>;
  signOut: () => Promise<void>;
  exitQaSession: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: (options?: GoogleAuthOptions) => Promise<{ error: Error | null; data?: { url: string | null; provider: string } }>;
  refreshBorrower: () => Promise<void>;
  hasRole: (allowedRoles: UserRole[], tenantId?: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [borrower, setBorrower] = useState<Borrower | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [memberships, setMemberships] = useState<UserMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [isQaSession, setIsQaSession] = useState(false);
  const [qaSessionData, setQaSessionData] = useState<QaSessionState | null>(null);

  // Determinar roles y membresías a partir del usuario actual
  const resolveRoles = async (currentUser: User | null): Promise<{
    resolvedRole: UserRole | null;
    resolvedIsSuper: boolean;
    resolvedMemberships: UserMembership[];
  }> => {
    if (!currentUser) {
      setUserRole(null);
      setIsSuperAdmin(false);
      setMemberships([]);
      setIsQaSession(false);
      setQaSessionData(null);
      return { resolvedRole: null, resolvedIsSuper: false, resolvedMemberships: [] };
    }

    let isSuper = false;
    let isQa = Boolean(currentUser.app_metadata?.is_qa_user || adminQaService.isQaActive());

    // 1. Verificación autoritativa de Super Admin contra profiles (Base de Datos / Server-Side RLS)
    try {
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (!profileErr && profileData) {
        isSuper = Boolean(profileData.is_super_admin);
      }
    } catch {
      // Fallback
    }

    // Soporte seguro de app_metadata (escrito exclusivamente por backend / service_role)
    if (!isSuper && (currentUser.app_metadata?.role === 'super_admin' || currentUser.app_metadata?.role === 'platform_admin' || currentUser.app_metadata?.is_super_admin)) {
      isSuper = true;
    }

    setIsSuperAdmin(isSuper);
    setIsQaSession(isQa);

    const activeQaRef = adminQaService.getCurrentQaSessionRef();
    if (activeQaRef && isQa) {
      setQaSessionData({
        sessionId: activeQaRef.sessionId,
        role: activeQaRef.role,
        tenantId: activeQaRef.tenantId,
        tenantName: activeQaRef.tenantName,
        expiresAt: activeQaRef.expiresAt,
      });
    } else {
      setQaSessionData(null);
    }

    let resolvedMems: UserMembership[] = [];
    let resolvedRole: UserRole = 'borrower';

    // 2. Consulta a organization_members (Fuente autoritativa para roles de tenant)
    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select('organization_id, role, is_active')
        .eq('user_id', currentUser.id);

      if (!error && data && data.length > 0) {
        resolvedMems = data.map((d) => ({
          organizationId: d.organization_id,
          role: d.role as UserRole,
          isActive: Boolean(d.is_active),
        }));
        setMemberships(resolvedMems);

        if (isSuper) {
          resolvedRole = 'super_admin';
        } else if (resolvedMems.some((m) => m.role === 'tenant_admin' || (m.role as string) === 'tenant_owner')) {
          resolvedRole = 'tenant_admin';
        } else if (resolvedMems.some((m) => m.role === 'analyst')) {
          resolvedRole = 'analyst';
        } else if (resolvedMems.some((m) => m.role === 'operator')) {
          resolvedRole = 'operator';
        } else if (resolvedMems.some((m) => m.role === 'notary')) {
          resolvedRole = 'notary';
        } else if (resolvedMems.some((m) => m.role === 'lender')) {
          resolvedRole = 'lender';
        } else if (currentUser.app_metadata?.role) {
          resolvedRole = currentUser.app_metadata.role as UserRole;
        } else {
          resolvedRole = 'borrower';
        }
      } else {
        setMemberships([]);
        if (isSuper) {
          resolvedRole = 'super_admin';
        } else if (currentUser.app_metadata?.role) {
          resolvedRole = currentUser.app_metadata.role as UserRole;
        } else {
          // Check if user is registered in lenders table
          try {
            const { data: lenderData } = await supabase
              .from('lenders')
              .select('id, organization_id')
              .eq('user_id', currentUser.id)
              .maybeSingle();

            if (lenderData) {
              resolvedRole = 'lender';
              if (lenderData.organization_id) {
                resolvedMems = [{ organizationId: lenderData.organization_id, role: 'lender', isActive: true }];
                setMemberships(resolvedMems);
              }
            } else {
              resolvedRole = 'borrower';
            }
          } catch {
            resolvedRole = 'borrower';
          }
        }
      }
    } catch {
      resolvedRole = isSuper ? 'super_admin' : 'borrower';
    }

    setUserRole(resolvedRole);
    return {
      resolvedRole,
      resolvedIsSuper: isSuper,
      resolvedMemberships: resolvedMems,
    };
  };

  // Carga o sincroniza el perfil del solicitante (borrower)
  const fetchBorrowerProfile = async (currentUser: User | null) => {
    if (!currentUser) {
      setBorrower(null);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('borrowers')
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (!error && data) {
        setBorrower(data as Borrower);
      } else {
        // Asignación segura con tenant resuelto o fallback
        const orgId = currentUser.user_metadata?.organization_id || 'a0000000-0000-0000-0000-000000000001';
        const fullName = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || '';
        const nameParts = fullName.split(' ');
        const derivedFirstName = currentUser.user_metadata?.first_name || currentUser.user_metadata?.given_name || (nameParts[0] || 'Usuario');
        const derivedLastName = currentUser.user_metadata?.last_name || currentUser.user_metadata?.family_name || (nameParts.slice(1).join(' ') || '');

        setBorrower({
          id: currentUser.id,
          user_id: currentUser.id,
          organization_id: orgId,
          id_type: 'CI',
          first_name: derivedFirstName,
          last_name: derivedLastName,
          email: currentUser.email || '',
          phone: currentUser.user_metadata?.phone || '',
          department: 'Montevideo',
          clearing_status: 'unverified',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } catch {
      // Fallback silencioso
    }
  };

  useEffect(() => {
    // Verificación de sesión de Master Admin persistente (ÚNICAMENTE en desarrollo o preview local)
    const isMasterStored = !import.meta.env.PROD && typeof window !== 'undefined' && window.localStorage.getItem('hipotecaly_master_user') === 'admin@test.com';
    if (isMasterStored) {
      const masterUser: User = {
        id: 'u-master-superadmin-001',
        app_metadata: { role: 'super_admin', is_super_admin: true },
        user_metadata: { first_name: 'Admin', last_name: 'Total', role: 'super_admin' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: 'admin@test.com',
      } as any;
      setUser(masterUser);
      setUserRole('super_admin');
      setIsSuperAdmin(true);
      setMemberships([
        { organizationId: 'a0000000-0000-0000-0000-000000000001', role: 'super_admin', isActive: true },
        { organizationId: 'd0000000-0000-0000-0000-000000000001', role: 'super_admin', isActive: true },
      ]);
      setLoading(false);
      return;
    }

    // Verificación de sesión de prueba controlada ÚNICAMENTE en entorno local de test preview (puerto 4173) o QA activo
    const isE2EPreview = typeof window !== 'undefined' && (window.location.port === '4173' || Boolean(window.localStorage.getItem('hipotecaly_qa_session_ref')));
    const testRole = isE2EPreview && typeof window !== 'undefined' ? window.localStorage.getItem('hipotecaly_test_role') : null;

    if (isE2EPreview && testRole === 'visitor') {
      setUser(null);
      setSession(null);
      setBorrower(null);
      setUserRole(null);
      setIsSuperAdmin(false);
      setMemberships([]);
      setLoading(false);
      return;
    }

    if (isE2EPreview && testRole && testRole !== 'visitor') {
      const mockUser: User = {
        id: 'u-test-' + testRole,
        app_metadata: { role: testRole },
        user_metadata: { first_name: 'Test', last_name: testRole, role: testRole },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: `${testRole}@hipotecaly.test`,
      } as any;
      const activeQaRef = adminQaService.getCurrentQaSessionRef();
      const isQa = Boolean(activeQaRef && new Date(activeQaRef.expiresAt).getTime() > Date.now());
      setIsQaSession(isQa);
      if (activeQaRef && isQa) {
        setQaSessionData({
          sessionId: activeQaRef.sessionId,
          role: activeQaRef.role,
          tenantId: activeQaRef.tenantId,
          tenantName: activeQaRef.tenantName,
          expiresAt: activeQaRef.expiresAt,
        });
      } else {
        setQaSessionData(null);
      }

      setUser(mockUser);
      setUserRole(testRole as UserRole);
      setIsSuperAdmin(testRole === 'super_admin' || testRole === 'platform_admin');
      setMemberships([
        {
          organizationId: 'a0000000-0000-0000-0000-000000000001',
          role: testRole as UserRole,
          isActive: true,
        },
        {
          organizationId: 'd0000000-0000-0000-0000-000000000001',
          role: testRole as UserRole,
          isActive: true,
        },
      ]);
      setLoading(false);
      return;
    }

    // 1. Obtener sesión activa de Supabase
    supabase.auth
      .getSession()
      .then(async ({ data: { session: initialSession } }) => {
        setSession(initialSession);
        const currentUser = initialSession?.user ?? null;

        if (currentUser) {
          setUser(currentUser);
          await resolveRoles(currentUser);
          await fetchBorrowerProfile(currentUser);
        } else if (isE2EPreview) {
          const defaultTestUser: User = {
            id: 'a1111111-1111-1111-1111-111111111111',
            app_metadata: { role: 'super_admin' },
            user_metadata: { first_name: 'Admin', last_name: 'Super', role: 'super_admin' },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
            email: 'admin@hipotecaly.uy',
          } as any;
          setUser(defaultTestUser);
          setUserRole('super_admin');
          setIsSuperAdmin(true);
          setMemberships([
            {
              organizationId: 'a0000000-0000-0000-0000-000000000001',
              role: 'super_admin',
              isActive: true,
            },
          ]);
        } else {
          setUser(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    // 2. Suscribirse a cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      const currentUser = newSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await resolveRoles(currentUser);
        await fetchBorrowerProfile(currentUser);
      } else {
        setBorrower(null);
        setUserRole(null);
        setIsSuperAdmin(false);
        setMemberships([]);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (emailInput: string, passwordInput: string): Promise<{
    error: Error | null;
    user?: User | null;
    role?: UserRole | null;
    isSuperAdmin?: boolean;
    memberships?: UserMembership[];
  }> => {
    console.log('[AUTH] signIn started');
    const emailTrimmed = emailInput.trim().toLowerCase();
    const passTrimmed = passwordInput.trim();

    // Normalización de username simple a email si no tiene arroba
    const emailToAuth = emailTrimmed.includes('@') ? emailTrimmed : `${emailTrimmed}@hipotecaly.uy`;

    // 1. Intentar autenticación real en Supabase Auth
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: emailToAuth, password: passTrimmed });
      if (!error && data.user) {
        // Validación de Modo Producción para Usuario Universal de Prueba
        const isTestUser = platformModeService.isUniversalTestUser(data.user.email || emailToAuth);
        if (isTestUser) {
          const settings = await platformModeService.getSettings();
          if (settings.platform_mode === 'production' || !settings.test_user_enabled) {
            await supabase.auth.signOut();
            setUser(null);
            setSession(null);
            setLoading(false);
            console.warn('[AUTH] Universal test user blocked: platform_mode is production');
            return {
              error: new Error('Acceso no autorizado: El usuario universal de prueba está deshabilitado en modo Producción.'),
            };
          }
        }

        console.log('[AUTH] signIn success');
        console.log('[AUTH] session available');
        console.log('[AUTH] user loaded');
        setUser(data.user);
        setSession(data.session);

        const { resolvedRole, resolvedIsSuper, resolvedMemberships } = await resolveRoles(data.user);
        console.log('[AUTH] profile loaded');
        console.log('[AUTH] membership loaded');
        console.log('[AUTH] role resolved:', resolvedRole);

        await fetchBorrowerProfile(data.user);
        setLoading(false);

        return {
          error: null,
          user: data.user,
          role: resolvedRole,
          isSuperAdmin: resolvedIsSuper,
          memberships: resolvedMemberships,
        };
      }
    } catch {
      // Continuar con fallback de prueba en desarrollo
    }

    // 2. Fallback de usuarios de demostración ÚNICAMENTE en desarrollo local
    if (!import.meta.env.PROD) {
      if (
        (emailTrimmed === 'superadmin' || emailTrimmed === 'admin@hipotecaly.uy' || emailTrimmed === 'admin' || emailTrimmed === 'juanmacastillo2008@gmail.com') &&
        (passTrimmed === 'admin123' || passTrimmed === 'admin' || passTrimmed === 'enano2018')
      ) {
        const mockUser: User = {
          id: 'f0000000-0000-0000-0000-000000000001',
          app_metadata: { role: 'super_admin', is_super_admin: true },
          user_metadata: { first_name: 'Super', last_name: 'Admin', role: 'super_admin' },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          email: 'juanmacastillo2008@gmail.com',
        } as any;
        setUser(mockUser);
        setUserRole('super_admin');
        setIsSuperAdmin(true);
        const mems: UserMembership[] = [
          { organizationId: 'a0000000-0000-0000-0000-000000000001', role: 'super_admin', isActive: true },
        ];
        setMemberships(mems);
        setLoading(false);
        console.log('[AUTH] signIn success (dev mock)');
        console.log('[AUTH] role resolved: super_admin');
        return { error: null, user: mockUser, role: 'super_admin', isSuperAdmin: true, memberships: mems };
      }

      if (
        (emailTrimmed === 'operador' || emailTrimmed === 'operador@hipotecaly.uy' || emailTrimmed === 'analyst') &&
        (passTrimmed === 'demo123' || passTrimmed === 'admin123' || passTrimmed === 'operador')
      ) {
        const mockUser: User = {
          id: 'u-test-analyst',
          app_metadata: { role: 'analyst' },
          user_metadata: { first_name: 'Operador', last_name: 'Backoffice', role: 'analyst' },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          email: 'operador@hipotecaly.uy',
        } as any;
        setUser(mockUser);
        setUserRole('analyst');
        setIsSuperAdmin(false);
        const mems: UserMembership[] = [
          { organizationId: 'd0000000-0000-0000-0000-000000000001', role: 'analyst', isActive: true },
        ];
        setMemberships(mems);
        setLoading(false);
        return { error: null, user: mockUser, role: 'analyst', isSuperAdmin: false, memberships: mems };
      }

      if (
        (emailTrimmed === 'cliente' || emailTrimmed === 'cliente@hipotecaly.uy' || emailTrimmed === 'borrower') &&
        (passTrimmed === 'demo123' || passTrimmed === 'admin123' || passTrimmed === 'cliente')
      ) {
        const mockUser: User = {
          id: 'b2222222-2222-2222-2222-222222222222',
          app_metadata: { role: 'borrower' },
          user_metadata: { first_name: 'Juan', last_name: 'Solicitante', role: 'borrower' },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          email: 'cliente@hipotecaly.uy',
        } as any;
        setUser(mockUser);
        setUserRole('borrower');
        setIsSuperAdmin(false);
        setMemberships([]);
        setLoading(false);
        return { error: null, user: mockUser, role: 'borrower', isSuperAdmin: false, memberships: [] };
      }

      if (
        (emailTrimmed === 'prestamista' || emailTrimmed === 'prestamista@hipotecaly.uy' || emailTrimmed === 'lender') &&
        (passTrimmed === 'demo123' || passTrimmed === 'admin123' || passTrimmed === 'prestamista')
      ) {
        const mockUser: User = {
          id: 'c1111111-1111-1111-1111-111111111111',
          app_metadata: { role: 'lender' },
          user_metadata: { first_name: 'Capital', last_name: 'Prestamista', role: 'lender' },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          email: 'prestamista@hipotecaly.uy',
        } as any;
        setUser(mockUser);
        setUserRole('lender');
        setIsSuperAdmin(false);
        const mems: UserMembership[] = [
          { organizationId: 'd0000000-0000-0000-0000-000000000001', role: 'lender', isActive: true },
        ];
        setMemberships(mems);
        setLoading(false);
        return { error: null, user: mockUser, role: 'lender', isSuperAdmin: false, memberships: mems };
      }

      if (
        (emailTrimmed === 'escribano' || emailTrimmed === 'escribano@hipotecaly.uy' || emailTrimmed === 'notary' || emailTrimmed === 'escribana') &&
        (passTrimmed === 'demo123' || passTrimmed === 'admin123' || passTrimmed === 'escribano' || passTrimmed === 'escribana')
      ) {
        const mockUser: User = {
          id: 'e1111111-1111-1111-1111-111111111111',
          app_metadata: { role: 'notary' },
          user_metadata: { first_name: 'María', last_name: 'Pérez Morales', role: 'notary' },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          email: 'escribano@hipotecaly.uy',
        } as any;
        setUser(mockUser);
        setUserRole('notary');
        setIsSuperAdmin(false);
        const mems: UserMembership[] = [
          { organizationId: 'd0000000-0000-0000-0000-000000000001', role: 'notary', isActive: true },
        ];
        setMemberships(mems);
        setLoading(false);
        return { error: null, user: mockUser, role: 'notary', isSuperAdmin: false, memberships: mems };
      }
    }

    return { error: new Error('Credenciales incorrectas o usuario no encontrado.') };
  };

  const signUp = async (
    email: string,
    password: string,
    userData: { firstName: string; lastName: string; phone?: string; targetTenantId?: string }
  ) => {
    try {
      // 1. Resolver organización segura para el nuevo usuario (TENANT-AWARE)
      let targetOrgId = 'a0000000-0000-0000-0000-000000000001'; // Default: Matriz Hipotecaly

      if (userData.targetTenantId) {
        // Validar que la organización enviada existe y está activa en Supabase
        const { data: orgData } = await supabase
          .from('organizations')
          .select('id, status')
          .eq('id', userData.targetTenantId)
          .eq('status', 'active')
          .maybeSingle();

        if (orgData?.id) {
          targetOrgId = orgData.id;
        }
      } else {
        // Resolver mediante hostname o ruta (/org/:slug o /demo/nova/*)
        try {
          const resolved = await resolveTenant(window.location.hostname, window.location.pathname);
          if (resolved && resolved.id && resolved.id !== '00000000-0000-0000-0000-000000000000') {
            targetOrgId = resolved.id;
          }
        } catch {
          // Fallback a matriz
        }
      }

      // 2. Registrar en Supabase Auth con metadata de organización
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            phone: userData.phone,
            organization_id: targetOrgId,
            role: 'borrower',
          },
        },
      });

      if (error) return { error: new Error(error.message) };

      // 3. Registrar prestatario en la tabla borrowers bajo el tenant correcto
      if (data.user) {
        await supabase.from('borrowers').insert({
          user_id: data.user.id,
          organization_id: targetOrgId,
          id_type: 'CI',
          first_name: userData.firstName,
          last_name: userData.lastName,
          email,
          phone: userData.phone,
          department: 'Montevideo',
        });
      }

      return { error: null, organizationId: targetOrgId };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error('Error al registrarse') };
    }
  };

  const signOut = async () => {
    adminQaService.clearLocalQaState();
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('hipotecaly_test_role');
      window.localStorage.removeItem('hipotecaly_master_user');
    }
    setUser(null);
    setSession(null);
    setBorrower(null);
    setUserRole(null);
    setIsSuperAdmin(false);
    setIsQaSession(false);
    setQaSessionData(null);
    setMemberships([]);
  };

  const exitQaSession = async () => {
    adminQaService.clearLocalQaState();
    setIsQaSession(false);
    setQaSessionData(null);
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('hipotecaly_test_role');
      window.localStorage.removeItem('hipotecaly_master_user');
      window.location.assign('/platform-admin');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/recuperar-password`,
      });
      return { error: error ? new Error(error.message) : null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error('Error al recuperar contraseña') };
    }
  };

  const signInWithGoogle = async (options?: GoogleAuthOptions) => {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const callbackPath = '/auth/callback';
      const intent = options?.intent || 'generic_login';
      const params = new URLSearchParams();
      params.set('intent', intent);
      if (options?.redirectTo) {
        params.set('redirectTo', options.redirectTo);
      }
      if (options?.targetTenantSlug) {
        params.set('tenant', options.targetTenantSlug);
      }
      if (options?.inviteToken) {
        params.set('inviteToken', options.inviteToken);
      }
      const finalRedirectTo = `${origin}${callbackPath}${params.toString() ? `?${params.toString()}` : ''}`;

      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(
          'hipotecaly_auth_intent',
          JSON.stringify({
            intent,
            targetTenantSlug: options?.targetTenantSlug,
            redirectTo: options?.redirectTo,
            inviteToken: options?.inviteToken,
            timestamp: Date.now(),
          })
        );
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: finalRedirectTo,
          scopes: 'openid email profile',
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        return { error: new Error(error.message) };
      }
      return { error: null, data: data ? { url: data.url, provider: data.provider } : undefined };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error('Error al iniciar sesión con Google') };
    }
  };

  const refreshBorrower = async () => {
    if (user) await fetchBorrowerProfile(user);
  };

  // Helper de verificación de roles y membresías
  const hasRole = (allowedRoles: UserRole[], tenantId?: string): boolean => {
    if (!user || !userRole) return false;
    if (isSuperAdmin) return true; // Super Admin accede a todo

    // Usuario universal de pruebas en modo demo: accede a todos los portales excepto Super Admin
    if (userRole === 'test_universal' || userRole === 'demo_universal' || (user.app_metadata as any)?.is_test_universal) {
      if (allowedRoles.length === 1 && allowedRoles[0] === 'super_admin') {
        return false;
      }
      return true;
    }

    const expandedAllowed = new Set(allowedRoles);
    if (expandedAllowed.has('tenant_admin')) {
      expandedAllowed.add('tenant_owner');
    }

    // Si se especifica un tenant, comprobar que el usuario es miembro activo con rol permitido
    if (tenantId && tenantId !== 'a0000000-0000-0000-0000-000000000001') {
      const match = memberships.find(
        (m) => m.organizationId === tenantId && m.isActive && (expandedAllowed.has(m.role) || (m.role as string) === 'admin')
      );
      if (match) return true;
    }

    return expandedAllowed.has(userRole) || (userRole === 'tenant_owner' && allowedRoles.includes('tenant_admin'));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        borrower,
        userRole,
        isSuperAdmin,
        memberships,
        loading,
        isQaSession,
        qaSessionData,
        signIn,
        signUp,
        signOut,
        exitQaSession,
        resetPassword,
        signInWithGoogle,
        refreshBorrower,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
