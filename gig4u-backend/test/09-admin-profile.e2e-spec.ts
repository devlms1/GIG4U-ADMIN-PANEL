import request from 'supertest';
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

describe('Admin Profile (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const createdUserIds: string[] = [];

  let adminToken: string;
  let adminUserId: string;

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
    prisma = setup.prisma;

    const stale = await prisma.user.findMany({
      where: { phone: { startsWith: '090000000' } },
      select: { id: true },
    });
    for (const u of stale) await cleanupUser(prisma, u.id);

    // Clear any leftover employeeIds from previous runs
    await prisma.adminProfile.updateMany({
      where: { employeeId: { in: ['EMP001', 'EMP002'] } },
      data: { employeeId: null },
    });

    const admin = await createTestAdmin(prisma, 'KYC_ADMIN', '0900000001');
    adminToken = admin.accessToken;
    adminUserId = admin.user.id;
    createdUserIds.push(adminUserId);
  }, 30000);

  afterAll(async () => {
    for (const id of createdUserIds) await cleanupUser(prisma, id);
    await teardownTestApp();
  });

  // ─── 9.1 — Admin can fetch own profile ───────────────────────────────

  it('9.1 — Admin can fetch their own profile', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/profile')
      .set(getAuthHeader(adminToken))
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.userId).toBe(adminUserId);
    expect(res.body.data.activeRole).toBeDefined();
    expect(res.body.data.activeRole.name).toBe('KYC_ADMIN');
  });

  // ─── 9.2 — Admin profile update ──────────────────────────────────────

  it('9.2 — Admin can update their profile', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/admin/profile')
      .set(getAuthHeader(adminToken))
      .send({
        fullName: 'KYC Admin User',
        department: 'Verification Team',
        employeeId: 'EMP001',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.fullName).toBe('KYC Admin User');
    expect(res.body.data.department).toBe('Verification Team');
    expect(res.body.data.employeeId).toBe('EMP001');
  });

  // ─── 9.3 — Duplicate employeeId rejected ─────────────────────────────

  it('9.3 — Duplicate employeeId is rejected', async () => {
    const admin2 = await createTestAdmin(prisma, 'SUPPORT_ADMIN', '0900000002');
    createdUserIds.push(admin2.user.id);

    const res = await request(app.getHttpServer())
      .patch('/api/admin/profile')
      .set(getAuthHeader(admin2.accessToken))
      .send({ employeeId: 'EMP001' })
      .expect(409);

    expect(res.body.success).toBe(false);
    expect(res.body.message.toLowerCase()).toMatch(/already|exists|unique|constraint/);
  });

  // ─── 9.4 — CLIENT cannot access admin profile ────────────────────────

  it('9.4 — CLIENT token cannot access admin profile endpoint', async () => {
    const client = await createTestClient(prisma, '0900000003');
    createdUserIds.push(client.user.id);

    const res = await request(app.getHttpServer())
      .get('/api/admin/profile')
      .set(getAuthHeader(client.accessToken))
      .expect(403);

    expect(res.body.success).toBe(false);
  });

  // ─── 9.5 — SP cannot access admin profile ────────────────────────────

  it('9.5 — SP token cannot access admin profile endpoint', async () => {
    const sp = await createTestSP(prisma, '0900000004');
    createdUserIds.push(sp.user.id);

    const res = await request(app.getHttpServer())
      .get('/api/admin/profile')
      .set(getAuthHeader(sp.accessToken))
      .expect(403);

    expect(res.body.success).toBe(false);
  });
});
