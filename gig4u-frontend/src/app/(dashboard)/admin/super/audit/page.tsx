'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/lib/api';
import { PageHeader, Card, Badge, Button } from '@/components/ui';
import { cn } from '@/lib/utils';

interface AuditEntry {
  id: string;
  actorUserId: string | null;
  actorRole: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

const ACTION_COLORS: Record<string, { variant: 'green' | 'red' | 'yellow' | 'blue' | 'gray'; dot: string }> = {
  ROLE_CREATED: { variant: 'green', dot: 'bg-green-500' },
  ROLE_UPDATED: { variant: 'yellow', dot: 'bg-yellow-500' },
  ROLE_DELETED: { variant: 'red', dot: 'bg-red-500' },
  SP_PROFILE_UPDATED: { variant: 'yellow', dot: 'bg-yellow-500' },
  PERMISSIONS_ASSIGNED_TO_ROLE: { variant: 'blue', dot: 'bg-blue-500' },
  PERMISSIONS_REVOKED_FROM_ROLE: { variant: 'red', dot: 'bg-red-500' },
  ROLE_ASSIGNED_TO_USER: { variant: 'blue', dot: 'bg-blue-500' },
  ROLE_REVOKED_FROM_USER: { variant: 'red', dot: 'bg-red-500' },
};

function getActionStyle(action: string) {
  return ACTION_COLORS[action] ?? { variant: 'gray' as const, dot: 'bg-gray-400' };
}

function formatAction(action: string): string {
  return action
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({ action: '', startDate: '', endDate: '' });

  const fetchLogs = useCallback(async (pageNum: number, append = false) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(pageNum),
        limit: '20',
      };
      if (filters.action) params.action = filters.action;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const res = await adminApi.listAuditLogs(params);
      const d = res.data as unknown as { items: AuditEntry[]; meta: { totalPages: number } };

      if (d?.items) {
        setLogs(append ? (prev) => [...prev, ...d.items] : d.items);
        setHasMore(pageNum < (d.meta?.totalPages ?? 1));
      }
    } catch {
      if (!append) setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    setPage(1);
    fetchLogs(1);
  }, [fetchLogs]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchLogs(next, true);
  };

  const actionTypes = [
    'ROLE_CREATED', 'ROLE_UPDATED', 'ROLE_DELETED',
    'PERMISSIONS_ASSIGNED_TO_ROLE', 'PERMISSIONS_REVOKED_FROM_ROLE',
    'ROLE_ASSIGNED_TO_USER', 'ROLE_REVOKED_FROM_USER',
    'SP_PROFILE_UPDATED',
  ];

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description="Track all platform activity"
        breadcrumbs={[{ label: 'Super Admin', href: '/admin/super' }, { label: 'Audit Logs' }]}
      />

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-wrap gap-3">
          <select
            className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white outline-none focus:border-accent-500"
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          >
            <option value="">All Actions</option>
            {actionTypes.map((a) => (
              <option key={a} value={a}>
                {formatAction(a)}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            placeholder="From"
          />
          <input
            type="date"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent-500"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            placeholder="To"
          />
          {(filters.action || filters.startDate || filters.endDate) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setFilters({ action: '', startDate: '', endDate: '' })}
            >
              Clear
            </Button>
          )}
        </div>
      </Card>

      {/* Timeline */}
      <Card>
        {loading && logs.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-900" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-center text-gray-400 py-12">No audit logs found</p>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />

            <div className="space-y-0">
              {logs.map((log, i) => {
                const style = getActionStyle(log.action);
                const prevDate = i > 0 ? new Date(logs[i - 1].createdAt).toDateString() : null;
                const currDate = new Date(log.createdAt).toDateString();
                const showDateHeader = currDate !== prevDate;

                return (
                  <div key={log.id}>
                    {showDateHeader && (
                      <div className="relative pl-12 py-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          {new Date(log.createdAt).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    )}

                    <div className="relative flex items-start gap-4 pl-12 py-3 hover:bg-gray-50 transition-colors rounded-lg">
                      {/* Dot */}
                      <div
                        className={cn(
                          'absolute left-2.5 top-5 w-3 h-3 rounded-full border-2 border-white',
                          style.dot,
                        )}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={style.variant}>
                            {formatAction(log.action)}
                          </Badge>
                          {log.targetType && (
                            <span className="text-xs text-gray-500">
                              on {log.targetType}
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </span>
                          {log.actorUserId && (
                            <span className="font-mono truncate max-w-[200px]" title={log.actorUserId}>
                              Actor: {log.actorUserId.slice(0, 8)}...
                            </span>
                          )}
                          {log.actorRole && (
                            <span>Role: {log.actorRole}</span>
                          )}
                          {log.ipAddress && (
                            <span>IP: {log.ipAddress}</span>
                          )}
                        </div>

                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <pre className="mt-1.5 text-xs text-gray-400 bg-gray-50 rounded px-2 py-1 overflow-x-auto max-w-full">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="pt-4 flex justify-center">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  isLoading={loading}
                >
                  Load More
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
