import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { setupTestApp, teardownTestApp } from './setup';
import {
  createTestAdmin,
  createTestSP,
  createTestClient,
  cleanupUser,
  getAuthHeader,
} from './helpers/auth.helper';
import type { INestApplication } from '@nestjs/common';
import type { PrismaService } from '../src/prisma/prisma.service';

const PASSWORD = 'Test@123456';

describe('Data Integrity (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const createdUserIds: string[] = [];

  let superAdminToken: string;

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
    prisma = setup.prisma;

    const stale = await prisma.user.findMany({
      where: { phone: { startsWith: '150000000' } },
      select: { id: true },
    });
    for (const u of stale) await cleanupUser(prisma, u.id);

    const sa = await createTestAdmin(prisma, 'SUPER_ADMIN', '1500000001');
    superAdminToken = sa.accessToken;
    createdUserIds.push(sa.user.id);
  }, 30000);

  afterAll(async () => {
    for (const id of createdUserIds) await cleanupUser(prisma, id);
    await teardownTestApp();
  });

  // ─── 15.1 — Soft delete preserves record ─────────────────────────────

  it('15.1 — Soft delete does not physically remove user', async () => {
    const hash = await bcrypt.hash(PASSWORD, 4);
    const user = await prisma.user.create({
      data: { phone: '1500000002', passwordHash: hash, userType: 'SP' },
    });
    await prisma.spProfile.create({ data: { userId: user.id } });
    createdUserIds.push(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { deletedAt: new Date() },
    });

    const found = await prisma.user.findUnique({ where: { id: user.id } });
    expect(found).not.toBeNull();
    expect(found!.deletedAt).not.toBeNull();
  });

  // ─── 15.2 — Soft-deleted user excluded from queries ──────────────────

  it('15.2 — Soft-deleted user does not appear in admin user list', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/users')
      .query({ search: '1500000002' })
      .set(getAuthHeader(superAdminToken))
      .expect(200);

    const phones = res.body.data.items.map((u: { phone: string }) => u.phone);
    expect(phones).not.toContain('1500000002');
  });

  // ─── 15.3 — Phone uniqueness at DB level ─────────────────────────────

  it('15.3 — Phone uniqueness is enforced at DB level', async () => {
    const hash = await bcrypt.hash(PASSWORD, 4);
    await prisma.user.create({
      data: { phone: '1500000003', passwordHash: hash, userType: 'CLIENT' },
    }).then((u) => createdUserIds.push(u.id));

    await expect(
      prisma.user.create({
        data: { phone: '1500000003', passwordHash: hash, userType: 'SP' },
      }),
    ).rejects.toThrow(/Unique constraint/);
  });

  // ─── 15.4 — No duplicate role in same tenant ─────────────────────────

  it('15.4 — Same role cannot be assigned twice to same user+tenant', async () => {
    const client = await createTestClient(prisma, '1500000004');
    createdUserIds.push(client.user.id);

    const profile = await prisma.clientProfile.findUnique({
      where: { userId: client.user.id },
    });
    const clientManagerRole = await prisma.role.findUnique({
      where: { name: 'CLIENT_MANAGER' },
    });

    // First assignment
    await request(app.getHttpServer())
      .post(`/api/users/${client.user.id}/roles`)
      .set(getAuthHeader(superAdminToken))
      .send({ roleId: clientManagerRole!.id, tenantId: profile!.tenantId })
      .expect(201);

    // Duplicate
    const dupRes = await request(app.getHttpServer())
      .post(`/api/users/${client.user.id}/roles`)
      .set(getAuthHeader(superAdminToken))
      .send({ roleId: clientManagerRole!.id, tenantId: profile!.tenantId })
      .expect(409);

    expect(dupRes.body.success).toBe(false);
  });

  // ─── 15.5 — Role soft-delete does not cascade-delete users ────────────

  it('15.5 — Soft-deleting a role does not remove users', async () => {
    const hash = await bcrypt.hash(PASSWORD, 4);
    const user = await prisma.user.create({
      data: { phone: '1500000005', passwordHash: hash, userType: 'ADMIN' },
    });
    await prisma.adminProfile.create({ data: { userId: user.id } });
    createdUserIds.push(user.id);

    // Create a throwaway role and assign it
    const role = await prisma.role.create({
      data: { name: 'TEMP_DELETE_TEST', displayName: 'Temp', actorType: 'ADMIN' },
    });
    await prisma.userRole.create({
      data: { userId: user.id, roleId: role.id },
    });

    // Soft-delete the role
    await prisma.role.update({
      where: { id: role.id },
      data: { deletedAt: new Date(), isActive: false },
    });

    // User still exists
    const userAfter = await prisma.user.findUnique({ where: { id: user.id } });
    expect(userAfter).not.toBeNull();

    // User-role record still exists (it references the soft-deleted role)
    const ur = await prisma.userRole.findFirst({
      where: { userId: user.id, roleId: role.id },
    });
    expect(ur).not.toBeNull();

    // Cleanup
    await prisma.userRole.deleteMany({ where: { roleId: role.id } });
    await prisma.role.delete({ where: { id: role.id } });
  });

  // ─── 15.6 — Hard delete cascades to profiles ─────────────────────────

  it('15.6 — Hard deleting user cascades to profiles and tokens', async () => {
    const hash = await bcrypt.hash(PASSWORD, 4);
    const user = await prisma.user.create({
      data: { phone: '1500000006', passwordHash: hash, userType: 'SP' },
    });
    await prisma.spProfile.create({ data: { userId: user.id } });

    const spRole = await prisma.role.findUnique({ where: { name: 'SP_BASIC' } });
    if (spRole) {
      await prisma.userRole.create({ data: { userId: user.id, roleId: spRole.id } });
    }

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: `test_hash_${user.id}`,
        expiresAt: new Date(Date.now() + 86400000),
      },
    });

    // Hard delete (cascade)
    await prisma.user.delete({ where: { id: user.id } });

    // sp_profile gone (onDelete: Cascade)
    const profile = await prisma.spProfile.findUnique({ where: { userId: user.id } });
    expect(profile).toBeNull();

    // user_roles gone (onDelete: Cascade)
    const roles = await prisma.userRole.findMany({ where: { userId: user.id } });
    expect(roles.length).toBe(0);

    // refresh_tokens gone (onDelete: Cascade)
    const tokens = await prisma.refreshToken.findMany({ where: { userId: user.id } });
    expect(tokens.length).toBe(0);
  });

  // ─── 15.7 — Concurrent signup race condition ─────────────────────────

  it('15.7 — Concurrent signup with same phone: one succeeds, one fails', async () => {
    const body = {
      phone: '1500000007',
      password: PASSWORD,
      userType: 'SP',
    };

    const [res1, res2] = await Promise.all([
      request(app.getHttpServer()).post('/api/auth/signup').send(body),
      request(app.getHttpServer()).post('/api/auth/signup').send(body),
    ]);

    const statuses = [res1.status, res2.status].sort();

    // One should be 201, the other 409 (or both could be 409 if extremely fast)
    expect(statuses).toContain(201);
    expect(statuses).toContain(409);

    if (res1.status === 201) createdUserIds.push(res1.body.data.user.id);
    if (res2.status === 201) createdUserIds.push(res2.body.data.user.id);
  });

  // ─── 15.8 — Empty string handling ────────────────────────────────────

  it('15.8 — Empty string is accepted for optional string fields', async () => {
    const sp = await createTestSP(prisma, '1500000008');
    createdUserIds.push(sp.user.id);

    // Set a value first
    await request(app.getHttpServer())
      .patch('/api/sp/profile')
      .set(getAuthHeader(sp.accessToken))
      .send({ city: 'Bangalore' })
      .expect(200);

    // Send empty string — should be accepted (IsOptional + IsString allows '')
    const res = await request(app.getHttpServer())
      .patch('/api/sp/profile')
      .set(getAuthHeader(sp.accessToken))
      .send({ city: '' })
      .expect(200);

    // Empty string stored as-is
    expect(res.body.data.city).toBe('');
  });

  // ─── 15.9 — Extra fields stripped by whitelist ────────────────────────

  it('15.9 — Extra fields in request body are rejected by forbidNonWhitelisted', async () => {
    // With forbidNonWhitelisted: true, extra fields return 400
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        phone: '1500000001',
        password: PASSWORD,
        maliciousField: 'hack',
        isAdmin: true,
      })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  // ─── 15.10 — passwordHash never exposed ──────────────────────────────

  it('15.10 — passwordHash is never exposed in API responses', async () => {
    // Signup response
    const signupRes = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({ phone: '1500000009', password: PASSWORD, userType: 'SP' })
      .expect(201);

    createdUserIds.push(signupRes.body.data.user.id);

    expect(signupRes.body.data.user.passwordHash).toBeUndefined();
    expect(JSON.stringify(signupRes.body)).not.toContain('passwordHash');

    // Login response
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ phone: '1500000009', password: PASSWORD })
      .expect(200);

    expect(JSON.stringify(loginRes.body)).not.toContain('passwordHash');

    // GET /auth/me response
    const meRes = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set(getAuthHeader(loginRes.body.data.accessToken))
      .expect(200);

    expect(JSON.stringify(meRes.body)).not.toContain('passwordHash');

    // GET /admin/users/:id response
    const adminRes = await request(app.getHttpServer())
      .get(`/api/admin/users/${signupRes.body.data.user.id}`)
      .set(getAuthHeader(superAdminToken))
      .expect(200);

    expect(JSON.stringify(adminRes.body)).not.toContain('passwordHash');
  });
});
