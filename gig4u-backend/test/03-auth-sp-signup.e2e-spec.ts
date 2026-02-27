import request from 'supertest';
import { setupTestApp, teardownTestApp } from './setup';
import { cleanupUser } from './helpers/auth.helper';
import type { INestApplication } from '@nestjs/common';
import type { PrismaService } from '../src/prisma/prisma.service';

describe('Auth → SP Signup (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
    prisma = setup.prisma;

    const stale = await prisma.user.findMany({
      where: { phone: { startsWith: '030000000' } },
      select: { id: true },
    });
    for (const u of stale) await cleanupUser(prisma, u.id);
  }, 30000);

  afterAll(async () => {
    for (const id of createdUserIds) await cleanupUser(prisma, id);
    await teardownTestApp();
  });

  // ─── 3.1 — Successful SP signup ──────────────────────────────────────

  it('3.1 — Successful SP signup', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        phone: '0300000001',
        password: 'Test@123456',
        userType: 'SP',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.userType).toBe('SP');
    expect(res.body.data.user.phone).toBe('0300000001');
    expect(typeof res.body.data.accessToken).toBe('string');
    expect(res.body.data.accessToken.length).toBeGreaterThan(0);
    expect(typeof res.body.data.refreshToken).toBe('string');
    expect(res.body.data.refreshToken.length).toBeGreaterThan(0);

    createdUserIds.push(res.body.data.user.id);
  });

  // ─── 3.2 — SpProfile created on signup ───────────────────────────────

  it('3.2 — SpProfile created with correct defaults', async () => {
    const profile = await prisma.spProfile.findFirst({
      where: { user: { phone: '0300000001' } },
    });

    expect(profile).not.toBeNull();
    expect(profile!.spStatus).toBe('PROFILE_INCOMPLETE');
    expect(Number(profile!.behaviorScore)).toBe(0);
    expect(Number(profile!.ratingAvg)).toBe(0);
    expect(profile!.totalCompleted).toBe(0);
  });

  // ─── 3.3 — SP role assigned on signup ────────────────────────────────

  it('3.3 — SP_BASIC role assigned on signup', async () => {
    const userRole = await prisma.userRole.findFirst({
      where: { user: { phone: '0300000001' } },
      include: { role: true },
    });

    expect(userRole).not.toBeNull();
    expect(userRole!.role.name).toBe('SP_BASIC');
    expect(userRole!.isActive).toBe(true);
  });

  // ─── 3.4 — No tenant created for SP signup ──────────────────────────

  it('3.4 — NO tenant created for SP signup', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        phone: '0300000002',
        password: 'Test@123456',
        userType: 'SP',
      })
      .expect(201);

    createdUserIds.push(res.body.data.user.id);

    // SP user should have no client profile and no tenant association
    const clientProfile = await prisma.clientProfile.findUnique({
      where: { userId: res.body.data.user.id },
    });
    expect(clientProfile).toBeNull();

    // SP user should have no user_roles with a tenantId
    const tenantRoles = await prisma.userRole.findMany({
      where: { userId: res.body.data.user.id, tenantId: { not: null } },
    });
    expect(tenantRoles.length).toBe(0);
  });

  // ─── 3.5 — SP signup does NOT require companyName ────────────────────

  it('3.5 — SP signup succeeds without companyName', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        phone: '0300000003',
        password: 'Test@123456',
        userType: 'SP',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.userType).toBe('SP');

    createdUserIds.push(res.body.data.user.id);
  });
});
