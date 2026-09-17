-- Internal RBAC helpers are trigger/service functions, not public RPC endpoints.
revoke all on function public.bootstrap_org_rbac_after_insert() from public, anon, authenticated;
revoke all on function public.sync_legacy_member_role_assignment() from public, anon, authenticated;
revoke all on function public.protect_owner_role_and_assignment() from public, anon, authenticated;
revoke all on function public.bootstrap_organization_rbac(uuid) from public, anon, authenticated;
grant execute on function public.bootstrap_organization_rbac(uuid) to service_role;
