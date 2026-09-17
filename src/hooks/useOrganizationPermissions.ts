import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getMyOrganizationPermissions } from '../lib/organizationRbacService';

export function useOrganizationPermissions(organizationId?: string) {
  const { isSuperAdmin, memberships } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!organizationId) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    const membership = memberships.find((m) => m.organizationId === organizationId && m.isActive);
    if (isSuperAdmin || membership?.role === 'tenant_owner') {
      setPermissions(['*']);
      setLoading(false);
      return;
    }

    setLoading(true);
    getMyOrganizationPermissions(organizationId)
      .then((result) => {
        if (!cancelled) setPermissions(result);
      })
      .catch(() => {
        if (!cancelled) setPermissions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [organizationId, isSuperAdmin, memberships]);

  const permissionSet = useMemo(() => new Set(permissions), [permissions]);
  const hasPermission = (permissionKey: string) => permissionSet.has('*') || permissionSet.has(permissionKey);
  const hasAnyPermission = (keys: string[]) => permissionSet.has('*') || keys.some((key) => permissionSet.has(key));

  return { permissions, loading, hasPermission, hasAnyPermission };
}
