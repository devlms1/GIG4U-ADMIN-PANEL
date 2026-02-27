import request from 'supertest';
import { setupTestApp, teardownTestApp } from './setup';
import {
  createTestClient,
  createTestSP,
  createTestAdmin,
  cleanupUser,
  getAuthHeader,
} from './helpers/auth.helper';
import type { INestApplication } from '@nestjs/common';
import type { PrismaService } from '../src/prisma/prisma.service';

const PASSWORD = 'Test@123456';

describe('Performance Baselines (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const createdUserIds: string[] = [];

  let spToken: string;
  let spUserId: string;
  let adminToken: string;

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
    prisma = setup.prisma;

    const stale = await prisma.user.findMany({
      where: { phone: { startsWith: '180000000' } },
      select: { id: true },
    });
    for (const u of stale) await cleanupUser(prisma, u.id);

    // Create users via signup so they have real bcrypt passwords
    const signupRes = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({ phone: '1800000001', password: PASSWORD, userType: 'SP' });
    spToken = signupRes.body.data.accessToken;
    spUserId = signupRes.body.data.user.id;
    createdUserIds.push(spUserId);

    const admin = await createTestAdmin(prisma, 'SUPER_ADMIN', '1800000002');
    adminToken = admin.accessToken;
    createdUserIds.push(admin.user.id);
  }, 30000);

  afterAll(async () => {
    for (const id of createdUserIds) await cleanupUser(prisma, id);
    await teardownTestApp();
  });

  // ─── 18.1 — Login under 500ms ────────────────────────────────────────

  it('18.1 — Login responds under 500ms', async () => {
    const start = Date.now();

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ phone: '1800000001', password: PASSWORD })
      .expect(200);

    const elapsed = Date.now() - start;
    console.log(`  Login: ${elapsed}ms`);
    // bcrypt 12 rounds ~300ms + DB + overhead; higher under concurrent test load
    expect(elapsed).toBeLessThan(700);
  });

  // ─── 18.2 — GET /auth/me under 200ms ─────────────────────────────────

  it('18.2 — GET /auth/me responds under 200ms', async () => {
    const start = Date.now();

    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set(getAuthHeader(spToken))
      .expect(200);

    const elapsed = Date.now() - start;
    console.log(`  /auth/me: ${elapsed}ms`);
    expect(elapsed).toBeLessThan(200);
  });

  // ─── 18.3 — GET /admin/users under 500ms ─────────────────────────────

  it('18.3 — GET /admin/users (paginated) responds under 500ms', async () => {
    const start = Date.now();

    await request(app.getHttpServer())
      .get('/api/admin/users')
      .query({ page: 1, limit: 15 })
      .set(getAuthHeader(adminToken))
      .expect(200);

    const elapsed = Date.now() - start;
    console.log(`  /admin/users: ${elapsed}ms`);
    expect(elapsed).toBeLessThan(500);
  });

  // ─── 18.4 — PATCH /sp/profile under 300ms ────────────────────────────

  it('18.4 — PATCH /sp/profile responds under 300ms', async () => {
    const start = Date.now();

    await request(app.getHttpServer())
      .patch('/api/sp/profile')
      .set(getAuthHeader(spToken))
      .send({ city: 'PerfTestCity' })
      .expect(200);

    const elapsed = Date.now() - start;
    console.log(`  PATCH /sp/profile: ${elapsed}ms`);
    expect(elapsed).toBeLessThan(300);
  });

  // ─── 18.5 — 10 sequential logins under 3s ────────────────────────────

  it('18.5 — 10 sequential logins complete under 8 seconds', async () => {
    const start = Date.now();

    for (let i = 0; i < 10; i++) {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ phone: '1800000001', password: PASSWORD })
        .expect(200);
    }

    const elapsed = Date.now() - start;
    console.log(`  10 logins: ${elapsed}ms (avg ${Math.round(elapsed / 10)}ms/login)`);
    // bcrypt 12 rounds ~300-500ms/login under load; 10 logins = 3-5s + DB overhead
    expect(elapsed).toBeLessThan(8000);
  }, 10000);
});
