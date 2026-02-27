'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { profileApi, authApi } from '@/lib/api';
import { useAuthStore, getDashboardPath } from '@/store';
import { PageHeader, Card, Avatar, Badge, Button } from '@/components/ui';
import { FormField } from '@/components/forms/FormField';
import { cn } from '@/lib/utils';

interface AdminProfileData {
  userId: string;
  fullName: string | null;
  employeeId: string | null;
  department: string | null;
  activeRole: { id: string; name: string; displayName: string | null } | null;
  user: { phone: string; email: string | null };
}

interface AdminRoleInfo {
  role: {
    id: string;
    name: string;
    displayName: string | null;
    rolePermissions: Array<{ permission: { name: string } }>;
  };
}

export default function AdminProfilePage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [profile, setProfile] = useState<AdminProfileData | null>(null);
  const [roles, setRoles] = useState<AdminRoleInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({ fullName: '', department: '', employeeId: '' });

  const fetchProfile = useCallback(async () => {
    try {
      const res = await profileApi.getAdminProfile();
      const d = res.data as unknown as AdminProfileData;
      setProfile(d);
      setForm({
        fullName: d.fullName ?? '',
        department: d.department ?? '',
        employeeId: d.employeeId ?? '',
      });
    } catch { /* handled */ } finally {
      setLoading(false);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const meRes = await authApi.getMe();
      const me = meRes.data;
      if (me && 'roles' in me) {
        const roleData = (me as unknown as { userRoles?: AdminRoleInfo[] }).userRoles;
        if (roleData) setRoles(roleData);
      }
    } catch { /* best-effort */ }
  }, []);

  useEffect(() => { fetchProfile(); fetchRoles(); }, [fetchProfile, fetchRoles]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, string> = {};
      for (const [k, v] of Object.entries(form)) { if (v) payload[k] = v; }
      await profileApi.updateAdminProfile(payload);
      await fetchProfile();
      setToast('Profile updated');
      setTimeout(() => setToast(''), 3000);
    } catch {
      setToast('Failed to update');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchRole = async (role: AdminRoleInfo['role']) => {
    setSwitchingId(role.id);
    try {
      // Re-login flow: the user needs a fresh tempToken. For now, redirect to login.
      // In a full implementation, this would call a role-switch API.
      const state = useAuthStore.getState();
      if (state.accessToken && state.refreshToken && state.user) {
        setAuth({
          user: state.user,
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
        });
      }
      router.push(getDashboardPath('ADMIN', role.name));
    } catch {
      setToast('Failed to switch role');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setSwitchingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-900" />
      </div>
    );
  }

  if (!profile) return <p className="text-gray-500">Profile not found.</p>;

  return (
    <div>
      <PageHeader
        title="My Profile"
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Profile' }]}
      />

      {toast && (
        <div className={cn(
          'mb-4 rounded-md p-3 text-sm',
          toast.includes('Failed') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
        )}>
          {toast}
        </div>
      )}

      {/* Header card */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <Avatar name={profile.fullName} size="xl" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {profile.fullName || 'Admin User'}
            </h2>
            <p className="text-sm text-gray-500">{profile.user.phone}</p>
            <div className="mt-2 flex items-center gap-2">
              {profile.activeRole && (
                <Badge variant="navy">
                  {profile.activeRole.displayName || profile.activeRole.name}
                </Badge>
              )}
              {profile.employeeId && (
                <Badge variant="gray">ID: {profile.employeeId}</Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Edit form */}
        <div className="lg:col-span-2">
          <Card title="Personal Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Full Name" htmlFor="fullName">
                <input id="fullName" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </FormField>
              <FormField label="Employee ID" htmlFor="employeeId">
                <input id="employeeId" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} />
              </FormField>
              <FormField label="Department" htmlFor="department">
                <input id="department" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
              </FormField>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={handleSave} isLoading={saving} className="bg-navy-900 hover:bg-navy-800">Save Changes</Button>
            </div>
          </Card>
        </div>

        {/* Assigned roles sidebar */}
        <div>
          <Card title="Assigned Roles">
            {roles.length === 0 ? (
              <p className="text-sm text-gray-500">Loading roles...</p>
            ) : (
              <div className="space-y-3">
                {roles.map((r) => {
                  const isActive = profile.activeRole?.id === r.role.id;
                  return (
                    <div
                      key={r.role.id}
                      className={cn(
                        'rounded-lg border p-3 transition-colors',
                        isActive ? 'border-accent-500 bg-accent-50' : 'border-gray-200',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {r.role.displayName || r.role.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {r.role.rolePermissions.length} permissions
                          </p>
                        </div>
                        {isActive ? (
                          <Badge variant="green">Active</Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            isLoading={switchingId === r.role.id}
                            onClick={() => handleSwitchRole(r.role)}
                          >
                            Switch
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
