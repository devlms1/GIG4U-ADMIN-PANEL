'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/lib/api';
import { PageHeader, Card, Badge, StatusBadge, Button } from '@/components/ui';

interface UserRow {
  id: string;
  phone: string;
  email: string | null;
  userType: string;
  status: string;
  createdAt: string;
}

interface UsersResponse {
  items: UserRow[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const USER_TYPE_VARIANT: Record<string, 'navy' | 'blue' | 'green' | 'gray'> = {
  ADMIN: 'navy',
  CLIENT: 'blue',
  SP: 'green',
  PARTNER: 'gray',
};

// ─── Create Admin Modal ─────────────────────────────────────────────────

function CreateAdminModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', password: '', employeeId: '', department: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!form.phone || !form.password || !form.fullName) {
      setError('Full name, phone, and password are required');
      return;
    }
    setSubmitting(true);
    try {
      await adminApi.createAdmin({
        phone: form.phone,
        email: form.email || undefined,
        password: form.password,
        fullName: form.fullName,
        employeeId: form.employeeId || undefined,
        department: form.department || undefined,
      });
      onCreated();
      onClose();
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { message?: string } } };
      setError(axErr.response?.data?.message || 'Failed to create admin');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Create Admin User</h2>
        {error && (
          <div className="mb-3 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
        )}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
              <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input maxLength={10} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input type="password" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} isLoading={submitting} className="bg-navy-900 hover:bg-navy-800">Create Admin</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filters, setFilters] = useState({ userType: '', status: '', search: '', page: '1' });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: filters.page, limit: '15' };
      if (filters.userType) params.userType = filters.userType;
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      const res = await adminApi.listUsers(params);
      const d = res.data as unknown as UsersResponse;
      if (d?.items) {
        setUsers(d.items);
        setMeta({ total: d.meta.total, page: d.meta.page, totalPages: d.meta.totalPages });
      }
    } catch { /* handled */ } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  return (
    <div>
      <PageHeader
        title="Users"
        description={`${meta.total} total users`}
        breadcrumbs={[
          { label: 'Super Admin', href: '/admin/super' },
          { label: 'Users' },
        ]}
        actions={
          <Button onClick={() => setShowCreate(true)} className="bg-navy-900 hover:bg-navy-800">
            Create Admin
          </Button>
        }
      />

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-wrap gap-3">
          <input
            placeholder="Search phone or email..."
            className="rounded-md border border-gray-300 px-3 py-2 text-sm w-64 outline-none focus:border-accent-500"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: '1' })}
          />
          <select
            className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white outline-none focus:border-accent-500"
            value={filters.userType}
            onChange={(e) => setFilters({ ...filters, userType: e.target.value, page: '1' })}
          >
            <option value="">All Types</option>
            <option value="CLIENT">Client</option>
            <option value="SP">Service Provider</option>
            <option value="ADMIN">Admin</option>
          </select>
          <select
            className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white outline-none focus:border-accent-500"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: '1' })}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="BANNED">Banned</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left font-medium text-gray-500">Phone</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Email</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Type</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Created</th>
                <th className="px-6 py-3 text-right font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">No users found</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{u.phone}</td>
                    <td className="px-6 py-4 text-gray-500">{u.email || '—'}</td>
                    <td className="px-6 py-4">
                      <Badge variant={USER_TYPE_VARIANT[u.userType] ?? 'gray'}>{u.userType}</Badge>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={u.status} /></td>
                    <td className="px-6 py-4 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <Button size="sm" variant="ghost" className="text-xs">View</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
            <span className="text-sm text-gray-500">
              Page {meta.page} of {meta.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={meta.page <= 1}
                onClick={() => setFilters({ ...filters, page: String(meta.page - 1) })}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={meta.page >= meta.totalPages}
                onClick={() => setFilters({ ...filters, page: String(meta.page + 1) })}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {showCreate && (
        <CreateAdminModal
          onClose={() => setShowCreate(false)}
          onCreated={fetchUsers}
        />
      )}
    </div>
  );
}
