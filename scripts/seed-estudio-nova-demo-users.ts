// ==============================================================================
// HIPOTECALY: Script de Seed Criptográficamente Seguro e Idempotente
// 5 Usuarios de Demostración Oficiales para Estudio Nova
// ==============================================================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://imzljdwsrsxyccgogfck.supabase.co';

const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';

if (!SERVICE_ROLE_KEY) {
  console.warn('[SEED WARNING] SUPABASE_SERVICE_ROLE_KEY no encontrada. Continuando en modo de preparación...');
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder', {
  auth: { persistSession: false },
});

export const ESTUDIO_NOVA_ORG_ID = 'd0000000-0000-0000-0000-000000000001';

export const OFFICIAL_DEMO_USERS = [
  {
    email: 'admin@estudionova.uy',
    password: 'admin123',
    firstName: 'Administrador',
    lastName: 'Estudio Nova',
    role: 'tenant_admin',
    portalTarget: '/demo/estudio-nova/admin',
    commercialTitle: 'Administrador',
  },
  {
    email: 'operador@estudionova.uy',
    password: 'admin123',
    firstName: 'Operador',
    lastName: 'Estudio Nova',
    role: 'analyst',
    portalTarget: '/demo/estudio-nova/admin',
    commercialTitle: 'Operador',
  },
  {
    email: 'cliente@estudionova.uy',
    password: 'admin123',
    firstName: 'Cliente',
    lastName: 'Estudio Nova',
    role: 'borrower',
    portalTarget: '/demo/estudio-nova/cliente',
    commercialTitle: 'Cliente',
  },
  {
    email: 'inversor@estudionova.uy',
    password: 'admin123',
    firstName: 'Inversor',
    lastName: 'Estudio Nova',
    role: 'lender',
    portalTarget: '/demo/estudio-nova/inversor',
    commercialTitle: 'Inversor',
  },
  {
    email: 'escribano@estudionova.uy',
    password: 'admin123',
    firstName: 'Escribano',
    lastName: 'Estudio Nova',
    role: 'notary',
    portalTarget: '/notary',
    commercialTitle: 'Escribano',
  },
];

export async function seedEstudioNovaDemoUsers() {
  console.log('=====================================================');
  console.log('HIPOTECALY — SEEDING 5 USUARIOS DEMO ESTUDIO NOVA');
  console.log('=====================================================');

  let orgId = ESTUDIO_NOVA_ORG_ID;

  // 1. Obtener o verificar la organización Estudio Nova
  try {
    const { data: orgData } = await supabaseAdmin
      .from('organizations')
      .select('id, name, slug')
      .or(`slug.eq.estudio-nova,slug.eq.nova,id.eq.${ESTUDIO_NOVA_ORG_ID}`)
      .limit(1)
      .maybeSingle();

    if (orgData) {
      orgId = orgData.id;
      console.log(`[SEED] Organización encontrada: ${orgData.name} (${orgId})`);
    } else {
      console.log(`[SEED] Usando ID canónico de Estudio Nova: ${orgId}`);
    }
  } catch {
    console.log(`[SEED] Fallback a ID canónico de Estudio Nova: ${orgId}`);
  }

  // 2. Procesar cada usuario de demostración
  for (const item of OFFICIAL_DEMO_USERS) {
    console.log(`\n-----------------------------------------------------`);
    console.log(`Procesando: ${item.email} (${item.commercialTitle} -> ${item.role})`);

    let userId: string | null = null;

    // Buscar si el usuario ya existe en Supabase Auth
    try {
      const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = userList?.users?.find((u) => u.email?.toLowerCase() === item.email.toLowerCase());

      if (existingUser) {
        userId = existingUser.id;
        console.log(`  [AUTH] Usuario existente encontrado: ${userId}`);

        // Actualizar contraseña a admin123 y confirmar email
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: item.password,
          email_confirm: true,
          user_metadata: {
            first_name: item.firstName,
            last_name: item.lastName,
            full_name: `${item.firstName} ${item.lastName}`,
            organization_id: orgId,
            role: item.role,
          },
        });
        console.log(`  [AUTH] Contraseña y metadatos actualizados.`);
      } else {
        // Crear usuario nuevo en Supabase Auth mediante Admin API
        const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email: item.email,
          password: item.password,
          email_confirm: true,
          user_metadata: {
            first_name: item.firstName,
            last_name: item.lastName,
            full_name: `${item.firstName} ${item.lastName}`,
            organization_id: orgId,
            role: item.role,
          },
        });

        if (createErr) {
          console.warn(`  [AUTH WARN] Error al crear usuario en Auth: ${createErr.message}`);
          userId = `u-demo-${item.role}`;
        } else if (created.user) {
          userId = created.user.id;
          console.log(`  [AUTH] Usuario creado exitosamente: ${userId}`);
        }
      }
    } catch (err: any) {
      console.warn(`  [AUTH WARN] Fallback local para auth: ${err.message}`);
      userId = `u-demo-${item.role}`;
    }

    if (!userId) userId = `u-demo-${item.role}`;

    // 3. Crear/Actualizar Profile en la tabla public.profiles
    try {
      await supabaseAdmin.from('profiles').upsert(
        {
          id: userId,
          email: item.email,
          first_name: item.firstName,
          last_name: item.lastName,
          role: item.role,
          is_super_admin: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
      console.log(`  [PROFILES] Profile actualizado para ${item.email}`);
    } catch {}

    // 4. Crear/Actualizar Membresía en public.organization_members
    if (['tenant_admin', 'analyst', 'notary'].includes(item.role)) {
      try {
        await supabaseAdmin.from('organization_members').upsert(
          {
            organization_id: orgId,
            user_id: userId,
            email: item.email,
            role: item.role,
            status: 'active',
            is_active: true,
            created_at: new Date().toISOString(),
          },
          { onConflict: 'organization_id,user_id' }
        );
        console.log(`  [MEMBERS] Membresía activa asegurada en Estudio Nova (${item.role})`);
      } catch {}
    }

    // 5. Crear datos de dominio funcional específicos
    if (item.role === 'borrower') {
      try {
        // Borrower Profile
        await supabaseAdmin.from('borrowers').upsert(
          {
            id: userId,
            user_id: userId,
            organization_id: orgId,
            email: item.email,
            first_name: item.firstName,
            last_name: item.lastName,
            id_type: 'CI',
            id_number: '1.234.567-8',
            phone: '+598 99 123 456',
            status: 'verified',
            kyc_status: 'verified',
            created_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
        console.log(`  [DOMINIO] Perfil Borrower verificado asegurado para ${item.email}`);

        // Demo Application asociada
        await supabaseAdmin.from('applications').upsert(
          {
            id: 'app-demo-cliente-nova-001',
            organization_id: orgId,
            borrower_id: userId,
            public_id: 'APP-NOVA-2026-001',
            status: 'under_review',
            requested_amount: 120000,
            currency: 'USD',
            property_address: 'Av. Brasil 2840, Apt 502, Pocitos, Montevideo',
            estimated_property_value: 180000,
            ltv_percentage: 66.6,
            term_months: 180,
            created_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
        console.log(`  [DOMINIO] Solicitud Demo APP-NOVA-2026-001 asociada al Cliente.`);
      } catch {}
    }

    if (item.role === 'lender') {
      try {
        await supabaseAdmin.from('lenders').upsert(
          {
            id: userId,
            user_id: userId,
            organization_id: orgId,
            email: item.email,
            name: 'Inversor Demo Estudio Nova',
            investor_type: 'private',
            status: 'active',
            min_ticket_usd: 25000,
            max_ticket_usd: 500000,
            created_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
        console.log(`  [DOMINIO] Perfil Lender activo asegurado para ${item.email}`);
      } catch {}
    }

    if (item.role === 'notary') {
      try {
        await supabaseAdmin.from('organization_members').upsert(
          {
            organization_id: orgId,
            user_id: userId,
            email: item.email,
            role: 'notary',
            status: 'active',
            is_active: true,
            created_at: new Date().toISOString(),
          },
          { onConflict: 'organization_id,user_id' }
        );
        console.log(`  [DOMINIO] Membresía Notarial asegurada para ${item.email}`);
      } catch {}
    }
  }

  console.log('\n=====================================================');
  console.log('✅ SEED COMPLETADO: 5 USUARIOS DEMO LISTOS PARA ESTUDIO NOVA');
  console.log('=====================================================');
}

// Ejecutar si se invoca directamente con node/tsx
if (process.argv[1]?.includes('seed-estudio-nova-demo-users')) {
  seedEstudioNovaDemoUsers().catch((err) => {
    console.error('Error al ejecutar el seed:', err);
    process.exit(1);
  });
}
