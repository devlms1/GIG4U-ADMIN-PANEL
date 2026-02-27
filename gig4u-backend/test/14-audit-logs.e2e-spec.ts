import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { setupTestApp, teardownTestApp } from './setup';
import {
  createTestAdmin,
  createTestSP,
  cleanupUser,
  getAuthHeader,
} from './helpers/auth.helper';
import type { INestApplication } from '@nestjs/common';
import type { PrismaService } from '../src/prisma/prisma.service';

const PASSWORD = 'Test@123456';

describe('Audit Logs (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const createdUserIds: string[] = [];

  let superAdminToken: string;
  let superAdminUserId: string;

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
    prisma = setup.prisma;

    const stale = await prisma.user.findMany({
      where: { phone: { startsWith: '140000000' } },
      select: { id: true },
    });
    for (const u of stale) await cleanupUser(prisma, u.id);

    const sa = await createTestAdmin(prisma, 'SUPER_ADMIN', '1400000001');
    superAdminToken = sa.accessToken;
    superAdminUserId = sa.user.id;
    createdUserIds.push(superAdminUserId);
  }, 30000);

  afterAll(async () => {
    // Clean up test role
    await prisma.rolePermission.deleteMany({ where: { role: { name: 'AUDIT_TEST_ROLE' } } });
    await prisma.userRole.deleteMany({ where: { role: { name: 'AUDIT_TEST_ROLE' } } });
    await prisma.role.deleteMany({ where: { name: 'AUDIT_TEST_ROLE' } });

    for (const id of createdUserIds) await cleanupUser(prisma, id);
    await teardownTestApp();
  });

  // ─── 14.1 — User ban creates audit log ───────────────────────────────

  it('14.1 — User ban creates audit log', async () => {
    const hash = await bcrypt.hash(PASSWORD, 4);
    const target = await prisma.user.create({
      data: { phone: '1400000002', passwordHash: hash, userType: 'SP' },
    });
    await prisma.spProfile.create({ data: { userId: target.id } });
    createdUserIds.push(target.id);

    await request(app.getHttpServer())
      .patch(`/api/admin/users/${target.id}/status`)
      .set(getAuthHeader(superAdminToken))
      .send({ status: 'BANNED', reason: 'Audit test ban' })
      .expect(200);

    const log = await prisma.auditLog.findFirst({
      where: { targetId: target.id, action: 'USER_STATUS_CHANGED' },
      orderBy: { createdAt: 'desc' },
    });

    expect(log).not.toBeNull();
    expect(log!.actorUserId).toBe(superAdminUserId);
  });

  // ─── 14.2 — Role creation creates audit log ──────────────────────────

  it('14.2 — Role creation creates audit log', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/roles')
      .set(getAuthHeader(superAdminToken))
      .send({
        name: 'AUDIT_TEST_ROLE',
        displayName: 'Audit Test Role',
        actorType: 'ADMIN',
      })
      .expect(201);

    const roleId = res.body.data.id;

    const log = await prisma.auditLog.findFirst({
      where: { targetId: roleId, action: 'ROLE_CREATED' },
    });

    expect(log).not.toBeNull();
    expect(log!.actorUserId).toBe(superAdminUserId);

    const metadata = log!.metadata as Record<string, unknown>;
    expect(metadata.roleName).toBe('AUDIT_TEST_ROLE');
  });

  // ─── 14.3 — Permission assignment creates audit log ──────────────────

  it('14.3 — Permission assignment creates audit log', async () => {
    const role = await prisma.role.findUnique({ where: { name: 'AUDIT_TEST_ROLE' } });
    const perm = await prisma.permission.findUnique({ where: { name: 'kyc:view' } });

    await request(app.getHttpServer())
      .post(`/api/roles/${role!.id}/permissions`)
      .set(getAuthHeader(superAdminToken))
      .send({ permissionIds: [perm!.id] })
      .expect(200);

    const log = await prisma.auditLog.findFirst({
      where: { targetId: role!.id, action: 'PERMISSIONS_ASSIGNED_TO_ROLE' },
    });

    expect(log).not.toBeNull();
    expect(log!.actorUserId).toBe(superAdminUserId);

    const metadata = log!.metadata as Record<string, unknown>;
    expect(metadata.permissionIds).toBeDefined();
  });

  // ─── 14.4 — SP profile update creates audit log ──────────────────────

  it('14.4 — SP profile update creates audit log', async () => {
    const sp = await createTestSP(prisma, '1400000003');
    createdUserIds.push(sp.user.id);

    await request(app.getHttpServer())
      .patch('/api/sp/profile')
      .set(getAuthHeader(sp.accessToken))
      .send({ fullName: 'Audit Test SP' })
      .expect(200);

    const log = await prisma.auditLog.findFirst({
      where: { targetId: sp.user.id, action: 'SP_PROFILE_UPDATED' },
    });

    expect(log).not.toBeNull();
    expect(log!.actorUserId).toBe(sp.user.id);

    const metadata = log!.metadata as Record<string, unknown>;
    expect(metadata.updatedFields).toBeDefined();
  });

  // ─── 14.5 — Audit logs cannot be deleted via API ─────────────────────

  it('14.5 — No DELETE endpoint exists for audit logs', async () => {
    const anyLog = await prisma.auditLog.findFirst();

    const res = await request(app.getHttpServer())
      .delete(`/api/admin/audit-logs/${anyLog!.id}`)
      .set(getAuthHeader(superAdminToken));

    // Expect 404 (route doesn't exist) or 405 (method not allowed)
    expect([404, 405]).toContain(res.status);
  });

  // ─── 14.6 — Audit logs cannot be updated via API ─────────────────────

  it('14.6 — No PATCH endpoint exists for audit logs', async () => {
    const anyLog = await prisma.auditLog.findFirst();

    const res = await request(app.getHttpServer())
      .patch(`/api/admin/audit-logs/${anyLog!.id}`)
      .set(getAuthHeader(superAdminToken))
      .send({ action: 'MODIFIED' });

    expect([404, 405]).toContain(res.status);
  });

  // ─── 14.7 — Query with date range ────────────────────────────────────

  it('14.7 — Audit log query with date range works', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/audit-logs')
      .query({ startDate: '2024-01-01', endDate: '2099-12-31' })
      .set(getAuthHeader(superAdminToken))
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.items.length).toBeGreaterThan(0);
  });

  // ─── 14.8 — Correct entry structure ──────────────────────────────────

  it('14.8 — Audit log entries have correct structure', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/audit-logs')
      .query({ limit: 1 })
      .set(getAuthHeader(superAdminToken))
      .expect(200);

    expect(res.body.data.items.length).toBeGreaterThan(0);

    const entry = res.body.data.items[0];
    expect(entry).toHaveProperty('id');
    expect(entry).toHaveProperty('action');
    expect(entry).toHaveProperty('createdAt');
    // actorUserId, actorRole, targetType, targetId may be null but should be present as keys
    expect('actorUserId' in entry).toBe(true);
    expect('targetType' in entry).toBe(true);
    expect('targetId' in entry).toBe(true);
  });
});
