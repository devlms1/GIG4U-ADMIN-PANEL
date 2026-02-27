import { apiClient } from './client';
import type { ApiResponse } from '@/types/api';

export const adminApi = {
  // ─── Users ──────────────────────────────────────────────────────────────

  async listUsers(params?: Record<string, string>) {
    const { data } = await apiClient.get<ApiResponse<Record<string, unknown>>>('/admin/users', { params });
    return data;
  },

  async getUser(userId: string) {
    const { data } = await apiClient.get<ApiResponse<Record<string, unknown>>>(`/admin/users/${userId}`);
    return data;
  },

  async updateUserStatus(userId: string, payload: { status: string; reason?: string }) {
    const { data } = await apiClient.patch<ApiResponse<Record<string, unknown>>>(
      `/admin/users/${userId}/status`,
      payload,
    );
    return data;
  },

  async createAdmin(payload: {
    phone: string;
    email?: string;
    password: string;
    fullName: string;
    employeeId?: string;
    department?: string;
  }) {
    const { data } = await apiClient.post<ApiResponse<Record<string, unknown>>>(
      '/admin/users/create-admin',
      payload,
    );
    return data;
  },

  async getStats() {
    const { data } = await apiClient.get<ApiResponse<Record<string, unknown>>>('/admin/stats');
    return data;
  },

  // ─── Roles ──────────────────────────────────────────────────────────────

  async listRoles(params?: Record<string, string>) {
    const { data } = await apiClient.get<ApiResponse<Record<string, unknown>>>('/roles', { params });
    return data;
  },

  async getRole(id: string) {
    const { data } = await apiClient.get<ApiResponse<Record<string, unknown>>>(`/roles/${id}`);
    return data;
  },

  async createRole(payload: {
    name: string;
    displayName: string;
    description?: string;
    actorType: string;
    parentId?: string;
  }) {
    const { data } = await apiClient.post<ApiResponse<Record<string, unknown>>>('/roles', payload);
    return data;
  },

  async deleteRole(id: string) {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/roles/${id}`);
    return data;
  },

  // ─── Permissions ────────────────────────────────────────────────────────

  async listPermissions() {
    const { data } = await apiClient.get<ApiResponse<Record<string, unknown>>>('/permissions');
    return data;
  },

  async assignPermissions(roleId: string, permissionIds: string[]) {
    const { data } = await apiClient.post<ApiResponse<Record<string, unknown>>>(
      `/roles/${roleId}/permissions`,
      { permissionIds },
    );
    return data;
  },

  async revokePermissions(roleId: string, permissionIds: string[]) {
    const { data } = await apiClient.delete<ApiResponse<Record<string, unknown>>>(
      `/roles/${roleId}/permissions`,
      { data: { permissionIds } },
    );
    return data;
  },

  async assignRoleToUser(userId: string, payload: { roleId: string; tenantId?: string }) {
    const { data } = await apiClient.post<ApiResponse<Record<string, unknown>>>(
      `/users/${userId}/roles`,
      payload,
    );
    return data;
  },

  async revokeRoleFromUser(userId: string, roleId: string) {
    const { data } = await apiClient.delete<ApiResponse<null>>(
      `/users/${userId}/roles/${roleId}`,
    );
    return data;
  },

  // ─── Audit ──────────────────────────────────────────────────────────────

  async listAuditLogs(params?: Record<string, string>) {
    const { data } = await apiClient.get<ApiResponse<Record<string, unknown>>>('/admin/audit-logs', { params });
    return data;
  },
};
