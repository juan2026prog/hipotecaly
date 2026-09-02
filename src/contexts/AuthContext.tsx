// ==============================================================================
// HIPOTECALY: Contexto de Autenticación con Supabase Auth
// ==============================================================================

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Borrower } from '../lib/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  borrower: Borrower | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, userData: { firstName: string; lastName: string; phone?: string }) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  refreshBorrower: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [borrower, setBorrower] = useState<Borrower | null>(null);
  const [loading, setLoading] = useState(true);

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
        // Si no existe perfil en borrowers, creamos uno básico de sesión en memoria
        setBorrower({
          id: currentUser.id,
          user_id: currentUser.id,
          organization_id: 'a0000000-0000-0000-0000-000000000001', // HIPOTECALY Matriz
          id_type: 'CI',
          first_name: currentUser.user_metadata?.first_name || 'Usuario',
          last_name: currentUser.user_metadata?.last_name || '',
          email: currentUser.email || '',
          phone: currentUser.user_metadata?.phone || '',
          department: 'Montevideo',
          clearing_status: 'unverified',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } catch {
      // Fallback seguro sin bloquear al usuario
    }
  };

  useEffect(() => {
    // 1. Obtener sesión activa al cargar
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        fetchBorrowerProfile(initialSession.user);
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    // 2. Suscribirse a cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        fetchBorrowerProfile(newSession.user);
      } else {
        setBorrower(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error ? new Error(error.message) : null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error('Error al iniciar sesión') };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    userData: { firstName: string; lastName: string; phone?: string }
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            phone: userData.phone,
          },
        },
      });

      if (error) return { error: new Error(error.message) };

      // Si el usuario se crea con éxito, registramos su registro en la tabla borrowers
      if (data.user) {
        await supabase.from('borrowers').insert({
          user_id: data.user.id,
          organization_id: 'a0000000-0000-0000-0000-000000000001',
          id_type: 'CI',
          first_name: userData.firstName,
          last_name: userData.lastName,
          email,
          phone: userData.phone,
          department: 'Montevideo',
        });
      }

      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error('Error al registrarse') };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setBorrower(null);
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

  const refreshBorrower = async () => {
    if (user) await fetchBorrowerProfile(user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        borrower,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        refreshBorrower,
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
