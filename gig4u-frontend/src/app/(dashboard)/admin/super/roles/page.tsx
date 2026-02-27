'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/lib/api';
import { PageHeader, Card, Badge, Button } from '@/components/ui';
import { cn } from '@/lib/utils';

interface Permission {
  id: string;
  name: string;
  displayName: string | null;
}

interface PermGroup {
  id: string;
  groupName: string;
  displayName: string | null;
  permissions: Permission[];
}

interface RoleItem {
  id: string;
  name: string;
  displayName: string | null;
  description: string | null;
  actorType: string;
  isSystem: boolean;
  isActive: boolean;
  _count: { rolePermissions: number; userRoles: number };
  parent: { id: string; name: string; displayName: string | null } | null;
}

interface RoleDetail extends RoleItem {
  rolePermissions: Array<{ permission: Permission & { group: PermGroup | null } }>;
}

const TYPE_VARIANT: Record<string, 'navy' | 'blue' | 'green' | 'gray'> = {
  ADMIN: 'navy', CLIENT: 'blue', SP: 'green', PARTNER: 'gray',
};

// ─── Create Role Panel ──────────────────────────────────────────────────

function CreateRolePanel({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [form, setForm] = useState({ name: '', displayName: '', description: '', actorType: 'ADMIN', parentId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!form.name || !form.displayName) { setError('Name and display name are required'); return; }
    setSubmitting(true);
    try {
      const res = await adminApi.createRole({
        name: form.name.toUpperCase().replace(/\s+/g, '_'),
        displayName: form.displayName,
        description: form.description || undefined,
        actorType: form.actorType,
        parentId: form.parentId || undefined,
      });
      const created = res.data as unknown as { id: string };
      onCreated(created.id);
      onClose();
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { message?: string } } };
      setError(axErr.response?.data?.message || 'Failed to create role');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-gray-200 flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900">Create Role</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {error && <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name (SCREAMING_SNAKE_CASE)</label>
          <input
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm uppercase outline-none focus:border-accent-500"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value.toUpperCase().replace(/[^A-Z_]/g, '') })}
            placeholder="MY_CUSTOM_ROLE"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
          <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="My Custom Role" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500 resize-none" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Actor Type</label>
          <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white outline-none focus:border-accent-500" value={form.actorType} onChange={(e) => setForm({ ...form, actorType: e.target.value })}>
            <option value="ADMIN">Admin</option>
            <option value="CLIENT">Client</option>
            <option value="SP">Service Provider</option>
          </select>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} isLoading={submitting} className="bg-navy-900 hover:bg-navy-800">Create Role</Button>
      </div>
    </div>
  );
}

// ─── Role Permission Editor ─────────────────────────────────────────────

function PermissionEditor({ roleId, onClose }: { roleId: string; onClose: () => void }) {
  const [role, setRole] = useState<RoleDetail | null>(null);
  const [groups, setGroups] = useState<PermGroup[]>([]);
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const [roleRes, permRes] = await Promise.all([
        adminApi.getRole(roleId),
        adminApi.listPermissions(),
      ]);
      const rd = roleRes.data as unknown as RoleDetail;
      const pd = permRes.data as unknown as { groups: PermGroup[] };
      setRole(rd);
      setGroups(pd.groups);
      setAssignedIds(new Set(rd.rolePermissions.map((rp) => rp.permission.id)));
    } catch { /* handled */ } finally {
      setLoading(false);
    }
  }, [roleId]);

  useEffect(() => { fetch(); }, [fetch]);

  const togglePermission = async (permId: string) => {
    const isAssigned = assignedIds.has(permId);
    // Optimistic update
    const newSet = new Set(assignedIds);
    if (isAssigned) {
      newSet.delete(permId);
    } else {
      newSet.add(permId);
    }
    setAssignedIds(newSet);

    try {
      if (isAssigned) {
        await adminApi.revokePermissions(roleId, [permId]);
      } else {
        await adminApi.assignPermissions(roleId, [permId]);
      }
    } catch {
      // Revert on failure
      if (isAssigned) newSet.add(permId); else newSet.delete(permId);
      setAssignedIds(new Set(newSet));
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl border-l border-gray-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-900" />
      </div>
    );
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl border-l border-gray-200 flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{role?.displayName || role?.name}</h2>
          <p className="text-sm text-gray-500">{assignedIds.size} permissions assigned</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {groups.map((group) => (
          <div key={group.id}>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              {group.displayName || group.groupName}
            </h3>
            <div className="space-y-2">
              {group.permissions.map((perm) => {
                const checked = assignedIds.has(perm.id);
                return (
                  <label
                    key={perm.id}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                      checked ? 'border-accent-500 bg-accent-50' : 'border-gray-200 hover:bg-gray-50',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePermission(perm.id)}
                      className="h-4 w-4 rounded border-gray-300 text-accent-600 focus:ring-accent-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {perm.displayName || perm.name}
                      </span>
                      <span className="block text-xs text-gray-500">{perm.name}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listRoles({ limit: '100' });
      const d = res.data as unknown as { items: RoleItem[] };
      if (d?.items) setRoles(d.items);
    } catch { /* handled */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const grouped = roles.reduce<Record<string, RoleItem[]>>((acc, r) => {
    const key = r.actorType;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  const groupOrder = ['ADMIN', 'CLIENT', 'SP', 'PARTNER'];

  return (
    <div>
      <PageHeader
        title="Roles"
        description="Manage roles and their permissions"
        breadcrumbs={[{ label: 'Super Admin', href: '/admin/super' }, { label: 'Roles' }]}
        actions={
          <Button onClick={() => setShowCreate(true)} className="bg-navy-900 hover:bg-navy-800">
            Create Role
          </Button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-900" />
        </div>
      ) : (
        <div className="space-y-8">
          {groupOrder.map((type) => {
            const items = grouped[type];
            if (!items || items.length === 0) return null;
            return (
              <div key={type}>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  {type} Roles ({items.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((role) => (
                    <Card key={role.id} className="hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {role.displayName || role.name}
                          </h3>
                          <p className="text-xs text-gray-500 font-mono">{role.name}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge variant={TYPE_VARIANT[role.actorType] ?? 'gray'}>
                            {role.actorType}
                          </Badge>
                          {role.isSystem && <Badge variant="gray">System</Badge>}
                        </div>
                      </div>

                      {role.description && (
                        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{role.description}</p>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{role._count.rolePermissions} permissions</span>
                        <span>{role._count.userRoles} users</span>
                      </div>

                      {role.parent && (
                        <p className="text-xs text-gray-400 mt-2">
                          Parent: {role.parent.displayName || role.parent.name}
                        </p>
                      )}

                      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingRoleId(role.id)}
                        >
                          Manage Permissions
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setShowCreate(false)} />
          <CreateRolePanel
            onClose={() => setShowCreate(false)}
            onCreated={(id) => {
              fetchRoles();
              setEditingRoleId(id);
            }}
          />
        </>
      )}

      {editingRoleId && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setEditingRoleId(null)} />
          <PermissionEditor
            roleId={editingRoleId}
            onClose={() => { setEditingRoleId(null); fetchRoles(); }}
          />
        </>
      )}
    </div>
  );
}
