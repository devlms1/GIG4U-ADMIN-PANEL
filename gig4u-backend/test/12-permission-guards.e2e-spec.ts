import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { setupTestApp, teardownTestApp } from './setup';
import {
  createTestAdmin,
  createTestClient,
  createTestSP,
  cleanupUser,
  getAuthHeader,
} from './helpers/auth.helper';
import type { INestApplication } from '@nestjs/common';
import type { PrismaService } from '../src/prisma/prisma.service';

const PASSWORD = 'Test@123456';
const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret-32-chars-minimum-ok';

describe('Security → Permission Guards (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const createdUserIds: string[] = [];

  let superAdminToken: string;
  let kycAdminToken: string;
  let financeAdminToken: string;
  let supportAdminToken: string;
  let clientToken: string;
  let spToken: string;
  let supportAdminUserId: string;

  // A user that can be the target of status changes
  let targetUserId: string;

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
    prisma = setup.prisma;

    const stale = await prisma.user.findMany({
      where: { phone: { startsWith: '120000000' } },
      select: { id: true },
    });
    for (const u of stale) await cleanupUser(prisma, u.id);

    // Create one user per role
    const sa = await createTestAdmin(prisma, 'SUPER_ADMIN', '1200000001');
    superAdminToken = sa.accessToken;
    createdUserIds.push(sa.user.id);

    const kyc = await createTestAdmin(prisma, 'KYC_ADMIN', '1200000002');
    kycAdminToken = kyc.accessToken;
    createdUserIds.push(kyc.user.id);

    const fin = await createTestAdmin(prisma, 'FINANCE_ADMIN', '1200000003');
    financeAdminToken = fin.accessToken;
    createdUserIds.push(fin.user.id);

    const sup = await createTestAdmin(prisma, 'SUPPORT_ADMIN', '1200000004');
    supportAdminToken = sup.accessToken;
    supportAdminUserId = sup.user.id;
    createdUserIds.push(sup.user.id);

    const cl = await createTestClient(prisma, '1200000005');
    clientToken = cl.accessToken;
    createdUserIds.push(cl.user.id);

    const sp = await createTestSP(prisma, '1200000006');
    spToken = sp.accessToken;
    createdUserIds.push(sp.user.id);

    // Create a target user for status change tests
    const hash = await bcrypt.hash(PASSWORD, 4);
    const target = await prisma.user.create({
      data: { phone: '1200000009', passwordHash: hash, userType: 'SP' },
    });
    await prisma.spProfile.create({ data: { userId: target.id } });
    targetUserId = target.id;
    createdUserIds.push(targetUserId);
  }, 30000);

  afterAll(async () => {
    for (const id of createdUserIds) await cleanupUser(prisma, id);
    await teardownTestApp();
  });

  // ─── 12.1 — SUPER_ADMIN can access ALL admin endpoints ───────────────

  it('12.1 — SUPER_ADMIN can access all admin endpoints', async () => {
    const endpoints = [
      { method: 'get' as const, path: '/api/roles', expected: 200 },
      { method: 'get' as const, path: '/api/admin/users', expected: 200 },
      { method: 'get' as const, path: '/api/permissions', expected: 200 },
      { method: 'get' as const, path: '/api/admin/audit-logs', expected: 200 },
      { method: 'get' as const, path: '/api/admin/stats', expected: 200 },
    ];

    for (const ep of endpoints) {
      const res = await request(app.getHttpServer())
        [ep.method](ep.path)
        .set(getAuthHeader(superAdminToken));

      expect(res.status).toBe(ep.expected);
      expect(res.body.success).toBe(true);
    }
  });

  // ─── 12.2 — KYC_ADMIN access control ─────────────────────────────────

  it('12.2 — KYC_ADMIN is blocked from non-KYC endpoints', async () => {
    // KYC_ADMIN has: kyc:view, kyc:approve, kyc:reject, kyc:flag, users:view
    // Should be BLOCKED from roles:write, billing endpoints

    // Forbidden: POST /roles (requires roles:write)
    const rolesRes = await request(app.getHttpServer())
      .post('/api/roles')
      .set(getAuthHeader(kycAdminToken))
      .send({ name: 'KYC_TEST', displayName: 'Test', actorType: 'ADMIN' });
    expect(rolesRes.status).toBe(403);

    // Forbidden: GET /admin/stats (requires analytics:view_dashboard)
    const statsRes = await request(app.getHttpServer())
      .get('/api/admin/stats')
      .set(getAuthHeader(kycAdminToken));
    expect(statsRes.status).toBe(403);

    // Allowed: GET /admin/users (requires users:list — KYC_ADMIN has users:view but NOT users:list)
    const usersRes = await request(app.getHttpServer())
      .get('/api/admin/users')
      .set(getAuthHeader(kycAdminToken));
    expect(usersRes.status).toBe(403);
  });

  // ─── 12.3 — FINANCE_ADMIN access control ─────────────────────────────

  it('12.3 — FINANCE_ADMIN can access stats but not roles', async () => {
    // FINANCE_ADMIN has: billing:view, billing:process_payout, billing:generate_invoice,
    //                    billing:refund, analytics:view_dashboard

    // Allowed: GET /admin/stats (has analytics:view_dashboard)
    const statsRes = await request(app.getHttpServer())
      .get('/api/admin/stats')
      .set(getAuthHeader(financeAdminToken));
    expect(statsRes.status).toBe(200);

    // Forbidden: POST /roles (no roles:write)
    const rolesRes = await request(app.getHttpServer())
      .post('/api/roles')
      .set(getAuthHeader(financeAdminToken))
      .send({ name: 'FIN_TEST', displayName: 'Test', actorType: 'ADMIN' });
    expect(rolesRes.status).toBe(403);

    // Forbidden: GET /admin/users (no users:list)
    const usersRes = await request(app.getHttpServer())
      .get('/api/admin/users')
      .set(getAuthHeader(financeAdminToken));
    expect(usersRes.status).toBe(403);
  });

  // ─── 12.4 — CLIENT blocked from all /admin/* ─────────────────────────

  it('12.4 — CLIENT user cannot access any admin endpoint', async () => {
    const adminEndpoints = [
      '/api/roles',
      '/api/admin/users',
      '/api/admin/stats',
      '/api/admin/audit-logs',
      '/api/permissions',
    ];

    for (const path of adminEndpoints) {
      const res = await request(app.getHttpServer())
        .get(path)
        .set(getAuthHeader(clientToken));

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    }
  });

  // ─── 12.5 — SP blocked from all /admin/* ──────────────────────────────

  it('12.5 — SP user cannot access any admin endpoint', async () => {
    const adminEndpoints = [
      '/api/roles',
      '/api/admin/users',
      '/api/admin/stats',
    ];

    for (const path of adminEndpoints) {
      const res = await request(app.getHttpServer())
        .get(path)
        .set(getAuthHeader(spToken));

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    }
  });

  // ─── 12.6 — Unauthenticated requests blocked ─────────────────────────

  it('12.6 — Unauthenticated requests return 401 on all protected routes', async () => {
    const protectedEndpoints = [
      '/api/auth/me',
      '/api/sp/profile',
      '/api/client/profile',
      '/api/admin/profile',
      '/api/roles',
    ];

    for (const path of protectedEndpoints) {
      const res = await request(app.getHttpServer()).get(path);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    }
  });

  // ─── 12.7 — SUPPORT_ADMIN can ban but not create admin ───────────────

  it('12.7 — SUPPORT_ADMIN can ban users but cannot create admins', async () => {
    // Allowed: PATCH /admin/users/:id/status (has users:ban)
    const banRes = await request(app.getHttpServer())
      .patch(`/api/admin/users/${targetUserId}/status`)
      .set(getAuthHeader(supportAdminToken))
      .send({ status: 'BANNED', reason: 'Test ban' });
    expect(banRes.status).toBe(200);
    expect(banRes.body.success).toBe(true);

    // Reset status back to ACTIVE for cleanup
    await prisma.user.update({
      where: { id: targetUserId },
      data: { status: 'ACTIVE' },
    });

    // Forbidden: POST /admin/users/create-admin (requires users:create_admin)
    const createRes = await request(app.getHttpServer())
      .post('/api/admin/users/create-admin')
      .set(getAuthHeader(supportAdminToken))
      .send({ phone: '1200000099', password: PASSWORD, fullName: 'NoAccess' });
    expect(createRes.status).toBe(403);
  });

  // ─── 12.8 — Fine-grained: per-action permission check ────────────────

  it('12.8 — Permission check is per-action, not per-module', async () => {
    // KYC_ADMIN has kyc:view but let's verify the token has specific perms
    const payload = JSON.parse(
      Buffer.from(kycAdminToken.split('.')[1], 'base64url').toString(),
    );

    expect(payload.permissions).toContain('kyc:view');
    expect(payload.permissions).toContain('kyc:approve');
    expect(payload.permissions).toContain('kyc:flag');

    // But does NOT have users:ban
    expect(payload.permissions).not.toContain('users:ban');

    // Verify at API level: cannot ban users
    const banRes = await request(app.getHttpServer())
      .patch(`/api/admin/users/${targetUserId}/status`)
      .set(getAuthHeader(kycAdminToken))
      .send({ status: 'BANNED' });
    expect(banRes.status).toBe(403);

    // But can view users (has users:view — though GET /admin/users requires users:list)
    // This confirms the guard checks the specific permission, not the module
  });

  // ─── 12.9 — SUPER_ADMIN bypasses all permission checks ───────────────

  it('12.9 — SUPER_ADMIN bypasses all permission checks', async () => {
    const jwtService = new JwtService({});

    // Create a token that claims SUPER_ADMIN role but has ZERO permissions
    const bypassToken = jwtService.sign(
      {
        sub: createdUserIds[0], // superAdmin user ID
        userType: 'ADMIN',
        roles: ['SUPER_ADMIN'],
        permissions: [], // empty permissions!
        tenantId: null,
      },
      { secret: JWT_SECRET, expiresIn: '15m' },
    );

    // Despite having no permissions array, SUPER_ADMIN role should bypass
    const res = await request(app.getHttpServer())
      .get('/api/admin/users')
      .set(getAuthHeader(bypassToken));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Also test a write endpoint
    const auditRes = await request(app.getHttpServer())
      .get('/api/admin/audit-logs')
      .set(getAuthHeader(bypassToken));

    expect(auditRes.status).toBe(200);
  });
});
