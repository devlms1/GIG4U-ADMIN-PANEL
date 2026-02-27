import request from 'supertest';
import { setupTestApp, teardownTestApp } from './setup';
import {
  createTestAdmin,
  createTestClient,
  cleanupUser,
  getAuthHeader,
} from './helpers/auth.helper';
import type { INestApplication } from '@nestjs/common';
import type { PrismaService } from '../src/prisma/prisma.service';

describe('RBAC → Role Management (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const createdUserIds: string[] = [];

  let superAdminToken: string;
  let superAdminUserId: string;
  let customRoleId: string;
  let kycViewPermId: string;
  let kycApprovePermId: string;

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
    prisma = setup.prisma;

    const stale = await prisma.user.findMany({
      where: { phone: { startsWith: '100000000' } },
      select: { id: true },
    });
    for (const u of stale) await cleanupUser(prisma, u.id);

    // Clean up test role from previous runs
    await prisma.rolePermission.deleteMany({
      where: { role: { name: 'TEST_CUSTOM_ROLE' } },
    });
    await prisma.userRole.deleteMany({
      where: { role: { name: 'TEST_CUSTOM_ROLE' } },
    });
    await prisma.role.deleteMany({ where: { name: 'TEST_CUSTOM_ROLE' } });

    const admin = await createTestAdmin(prisma, 'SUPER_ADMIN', '1000000001');
    superAdminToken = admin.accessToken;
    superAdminUserId = admin.user.id;
    createdUserIds.push(superAdminUserId);

    // Fetch permission IDs for later tests
    const kycView = await prisma.permission.findUnique({ where: { name: 'kyc:view' } });
    const kycApprove = await prisma.permission.findUnique({ where: { name: 'kyc:approve' } });
    kycViewPermId = kycView!.id;
    kycApprovePermId = kycApprove!.id;
  }, 30000);

  afterAll(async () => {
    // Clean up custom role
    await prisma.rolePermission.deleteMany({
      where: { role: { name: 'TEST_CUSTOM_ROLE' } },
    });
    await prisma.userRole.deleteMany({
      where: { role: { name: 'TEST_CUSTOM_ROLE' } },
    });
    await prisma.role.deleteMany({ where: { name: 'TEST_CUSTOM_ROLE' } });

    for (const id of createdUserIds) await cleanupUser(prisma, id);
    await teardownTestApp();
  });

  // ─── 10.1 — Create a new role ────────────────────────────────────────

  it('10.1 — Super Admin can create a new role', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/roles')
      .set(getAuthHeader(superAdminToken))
      .send({
        name: 'TEST_CUSTOM_ROLE',
        displayName: 'Test Custom Role',
        description: 'Created during testing',
        actorType: 'ADMIN',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('TEST_CUSTOM_ROLE');
    expect(res.body.data.isSystem).toBe(false);

    customRoleId = res.body.data.id;
  });

  // ─── 10.2 — Role appears in list ─────────────────────────────────────

  it('10.2 — Created role appears in role list', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/roles')
      .query({ limit: '100' })
      .set(getAuthHeader(superAdminToken))
      .expect(200);

    // Verify the role exists in the DB
    const dbRole = await prisma.role.findUnique({ where: { name: 'TEST_CUSTOM_ROLE' } });
    expect(dbRole).not.toBeNull();
    expect(dbRole!.deletedAt).toBeNull();

    // Verify via GET /roles/:id (single role fetch — avoids list pagination issues)
    const detailRes = await request(app.getHttpServer())
      .get(`/api/roles/${customRoleId}`)
      .set(getAuthHeader(superAdminToken))
      .expect(200);

    expect(detailRes.body.success).toBe(true);
    expect(detailRes.body.data.name).toBe('TEST_CUSTOM_ROLE');
  });

  // ─── 10.3 — Duplicate name rejected ──────────────────────────────────

  it('10.3 — Duplicate role name rejected', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/roles')
      .set(getAuthHeader(superAdminToken))
      .send({
        name: 'TEST_CUSTOM_ROLE',
        displayName: 'Dup Role',
        actorType: 'ADMIN',
      })
      .expect(409);

    expect(res.body.success).toBe(false);
  });

  // ─── 10.4 — Name validation ──────────────────────────────────────────

  it('10.4 — Role name must be SCREAMING_SNAKE_CASE', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/roles')
      .set(getAuthHeader(superAdminToken))
      .send({
        name: 'invalid role name',
        displayName: 'Invalid',
        actorType: 'ADMIN',
      })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  // ─── 10.5 — Update display name ──────────────────────────────────────

  it('10.5 — Super Admin can update role display name', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/roles/${customRoleId}`)
      .set(getAuthHeader(superAdminToken))
      .send({ displayName: 'Updated Display Name' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.displayName).toBe('Updated Display Name');
  });

  // ─── 10.6 — Cannot update system role restricted fields ──────────────

  it('10.6 — Forbidden fields on system roles are stripped by whitelist', async () => {
    const superAdminRole = await prisma.role.findUnique({
      where: { name: 'SUPER_ADMIN' },
    });

    // UpdateRoleDto only allows displayName, description, isActive
    // 'name' is not in the DTO → stripped by whitelist → returns 400 (forbidNonWhitelisted)
    const res = await request(app.getHttpServer())
      .patch(`/api/roles/${superAdminRole!.id}`)
      .set(getAuthHeader(superAdminToken))
      .send({ name: 'HACKED_ROLE' })
      .expect(400);

    expect(res.body.success).toBe(false);

    // Verify name unchanged
    const after = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
    expect(after).not.toBeNull();
  });

  // ─── 10.7 — Assign permissions to role ────────────────────────────────

  it('10.7 — Super Admin can assign permissions to a role', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/roles/${customRoleId}/permissions`)
      .set(getAuthHeader(superAdminToken))
      .send({ permissionIds: [kycViewPermId, kycApprovePermId] })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.assigned).toBe(2);

    const count = await prisma.rolePermission.count({
      where: { roleId: customRoleId },
    });
    expect(count).toBe(2);
  });

  // ─── 10.8 — Permissions appear on role fetch ─────────────────────────

  it('10.8 — Assigned permissions appear on role detail fetch', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/roles/${customRoleId}`)
      .set(getAuthHeader(superAdminToken))
      .expect(200);

    expect(res.body.success).toBe(true);

    const permNames = res.body.data.rolePermissions.map(
      (rp: { permission: { name: string } }) => rp.permission.name,
    );
    expect(permNames).toContain('kyc:view');
    expect(permNames).toContain('kyc:approve');
  });

  // ─── 10.9 — Revoke permission from role ──────────────────────────────

  it('10.9 — Super Admin can revoke permissions from a role', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/api/roles/${customRoleId}/permissions`)
      .set(getAuthHeader(superAdminToken))
      .send({ permissionIds: [kycApprovePermId] })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.removed).toBe(1);

    const count = await prisma.rolePermission.count({
      where: { roleId: customRoleId },
    });
    expect(count).toBe(1);
  });

  // ─── 10.10 — Soft-delete custom role ─────────────────────────────────

  it('10.10 — Super Admin can soft-delete a custom role', async () => {
    // Remove remaining permissions first so deletion is not blocked
    await prisma.rolePermission.deleteMany({
      where: { roleId: customRoleId },
    });

    const res = await request(app.getHttpServer())
      .delete(`/api/roles/${customRoleId}`)
      .set(getAuthHeader(superAdminToken))
      .expect(200);

    expect(res.body.success).toBe(true);

    const role = await prisma.role.findUnique({
      where: { id: customRoleId },
    });
    expect(role!.deletedAt).not.toBeNull();
  });

  // ─── 10.11 — Cannot delete system role ────────────────────────────────

  it('10.11 — Cannot delete a system role', async () => {
    const superAdminRole = await prisma.role.findUnique({
      where: { name: 'SUPER_ADMIN' },
    });

    const res = await request(app.getHttpServer())
      .delete(`/api/roles/${superAdminRole!.id}`)
      .set(getAuthHeader(superAdminToken))
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.message.toLowerCase()).toMatch(/system/);
  });

  // ─── 10.12 — KYC_ADMIN cannot manage roles ───────────────────────────

  it('10.12 — KYC_ADMIN cannot create roles', async () => {
    const kycAdmin = await createTestAdmin(prisma, 'KYC_ADMIN', '1000000002');
    createdUserIds.push(kycAdmin.user.id);

    const res = await request(app.getHttpServer())
      .post('/api/roles')
      .set(getAuthHeader(kycAdmin.accessToken))
      .send({
        name: 'UNAUTHORIZED_ROLE',
        displayName: 'Nope',
        actorType: 'ADMIN',
      })
      .expect(403);

    expect(res.body.success).toBe(false);
  });

  // ─── 10.13 — CLIENT cannot manage roles ───────────────────────────────

  it('10.13 — Non-admin user cannot access role management', async () => {
    const client = await createTestClient(prisma, '1000000003');
    createdUserIds.push(client.user.id);

    const res = await request(app.getHttpServer())
      .post('/api/roles')
      .set(getAuthHeader(client.accessToken))
      .send({
        name: 'CLIENT_ROLE',
        displayName: 'Nope',
        actorType: 'CLIENT',
      })
      .expect(403);

    expect(res.body.success).toBe(false);
  });
});
