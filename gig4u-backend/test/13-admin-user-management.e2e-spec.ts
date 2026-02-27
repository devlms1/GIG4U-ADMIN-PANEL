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

describe('Super Admin → User Management (e2e)', () => {
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
      where: { phone: { startsWith: '130000000' } },
      select: { id: true },
    });
    for (const u of stale) await cleanupUser(prisma, u.id);

    const sa = await createTestAdmin(prisma, 'SUPER_ADMIN', '1300000001');
    superAdminToken = sa.accessToken;
    superAdminUserId = sa.user.id;
    createdUserIds.push(superAdminUserId);
  }, 30000);

  afterAll(async () => {
    for (const id of createdUserIds) await cleanupUser(prisma, id);
    await teardownTestApp();
  });

  // ─── 13.1 — List all users ───────────────────────────────────────────

  it('13.1 — Super Admin can list all users', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/users')
      .set(getAuthHeader(superAdminToken))
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(typeof res.body.data.meta.total).toBe('number');
    expect(res.body.data.meta.page).toBe(1);
  });

  // ─── 13.2 — Pagination works ─────────────────────────────────────────

  it('13.2 — Pagination limits results', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/users')
      .query({ page: 1, limit: 5 })
      .set(getAuthHeader(superAdminToken))
      .expect(200);

    expect(res.body.data.items.length).toBeLessThanOrEqual(5);
    expect(res.body.data.meta.limit).toBe(5);
  });

  // ─── 13.3 — Filter by userType ────────────────────────────────────────

  it('13.3 — Filter by userType returns only that type', async () => {
    // Ensure at least one SP exists
    const sp = await createTestSP(prisma, '1300000002');
    createdUserIds.push(sp.user.id);

    const res = await request(app.getHttpServer())
      .get('/api/admin/users')
      .query({ userType: 'SP' })
      .set(getAuthHeader(superAdminToken))
      .expect(200);

    expect(res.body.data.items.length).toBeGreaterThan(0);
    for (const user of res.body.data.items) {
      expect(user.userType).toBe('SP');
    }
  });

  // ─── 13.4 — Filter by status ─────────────────────────────────────────

  it('13.4 — Filter by status returns only that status', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/users')
      .query({ status: 'ACTIVE' })
      .set(getAuthHeader(superAdminToken))
      .expect(200);

    for (const user of res.body.data.items) {
      expect(user.status).toBe('ACTIVE');
    }
  });

  // ─── 13.5 — Search by phone ──────────────────────────────────────────

  it('13.5 — Search by phone finds the correct user', async () => {
    const hash = await bcrypt.hash(PASSWORD, 4);
    const target = await prisma.user.create({
      data: { phone: '1300000099', passwordHash: hash, userType: 'SP' },
    });
    await prisma.spProfile.create({ data: { userId: target.id } });
    createdUserIds.push(target.id);

    const res = await request(app.getHttpServer())
      .get('/api/admin/users')
      .query({ search: '1300000099' })
      .set(getAuthHeader(superAdminToken))
      .expect(200);

    const phones = res.body.data.items.map((u: { phone: string }) => u.phone);
    expect(phones).toContain('1300000099');
  });

  // ─── 13.6 — View full user details ───────────────────────────────────

  it('13.6 — Super Admin can view full user details', async () => {
    const sp = await createTestSP(prisma, '1300000003');
    createdUserIds.push(sp.user.id);

    // Update profile for richer data
    await prisma.spProfile.update({
      where: { userId: sp.user.id },
      data: { fullName: 'Detail Test SP' },
    });

    const res = await request(app.getHttpServer())
      .get(`/api/admin/users/${sp.user.id}`)
      .set(getAuthHeader(superAdminToken))
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(sp.user.id);
    expect(res.body.data.userType).toBe('SP');
    expect(res.body.data.spProfile).toBeDefined();
    expect(res.body.data.spProfile.fullName).toBe('Detail Test SP');
    expect(res.body.data.userRoles).toBeDefined();
    expect(Array.isArray(res.body.data.userRoles)).toBe(true);
  });

  // ─── 13.7 — Ban a user ───────────────────────────────────────────────

  let banTargetId: string;

  it('13.7 — Super Admin can ban a user', async () => {
    const hash = await bcrypt.hash(PASSWORD, 4);
    const target = await prisma.user.create({
      data: { phone: '1300000004', passwordHash: hash, userType: 'CLIENT' },
    });
    banTargetId = target.id;
    createdUserIds.push(banTargetId);

    const res = await request(app.getHttpServer())
      .patch(`/api/admin/users/${banTargetId}/status`)
      .set(getAuthHeader(superAdminToken))
      .send({ status: 'BANNED', reason: 'Test ban' })
      .expect(200);

    expect(res.body.success).toBe(true);

    const user = await prisma.user.findUnique({ where: { id: banTargetId } });
    expect(user!.status).toBe('BANNED');
  });

  // ─── 13.8 — Banned user cannot login ─────────────────────────────────

  it('13.8 — Banned user cannot login', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ phone: '1300000004', password: PASSWORD })
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.message.toLowerCase()).toMatch(/banned/);
  });

  // ─── 13.9 — Re-activate banned user ──────────────────────────────────

  it('13.9 — Super Admin can re-activate a banned user', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/admin/users/${banTargetId}/status`)
      .set(getAuthHeader(superAdminToken))
      .send({ status: 'ACTIVE' })
      .expect(200);

    expect(res.body.success).toBe(true);

    const user = await prisma.user.findUnique({ where: { id: banTargetId } });
    expect(user!.status).toBe('ACTIVE');
  });

  // ─── 13.10 — Status change creates audit log ─────────────────────────

  it('13.10 — Status change creates an audit log entry', async () => {
    const log = await prisma.auditLog.findFirst({
      where: {
        targetId: banTargetId,
        action: 'USER_STATUS_CHANGED',
      },
      orderBy: { createdAt: 'desc' },
    });

    expect(log).not.toBeNull();
    expect(log!.actorUserId).toBe(superAdminUserId);

    const metadata = log!.metadata as Record<string, unknown>;
    expect(metadata).toBeDefined();
    expect(metadata.newStatus).toBeDefined();
  });

  // ─── 13.11 — Create new admin user ───────────────────────────────────

  it('13.11 — Super Admin can create a new admin user', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/admin/users/create-admin')
      .set(getAuthHeader(superAdminToken))
      .send({
        phone: '1300000090',
        email: 'newadmin@gig4u.test',
        password: 'Admin@123456',
        fullName: 'New Admin',
      })
      .expect(201);

    expect(res.body.success).toBe(true);

    const newUser = await prisma.user.findFirst({
      where: { phone: '1300000090' },
    });
    expect(newUser).not.toBeNull();
    expect(newUser!.userType).toBe('ADMIN');
    createdUserIds.push(newUser!.id);

    const adminProfile = await prisma.adminProfile.findUnique({
      where: { userId: newUser!.id },
    });
    expect(adminProfile).not.toBeNull();
    expect(adminProfile!.fullName).toBe('New Admin');
  });

  // ─── 13.12 — Dashboard stats ─────────────────────────────────────────

  it('13.12 — Super Admin can see dashboard stats', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/stats')
      .set(getAuthHeader(superAdminToken))
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.totalUsers).toBe('number');
    expect(res.body.data.totalUsers).toBeGreaterThanOrEqual(0);
    expect(typeof res.body.data.clientCount).toBe('number');
    expect(typeof res.body.data.spCount).toBe('number');
    expect(typeof res.body.data.adminCount).toBe('number');
    expect(typeof res.body.data.pendingKyc).toBe('number');
    expect(typeof res.body.data.activeProjects).toBe('number');
  });
});
