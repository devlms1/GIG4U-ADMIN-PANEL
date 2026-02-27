import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { setupTestApp, teardownTestApp } from './setup';
import { cleanupUser } from './helpers/auth.helper';
import type { INestApplication } from '@nestjs/common';
import type { PrismaService } from '../src/prisma/prisma.service';

const PASSWORD = 'Test@123456';

describe('Auth → Login (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
    prisma = setup.prisma;

    const stale = await prisma.user.findMany({
      where: { phone: { startsWith: '040000000' } },
      select: { id: true },
    });
    for (const u of stale) await cleanupUser(prisma, u.id);

    // Pre-create a CLIENT user via the signup endpoint
    const clientRes = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({ phone: '0400000001', password: PASSWORD, userType: 'CLIENT', companyName: 'Login Test Co' });
    createdUserIds.push(clientRes.body.data.user.id);

    // Pre-create an SP user via the signup endpoint
    const spRes = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({ phone: '0400000002', password: PASSWORD, userType: 'SP' });
    createdUserIds.push(spRes.body.data.user.id);
  }, 30000);

  afterAll(async () => {
    for (const id of createdUserIds) await cleanupUser(prisma, id);
    await teardownTestApp();
  });

  // ─── Helper: create admin user directly in DB ─────────────────────────

  async function createAdminWithRoles(
    phone: string,
    roleNames: string[],
  ): Promise<string> {
    const hash = await bcrypt.hash(PASSWORD, 4);
    const user = await prisma.user.create({
      data: { phone, passwordHash: hash, userType: 'ADMIN' },
    });

    await prisma.adminProfile.create({
      data: { userId: user.id, fullName: `Admin_${phone}` },
    });

    for (const roleName of roleNames) {
      const role = await prisma.role.findUnique({ where: { name: roleName } });
      if (role) {
        await prisma.userRole.create({
          data: { userId: user.id, roleId: role.id },
        });
      }
    }

    createdUserIds.push(user.id);
    return user.id;
  }

  // ─── 4.1 — Client login success ──────────────────────────────────────

  it('4.1 — Client login success', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ phone: '0400000001', password: PASSWORD })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.userType).toBe('CLIENT');
    expect(typeof res.body.data.accessToken).toBe('string');
    expect(res.body.data.accessToken.length).toBeGreaterThan(0);
    expect(typeof res.body.data.refreshToken).toBe('string');
    expect(res.body.data.requiresRoleSelection).toBeUndefined();
  });

  // ─── 4.2 — SP login success ──────────────────────────────────────────

  it('4.2 — SP login success', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ phone: '0400000002', password: PASSWORD })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.userType).toBe('SP');
    expect(typeof res.body.data.accessToken).toBe('string');
    expect(typeof res.body.data.refreshToken).toBe('string');
    expect(res.body.data.requiresRoleSelection).toBeUndefined();
  });

  // ─── 4.3 — Admin single role — auto-selects ─────────────────────────

  it('4.3 — Admin with single role auto-selects', async () => {
    await createAdminWithRoles('0400000003', ['KYC_ADMIN']);

    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ phone: '0400000003', password: PASSWORD })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.accessToken).toBe('string');
    expect(res.body.data.requiresRoleSelection).toBeUndefined();
    expect(res.body.data.selectedRole).toBeDefined();
    expect(res.body.data.selectedRole.name).toBe('KYC_ADMIN');

    // Decode the JWT payload (base64url, no verification needed)
    const payloadB64 = res.body.data.accessToken.split('.')[1];
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());

    expect(payload.roles).toContain('KYC_ADMIN');
    expect(payload.permissions).toContain('kyc:view');
    expect(payload.userType).toBe('ADMIN');
  });

  // ─── 4.4 — Admin multiple roles — returns role selection ─────────────

  it('4.4 — Admin with multiple roles returns role selection', async () => {
    await createAdminWithRoles('0400000004', ['KYC_ADMIN', 'SUPPORT_ADMIN']);

    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ phone: '0400000004', password: PASSWORD })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.requiresRoleSelection).toBe(true);
    expect(Array.isArray(res.body.data.availableRoles)).toBe(true);
    expect(res.body.data.availableRoles.length).toBe(2);

    const roleNames = res.body.data.availableRoles.map(
      (r: { name: string }) => r.name,
    );
    expect(roleNames).toContain('KYC_ADMIN');
    expect(roleNames).toContain('SUPPORT_ADMIN');

    for (const role of res.body.data.availableRoles) {
      expect(role.id).toBeDefined();
      expect(role.name).toBeDefined();
      expect(role).toHaveProperty('displayName');
    }

    expect(typeof res.body.data.tempToken).toBe('string');
    expect(res.body.data.tempToken.length).toBeGreaterThan(0);

    // Full access token should NOT be present
    expect(res.body.data.accessToken).toBeUndefined();
  });

  // ─── 4.5 — Wrong password rejected ──────────────────────────────────

  it('4.5 — Wrong password rejected', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ phone: '0400000001', password: 'WrongPassword1' })
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  // ─── 4.6 — Non-existent user rejected ───────────────────────────────

  it('4.6 — Non-existent user rejected', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ phone: '0499999999', password: PASSWORD })
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  // ─── 4.7 — Banned user rejected ─────────────────────────────────────

  it('4.7 — Banned user cannot login', async () => {
    const hash = await bcrypt.hash(PASSWORD, 4);
    const banned = await prisma.user.create({
      data: { phone: '0400000005', passwordHash: hash, userType: 'CLIENT', status: 'BANNED' },
    });
    createdUserIds.push(banned.id);

    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ phone: '0400000005', password: PASSWORD })
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.message.toLowerCase()).toMatch(/banned|suspended|denied/);
  });

  // ─── 4.8 — lastLoginAt updated on login ─────────────────────────────

  it('4.8 — lastLoginAt updated on login', async () => {
    const before = await prisma.user.findFirst({
      where: { phone: '0400000001' },
      select: { lastLoginAt: true },
    });

    // lastLoginAt may already be set from test 4.1, so just note the value
    const beforeTime = before?.lastLoginAt?.getTime() ?? 0;

    // Small delay to ensure timestamps differ
    await new Promise((r) => setTimeout(r, 50));

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ phone: '0400000001', password: PASSWORD })
      .expect(200);

    const after = await prisma.user.findFirst({
      where: { phone: '0400000001' },
      select: { lastLoginAt: true },
    });

    expect(after!.lastLoginAt).not.toBeNull();
    expect(after!.lastLoginAt!.getTime()).toBeGreaterThan(beforeTime);

    const diffMs = Date.now() - after!.lastLoginAt!.getTime();
    expect(diffMs).toBeLessThan(5000);
  });

  // ─── 4.9 — Soft-deleted user cannot login ───────────────────────────

  it('4.9 — Soft-deleted user cannot login', async () => {
    const hash = await bcrypt.hash(PASSWORD, 4);
    const deleted = await prisma.user.create({
      data: {
        phone: '0400000006',
        passwordHash: hash,
        userType: 'SP',
        deletedAt: new Date(),
      },
    });
    createdUserIds.push(deleted.id);

    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ phone: '0400000006', password: PASSWORD })
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  // ─── 4.10 — Login requires phone, not email ─────────────────────────

  it('4.10 — Login with email field instead of phone is rejected', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'testclient@gig4u.test', password: PASSWORD })
      .expect(400);

    expect(res.body.success).toBe(false);
  });
});
