-- HIPOTECALY — RBAC flexible por organización
-- Roles base = plantillas, no puestos obligatorios.
-- Owner protegido. Usuarios pueden acumular múltiples roles.

create table if not exists public.permission_definitions (
  permission_key text primary key,
  category text not null,
  label text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.permission_definitions(permission_key,category,label,description,sort_order) values
('organization.view','Organización','Ver organización','Ver datos generales de la organización.',10),
('organization.settings.manage','Organización','Gestionar configuración','Modificar configuración general de la organización.',20),
('organization.branding.manage','Organización','Gestionar marca y portal','Modificar branding, portal y contenido white label.',30),
('organization.integrations.manage','Organización','Gestionar integraciones','Configurar integraciones externas habilitadas.',40),
('organization.users.view','Usuarios','Ver usuarios','Ver miembros e invitaciones.',50),
('organization.users.manage','Usuarios','Gestionar usuarios','Invitar, activar, desactivar y administrar usuarios.',60),
('organization.roles.manage','Usuarios','Gestionar roles y permisos','Crear, editar y asignar roles personalizados.',70),
('applications.view','Expedientes','Ver expedientes','Consultar expedientes.',100),
('applications.manage','Expedientes','Gestionar expedientes','Crear, editar, asignar y cambiar estados.',110),
('clients.view','Clientes','Ver clientes','Consultar clientes y solicitantes.',120),
('clients.manage','Clientes','Gestionar clientes','Crear y modificar clientes.',130),
('properties.view','Garantías','Ver garantías','Consultar propiedades y garantías.',140),
('properties.manage','Garantías','Gestionar garantías','Crear y modificar propiedades y garantías.',150),
('documents.view','Documentos','Ver documentos','Consultar documentación.',160),
('documents.manage','Documentos','Gestionar documentos','Cargar, revisar, generar y administrar documentos.',170),
('appraisals.view','Tasador','Ver tasaciones','Consultar tasaciones y comparables.',180),
('appraisals.run','Tasador','Ejecutar tasaciones','Crear y ejecutar tasaciones.',190),
('appraisals.review','Tasador','Revisar tasaciones','Validar comparables y cerrar tasaciones.',200),
('notary.view','Notarial','Ver módulo notarial','Consultar información notarial asignada.',210),
('notary.manage','Notarial','Gestionar módulo notarial','Gestionar checklist, observaciones y formalización.',220),
('lenders.view','Inversores','Ver inversores','Consultar prestamistas, oportunidades y ofertas.',230),
('lenders.manage','Inversores','Gestionar inversores','Administrar prestamistas, oportunidades y ofertas.',240),
('analytics.view','Control','Ver analítica','Acceder a métricas y analítica.',250),
('audit.view','Control','Ver auditoría','Consultar trazabilidad y auditoría.',260),
('billing.view','Facturación','Ver facturación','Consultar plan, consumo y facturación.',270),
('billing.manage','Facturación','Gestionar facturación','Administrar parámetros permitidos de facturación.',280)
on conflict (permission_key) do update set category=excluded.category,label=excluded.label,description=excluded.description,sort_order=excluded.sort_order;

create table if not exists public.organization_roles (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  is_system_template boolean not null default false,
  is_owner_role boolean not null default false,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id,code)
);

create table if not exists public.organization_role_permissions (
  role_id uuid not null references public.organization_roles(id) on delete cascade,
  permission_key text not null references public.permission_definitions(permission_key) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(role_id,permission_key)
);

create table if not exists public.organization_member_role_assignments (
  member_id uuid not null references public.organization_members(id) on delete cascade,
  role_id uuid not null references public.organization_roles(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  primary key(member_id,role_id)
);

alter table public.organization_invitations add column if not exists status text not null default 'PENDING';
alter table public.organization_invitations add column if not exists invited_by text;
alter table public.organization_invitations add column if not exists role_id uuid references public.organization_roles(id) on delete set null;

create index if not exists idx_org_roles_org on public.organization_roles(organization_id,is_active);
create index if not exists idx_org_role_permissions_key on public.organization_role_permissions(permission_key,role_id);
create index if not exists idx_member_role_assignments_member on public.organization_member_role_assignments(member_id);
create index if not exists idx_member_role_assignments_role on public.organization_member_role_assignments(role_id);
create index if not exists idx_org_invitations_role_id on public.organization_invitations(role_id);

create or replace function public.bootstrap_organization_rbac(p_organization_id uuid)
returns void language plpgsql security definer set search_path='pg_catalog','public' as $$
declare v_owner uuid; v_admin uuid; v_ops uuid; v_view uuid; v_notary uuid;
begin
  insert into public.organization_roles(organization_id,code,name,description,is_system_template,is_owner_role)
  values
   (p_organization_id,'owner','Propietario','Control último de la organización.',true,true),
   (p_organization_id,'administrator','Administrador','Acceso administrativo completo.',true,false),
   (p_organization_id,'operations','Operaciones','Trabajo operativo diario.',true,false),
   (p_organization_id,'read_only','Solo lectura','Consulta sin mutaciones sensibles.',true,false),
   (p_organization_id,'notary','Escribano','Trabajo notarial especializado.',true,false)
  on conflict (organization_id,code) do update set name=excluded.name,description=excluded.description,is_system_template=true,is_owner_role=excluded.is_owner_role,is_active=true;

  select id into v_owner from public.organization_roles where organization_id=p_organization_id and code='owner';
  select id into v_admin from public.organization_roles where organization_id=p_organization_id and code='administrator';
  select id into v_ops from public.organization_roles where organization_id=p_organization_id and code='operations';
  select id into v_view from public.organization_roles where organization_id=p_organization_id and code='read_only';
  select id into v_notary from public.organization_roles where organization_id=p_organization_id and code='notary';

  insert into public.organization_role_permissions select v_owner,permission_key,now() from public.permission_definitions on conflict do nothing;
  insert into public.organization_role_permissions select v_admin,permission_key,now() from public.permission_definitions on conflict do nothing;
  insert into public.organization_role_permissions(role_id,permission_key)
    select v_ops,permission_key from public.permission_definitions where permission_key in ('organization.view','applications.view','applications.manage','clients.view','clients.manage','properties.view','properties.manage','documents.view','documents.manage','appraisals.view','appraisals.run','lenders.view','analytics.view') on conflict do nothing;
  insert into public.organization_role_permissions(role_id,permission_key)
    select v_view,permission_key from public.permission_definitions where permission_key in ('organization.view','applications.view','clients.view','properties.view','documents.view','appraisals.view','lenders.view','analytics.view') on conflict do nothing;
  insert into public.organization_role_permissions(role_id,permission_key)
    select v_notary,permission_key from public.permission_definitions where permission_key in ('organization.view','applications.view','clients.view','properties.view','documents.view','documents.manage','notary.view','notary.manage') on conflict do nothing;
end $$;

create or replace function public.user_has_org_permission(p_organization_id uuid,p_permission_key text,p_user_id uuid default auth.uid())
returns boolean language plpgsql stable security definer set search_path='pg_catalog','public' as $$
declare v_caller uuid:=auth.uid(); v_member_id uuid; v_legacy_role text;
begin
  if p_user_id is null then return false; end if;
  if v_caller is not null and v_caller<>p_user_id and not public.is_super_admin() then return false; end if;
  if exists(select 1 from public.profiles where id=p_user_id and is_super_admin=true) then return true; end if;
  select id,role::text into v_member_id,v_legacy_role from public.organization_members where organization_id=p_organization_id and user_id=p_user_id and is_active=true limit 1;
  if v_member_id is null then return false; end if;
  if v_legacy_role='tenant_owner' then return true; end if;
  return exists(
    select 1 from public.organization_member_role_assignments a
    join public.organization_roles r on r.id=a.role_id and r.organization_id=p_organization_id and r.is_active=true
    join public.organization_role_permissions rp on rp.role_id=r.id
    where a.member_id=v_member_id and rp.permission_key=p_permission_key
  );
end $$;

create or replace function public.get_my_org_permissions(p_organization_id uuid)
returns table(permission_key text) language sql stable security definer set search_path='pg_catalog','public' as $$
  select pd.permission_key from public.permission_definitions pd
  where public.user_has_org_permission(p_organization_id,pd.permission_key,auth.uid())
  order by pd.sort_order,pd.permission_key;
$$;

create or replace function public.sync_legacy_member_role_assignment()
returns trigger language plpgsql security definer set search_path='pg_catalog','public' as $$
declare v_code text; v_role_id uuid;
begin
  perform public.bootstrap_organization_rbac(new.organization_id);
  v_code:=case new.role::text when 'tenant_owner' then 'owner' when 'tenant_admin' then 'administrator' when 'analyst' then 'operations' when 'operator' then 'operations' when 'viewer' then 'read_only' when 'notary' then 'notary' else 'read_only' end;
  select id into v_role_id from public.organization_roles where organization_id=new.organization_id and code=v_code;
  delete from public.organization_member_role_assignments a using public.organization_roles r where a.member_id=new.id and a.role_id=r.id and r.organization_id=new.organization_id and r.is_system_template=true;
  if v_role_id is not null then insert into public.organization_member_role_assignments(member_id,role_id,assigned_by) values(new.id,v_role_id,auth.uid()) on conflict do nothing; end if;
  return new;
end $$;

drop trigger if exists trg_sync_legacy_member_role_assignment on public.organization_members;
create trigger trg_sync_legacy_member_role_assignment after insert or update of role on public.organization_members for each row execute function public.sync_legacy_member_role_assignment();

create or replace function public.bootstrap_org_rbac_after_insert()
returns trigger language plpgsql security definer set search_path='pg_catalog','public' as $$ begin perform public.bootstrap_organization_rbac(new.id); return new; end $$;
drop trigger if exists trg_bootstrap_org_rbac on public.organizations;
create trigger trg_bootstrap_org_rbac after insert on public.organizations for each row execute function public.bootstrap_org_rbac_after_insert();

create or replace function public.protect_owner_role_and_assignment()
returns trigger language plpgsql security definer set search_path='pg_catalog','public' as $$
declare v_owner boolean; v_member_role text;
begin
 if tg_table_name='organization_roles' then
   if tg_op='DELETE' and old.is_owner_role then raise exception 'OWNER_ROLE_PROTECTED'; end if;
   if tg_op='UPDATE' and old.is_owner_role and (new.organization_id<>old.organization_id or new.code<>old.code or new.is_owner_role=false or new.is_active=false) then raise exception 'OWNER_ROLE_PROTECTED'; end if;
   return case when tg_op='DELETE' then old else new end;
 end if;
 if tg_table_name='organization_member_role_assignments' and tg_op='INSERT' then
   select r.is_owner_role,m.role::text into v_owner,v_member_role from public.organization_roles r join public.organization_members m on m.id=new.member_id where r.id=new.role_id;
   if coalesce(v_owner,false) and v_member_role<>'tenant_owner' then raise exception 'OWNER_ASSIGNMENT_PROTECTED'; end if;
 end if;
 return new;
end $$;

drop trigger if exists trg_protect_owner_role on public.organization_roles;
create trigger trg_protect_owner_role before update or delete on public.organization_roles for each row execute function public.protect_owner_role_and_assignment();
drop trigger if exists trg_protect_owner_assignment on public.organization_member_role_assignments;
create trigger trg_protect_owner_assignment before insert on public.organization_member_role_assignments for each row execute function public.protect_owner_role_and_assignment();

alter table public.permission_definitions enable row level security;
alter table public.organization_roles enable row level security;
alter table public.organization_role_permissions enable row level security;
alter table public.organization_member_role_assignments enable row level security;

create policy permission_definitions_authenticated_read on public.permission_definitions for select to authenticated using (true);
create policy organization_roles_member_read on public.organization_roles for select to authenticated using (public.is_super_admin() or exists(select 1 from public.organization_members m where m.organization_id=organization_roles.organization_id and m.user_id=auth.uid() and m.is_active=true));
create policy organization_roles_manage on public.organization_roles for all to authenticated using (public.user_has_org_permission(organization_id,'organization.roles.manage',auth.uid())) with check (public.user_has_org_permission(organization_id,'organization.roles.manage',auth.uid()));
create policy organization_role_permissions_member_read on public.organization_role_permissions for select to authenticated using (exists(select 1 from public.organization_roles r join public.organization_members m on m.organization_id=r.organization_id where r.id=organization_role_permissions.role_id and m.user_id=auth.uid() and m.is_active=true) or public.is_super_admin());
create policy organization_role_permissions_manage on public.organization_role_permissions for all to authenticated using (exists(select 1 from public.organization_roles r where r.id=organization_role_permissions.role_id and public.user_has_org_permission(r.organization_id,'organization.roles.manage',auth.uid()))) with check (exists(select 1 from public.organization_roles r where r.id=organization_role_permissions.role_id and public.user_has_org_permission(r.organization_id,'organization.roles.manage',auth.uid())));
create policy member_role_assignments_read on public.organization_member_role_assignments for select to authenticated using (exists(select 1 from public.organization_members m where m.id=organization_member_role_assignments.member_id and (m.user_id=auth.uid() or public.user_has_org_permission(m.organization_id,'organization.users.view',auth.uid()))) or public.is_super_admin());
create policy member_role_assignments_manage on public.organization_member_role_assignments for all to authenticated using (exists(select 1 from public.organization_members m where m.id=organization_member_role_assignments.member_id and public.user_has_org_permission(m.organization_id,'organization.users.manage',auth.uid()))) with check (exists(select 1 from public.organization_members m where m.id=organization_member_role_assignments.member_id and public.user_has_org_permission(m.organization_id,'organization.users.manage',auth.uid())));

revoke all on function public.bootstrap_organization_rbac(uuid) from public,anon,authenticated;
grant execute on function public.bootstrap_organization_rbac(uuid) to service_role;
revoke all on function public.user_has_org_permission(uuid,text,uuid) from public,anon;
grant execute on function public.user_has_org_permission(uuid,text,uuid) to authenticated,service_role;
revoke all on function public.get_my_org_permissions(uuid) from public,anon;
grant execute on function public.get_my_org_permissions(uuid) to authenticated;

do $$ declare r record; begin for r in select id from public.organizations loop perform public.bootstrap_organization_rbac(r.id); end loop; end $$;
insert into public.organization_member_role_assignments(member_id,role_id)
select m.id,r.id from public.organization_members m join public.organization_roles r on r.organization_id=m.organization_id and r.code=case m.role::text when 'tenant_owner' then 'owner' when 'tenant_admin' then 'administrator' when 'analyst' then 'operations' when 'operator' then 'operations' when 'viewer' then 'read_only' when 'notary' then 'notary' else 'read_only' end
on conflict do nothing;
