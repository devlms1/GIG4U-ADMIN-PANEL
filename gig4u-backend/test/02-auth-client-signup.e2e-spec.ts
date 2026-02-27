import request from 'supertest';
import { setupTestApp, teardownTestApp } from './setup';
import { cleanupUser } from './helpers/auth.helper';
import type { INestApplication } from '@nestjs/common';
import type { PrismaService } from '../src/prisma/prisma.service';

describe('Auth → Client Signup (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
    prisma = setup.prisma;

    // Clean slate: remove any leftover users from previous runs
    const staleUsers = await prisma.user.findMany({
      where: { phone: { startsWith: '020000000' } },
      select: { id: true },
    });
    for (const u of staleUsers) {
      await cleanupUser(prisma, u.id);
    }
  }, 30000);

  afterAll(async () => {
    for (const id of createdUserIds) {
      await cleanupUser(prisma, id);
    }
    await teardownTestApp();
  });

  // ─── 2.1 — Successful client signup ───────────────────────────────────

  it('2.1 — Successful client signup', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        phone: '0200000001',
        email: 'testclient01@gig4u.test',
        password: 'Test@123456',
        userType: 'CLIENT',
        companyName: 'Test Company 01',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.phone).toBe('0200000001');
    expect(res.body.data.user.userType).toBe('CLIENT');
    expect(res.body.data.accessToken).toBeDefined();
    expect(typeof res.body.data.accessToken).toBe('string');
    expect(res.body.data.accessToken.length).toBeGreaterThan(0);
    expect(res.body.data.refreshToken).toBeDefined();
    expect(typeof res.body.data.refreshToken).toBe('string');
    expect(res.body.data.refreshToken.length).toBeGreaterThan(0);

    // passwordHash must never be exposed in the API response
    expect(res.body.data.user.passwordHash).toBeUndefined();

    createdUserIds.push(res.body.data.user.id);
  });

  // ─── 2.2 — Tenant created on client signup ───────────────────────────

  it('2.2 — Tenant created on client signup', async () => {
    const tenant = await prisma.tenant.findFirst({
      where: { companyName: 'Test Company 01' },
    });

    expect(tenant).not.toBeNull();
    expect(tenant!.segment).toBe('SMB');
    expect(tenant!.status).toBe('ACTIVE');
  });

  // ─── 2.3 — ClientProfile created on signup ───────────────────────────

  it('2.3 — ClientProfile created on signup', async () => {
    const profile = await prisma.clientProfile.findFirst({
      where: { user: { phone: '0200000001' } },
      include: { tenant: true },
    });

    expect(profile).not.toBeNull();
    expect(profile!.clientRole).toBe('ADMIN');
    expect(profile!.tenant.companyName).toBe('Test Company 01');
  });

  // ─── 2.4 — CLIENT_ADMIN role assigned on signup ──────────────────────

  it('2.4 — CLIENT_ADMIN role assigned on signup', async () => {
    const userRole = await prisma.userRole.findFirst({
      where: { user: { phone: '0200000001' } },
      include: { role: true },
    });

    expect(userRole).not.toBeNull();
    expect(userRole!.role.name).toBe('CLIENT_ADMIN');
    expect(userRole!.isActive).toBe(true);
  });

  // ─── 2.5 — Duplicate phone rejected ──────────────────────────────────

  it('2.5 — Duplicate phone rejected', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        phone: '0200000001',
        email: 'dup@gig4u.test',
        password: 'Test@123456',
        userType: 'CLIENT',
        companyName: 'Dup Company',
      })
      .expect(409);

    expect(res.body.success).toBe(false);
    expect(res.body.message.toLowerCase()).toMatch(/already|exists|registered/);
  });

  // ─── 2.6 — Admin signup blocked from public endpoint ─────────────────

  it('2.6 — Admin signup blocked from public endpoint', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        phone: '0200000002',
        password: 'Test@123456',
        userType: 'ADMIN',
      })
      .expect(403);

    expect(res.body.success).toBe(false);
  });

  // ─── 2.7 — Client signup without company name fails ──────────────────

  it('2.7 — Client signup without company name fails', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        phone: '0200000003',
        password: 'Test@123456',
        userType: 'CLIENT',
      })
      .expect(400);

    expect(res.body.success).toBe(false);
    const messages = JSON.stringify(res.body.errors ?? res.body.message);
    expect(messages.toLowerCase()).toMatch(/companyname|company/i);
  });

  // ─── 2.8 — Weak password rejected ────────────────────────────────────

  it('2.8 — Weak password rejected', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        phone: '0200000004',
        password: 'weak',
        userType: 'CLIENT',
        companyName: 'Weak Co',
      })
      .expect(400);

    expect(res.body.success).toBe(false);
    const messages = JSON.stringify(res.body.errors ?? res.body.message);
    expect(messages.toLowerCase()).toMatch(/password|min|character|uppercase|number/i);
  });

  // ─── 2.9 — Invalid phone format rejected ─────────────────────────────

  it('2.9 — Invalid phone format rejected', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        phone: '123',
        password: 'Test@123456',
        userType: 'CLIENT',
        companyName: 'Bad Phone Co',
      })
      .expect(400);

    expect(res.body.success).toBe(false);
    const messages = JSON.stringify(res.body.errors ?? res.body.message);
    expect(messages.toLowerCase()).toMatch(/phone|digit/i);
  });

  // ─── 2.10 — Password hash stored correctly ───────────────────────────

  it('2.10 — Password hash stored correctly (security check)', async () => {
    const user = await prisma.user.findFirst({
      where: { phone: '0200000001' },
      select: { passwordHash: true },
    });

    expect(user).not.toBeNull();
    expect(user!.passwordHash).not.toBe('Test@123456');
    expect(user!.passwordHash).toMatch(/^\$2[aby]\$/);
  });
});
