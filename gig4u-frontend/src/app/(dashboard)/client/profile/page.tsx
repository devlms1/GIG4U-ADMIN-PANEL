'use client';

import { useEffect, useState, useCallback } from 'react';
import { profileApi } from '@/lib/api';
import { PageHeader, Card, Avatar, Badge, Button } from '@/components/ui';
import { FormField } from '@/components/forms/FormField';
import { cn } from '@/lib/utils';

interface ClientProfileData {
  userId: string;
  fullName: string | null;
  designation: string | null;
  department: string | null;
  clientRole: string;
  user: { phone: string; email: string | null };
  tenant: {
    id: string;
    companyName: string;
    segment: string;
    planTier: string;
    walletBalance: string;
  };
}

interface TeamMember {
  userId: string;
  fullName: string | null;
  clientRole: string;
  user: { id: string; phone: string; email: string | null; status: string };
}

export default function ClientProfilePage() {
  const [profile, setProfile] = useState<ClientProfileData | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm] = useState({ fullName: '', designation: '', department: '' });

  const fetchProfile = useCallback(async () => {
    try {
      const res = await profileApi.getClientProfile();
      const d = res.data as unknown as ClientProfileData;
      setProfile(d);
      setForm({
        fullName: d.fullName ?? '',
        designation: d.designation ?? '',
        department: d.department ?? '',
      });
    } catch { /* handled */ } finally {
      setLoading(false);
    }
  }, []);

  const fetchTeam = useCallback(async () => {
    try {
      const res = await profileApi.getClientTeam();
      setTeam(res.data as unknown as TeamMember[]);
    } catch { /* team might not be accessible for non-admins */ }
  }, []);

  useEffect(() => { fetchProfile(); fetchTeam(); }, [fetchProfile, fetchTeam]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, string> = {};
      for (const [k, v] of Object.entries(form)) { if (v) payload[k] = v; }
      await profileApi.updateClientProfile(payload);
      await fetchProfile();
      setToast('Profile updated');
      setTimeout(() => setToast(''), 3000);
    } catch {
      setToast('Failed to update profile');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const [invite, setInvite] = useState({ email: '', phone: '', clientRole: 'VIEWER' });
  const [inviting, setInviting] = useState(false);

  const handleInvite = async () => {
    setInviting(true);
    try {
      await profileApi.inviteTeamMember(invite);
      setShowInvite(false);
      setInvite({ email: '', phone: '', clientRole: 'VIEWER' });
      fetchTeam();
      setToast('Member invited');
      setTimeout(() => setToast(''), 3000);
    } catch {
      setToast('Failed to invite member');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setInviting(false);
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
        breadcrumbs={[{ label: 'Dashboard', href: '/client' }, { label: 'Profile' }]}
      />

      {toast && (
        <div className={cn(
          'mb-4 rounded-md p-3 text-sm',
          toast.includes('Failed') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
        )}>
          {toast}
        </div>
      )}

      {/* Profile header */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <Avatar name={profile.fullName || profile.tenant.companyName} size="xl" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {profile.fullName || 'Complete your profile'}
            </h2>
            <p className="text-sm text-gray-500">{profile.tenant.companyName}</p>
            <Badge variant="navy" className="mt-2">{profile.tenant.planTier}</Badge>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal info */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Personal Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Full Name" htmlFor="fullName">
                <input id="fullName" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </FormField>
              <FormField label="Designation" htmlFor="designation">
                <input id="designation" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
              </FormField>
              <FormField label="Department" htmlFor="department">
                <input id="department" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
              </FormField>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={handleSave} isLoading={saving} className="bg-navy-900 hover:bg-navy-800">Save Changes</Button>
            </div>
          </Card>

          {/* Team members */}
          {profile.clientRole === 'ADMIN' && (
            <Card
              title="Team Members"
              headerAction={
                <Button size="sm" onClick={() => setShowInvite(!showInvite)} className="bg-accent-500 hover:bg-accent-600">
                  Invite Member
                </Button>
              }
            >
              {showInvite && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input placeholder="Email" className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} />
                    <input placeholder="Phone (10 digits)" maxLength={10} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500" value={invite.phone} onChange={(e) => setInvite({ ...invite, phone: e.target.value })} />
                    <select className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white outline-none focus:border-accent-500" value={invite.clientRole} onChange={(e) => setInvite({ ...invite, clientRole: e.target.value })}>
                      <option value="MANAGER">Manager</option>
                      <option value="FINANCE">Finance</option>
                      <option value="VIEWER">Viewer</option>
                    </select>
                  </div>
                  <div className="flex justify-end">
                    <Button size="sm" onClick={handleInvite} isLoading={inviting} className="bg-navy-900 hover:bg-navy-800">Send Invite</Button>
                  </div>
                </div>
              )}

              {team.length === 0 ? (
                <p className="text-sm text-gray-500">No team members yet.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {team.map((m) => (
                    <div key={m.userId} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={m.fullName} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{m.fullName || m.user.phone}</p>
                          <p className="text-xs text-gray-500">{m.user.email || m.user.phone}</p>
                        </div>
                      </div>
                      <Badge variant={m.clientRole === 'ADMIN' ? 'navy' : m.clientRole === 'MANAGER' ? 'blue' : 'gray'}>
                        {m.clientRole}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Company info sidebar */}
        <div className="space-y-6">
          <Card title="Company">
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Company</span><span className="font-medium text-gray-900">{profile.tenant.companyName}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Segment</span><span className="font-medium text-gray-900">{profile.tenant.segment}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Plan</span><Badge variant="navy">{profile.tenant.planTier}</Badge></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Wallet</span><span className="font-bold text-success-500">&#8377;{parseFloat(profile.tenant.walletBalance).toLocaleString()}</span></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
