import request from 'supertest';
import { setupTestApp, teardownTestApp } from './setup';
import {
  createTestSP,
  createTestClient,
  createTestAdmin,
  cleanupUser,
  getAuthHeader,
} from './helpers/auth.helper';
import type { INestApplication } from '@nestjs/common';
import type { PrismaService } from '../src/prisma/prisma.service';

describe('SP Profile (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const createdUserIds: string[] = [];

  let spToken: string;
  let spUserId: string;

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
    prisma = setup.prisma;

    const stale = await prisma.user.findMany({
      where: { phone: { startsWith: '070000000' } },
      select: { id: true },
    });
    for (const u of stale) await cleanupUser(prisma, u.id);

    // Create the primary SP user for tests 7.1-7.3, 7.8
    const sp = await createTestSP(prisma, '0700000001');
    spToken = sp.accessToken;
    spUserId = sp.user.id;
    createdUserIds.push(spUserId);
  }, 30000);

  afterAll(async () => {
    for (const id of createdUserIds) await cleanupUser(prisma, id);
    await teardownTestApp();
  });

  // ─── 7.1 — SP can fetch own profile ──────────────────────────────────

  it('7.1 — SP can fetch their own profile', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/sp/profile')
      .set(getAuthHeader(spToken))
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.userId).toBe(spUserId);
    expect(res.body.data.spStatus).toBe('PROFILE_INCOMPLETE');
    expect(res.body.data.user.phone).toBe('0700000001');
  });

  // ─── 7.2 — SP can update profile ─────────────────────────────────────

  it('7.2 — SP can update their profile', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/sp/profile')
      .set(getAuthHeader(spToken))
      .send({
        fullName: 'Test SP User',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
        gender: 'Male',
        dateOfBirth: '1995-06-15',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.fullName).toBe('Test SP User');
    expect(res.body.data.city).toBe('Bangalore');
    expect(res.body.data.state).toBe('Karnataka');
    expect(res.body.data.pincode).toBe('560001');
    expect(res.body.data.gender).toBe('Male');
  });

  // ─── 7.3 — Status updates to KYC_PENDING ─────────────────────────────

  it('7.3 — SP status updates to KYC_PENDING after full profile', async () => {
    const profile = await prisma.spProfile.findUnique({
      where: { userId: spUserId },
    });

    expect(profile).not.toBeNull();
    expect(profile!.spStatus).toBe('KYC_PENDING');
  });

  // ─── 7.4 — CLIENT cannot access SP profile ───────────────────────────

  it('7.4 — CLIENT token cannot access SP profile endpoint', async () => {
    const client = await createTestClient(prisma, '0700000002');
    createdUserIds.push(client.user.id);

    const res = await request(app.getHttpServer())
      .get('/api/sp/profile')
      .set(getAuthHeader(client.accessToken))
      .expect(403);

    expect(res.body.success).toBe(false);
  });

  // ─── 7.5 — SP always gets own profile ────────────────────────────────

  it('7.5 — SP always returns their own profile, not another SP', async () => {
    const sp2 = await createTestSP(prisma, '0700000003');
    createdUserIds.push(sp2.user.id);

    // Update sp2's profile so it's distinguishable
    await prisma.spProfile.update({
      where: { userId: sp2.user.id },
      data: { fullName: 'SP Two' },
    });

    // SP1's token returns SP1's profile
    const res1 = await request(app.getHttpServer())
      .get('/api/sp/profile')
      .set(getAuthHeader(spToken))
      .expect(200);

    expect(res1.body.data.userId).toBe(spUserId);
    expect(res1.body.data.fullName).toBe('Test SP User');

    // SP2's token returns SP2's profile
    const res2 = await request(app.getHttpServer())
      .get('/api/sp/profile')
      .set(getAuthHeader(sp2.accessToken))
      .expect(200);

    expect(res2.body.data.userId).toBe(sp2.user.id);
    expect(res2.body.data.fullName).toBe('SP Two');
  });

  // ─── 7.6 — Invalid field type rejected ────────────────────────────────

  it('7.6 — Non-string field value rejected by validation', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/sp/profile')
      .set(getAuthHeader(spToken))
      .send({ dateOfBirth: 'not-a-date' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  // ─── 7.7 — Admin can view SP profile ─────────────────────────────────

  it('7.7 — Admin can view any SP profile via admin endpoint', async () => {
    const admin = await createTestAdmin(prisma, 'SUPER_ADMIN', '0700000004');
    createdUserIds.push(admin.user.id);

    const res = await request(app.getHttpServer())
      .get(`/api/admin/users/${spUserId}`)
      .set(getAuthHeader(admin.accessToken))
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(spUserId);
    expect(res.body.data.spProfile).toBeDefined();
    expect(res.body.data.spProfile.fullName).toBe('Test SP User');
  });

  // ─── 7.8 — Partial update preserves unchanged fields ─────────────────

  it('7.8 — Partial update only changes specified fields', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/sp/profile')
      .set(getAuthHeader(spToken))
      .send({ city: 'Mumbai' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.city).toBe('Mumbai');
    expect(res.body.data.fullName).toBe('Test SP User');
    expect(res.body.data.state).toBe('Karnataka');
    expect(res.body.data.pincode).toBe('560001');
  });
});
