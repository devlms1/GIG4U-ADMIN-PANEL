import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { setupTestApp, teardownTestApp } from './setup';
import { cleanupUser, getAuthHeader } from './helpers/auth.helper';
import type { INestApplication } from '@nestjs/common';
import type { PrismaService } from '../src/prisma/prisma.service';

const PASSWORD = 'Test@123456';

describe('Auth → Admin Role Selection (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
    prisma = setup.prisma;

    const stale = await prisma.user.findMany({
      where: { phone: { startsWith: '050000000' } },
      select: { id: true },
    });
    for (const u of stale) await cleanupUser(prisma, u.id);
  }, 30000);

  afterAll(async () => {
    for (const id of createdUserIds) await cleanupUser(prisma, id);
    await teardownTestApp();
  });

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
    for (const rn of roleNames) {
      const role = await prisma.role.findUnique({ where: { name: rn } });
      if (role) {
        await prisma.userRole.create({
          data: { userId: user.id, roleId: role.id },
        });
      }
    }
    createdUserIds.push(user.id);
    return user.id;
  }

  function decodeJwt(token: string): Record<string, unknown> {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
  }

  // ─── 5.1 — Valid role selection ───────────────────────────────────────

  it('5.1 — Role selection with valid tempToken and valid roleId', async () => {
    await createAdminWithRoles('0500000001', ['KYC_ADMIN', 'FINANCE_ADMIN']);

    // Step 1: login → role selection
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ phone: '0500000001', password: PASSWORD })
      .expect(200);

    expect(loginRes.body.data.requiresRoleSelection).toBe(true);
    const { tempToken, availableRoles } = loginRes.body.data;
    const kycRole = availableRoles.find(
      (r: { name: string }) => r.name === 'KYC_ADMIN',
    );
    expect(kycRole).toBeDefined();

    // Step 2: select KYC_ADMIN
    const selectRes = await request(app.getHttpServer())
      .post('/api/auth/admin/select-role')
      .set({ Authorization: `Bearer ${tempToken}` })
      .send({ roleId: kycRole.id })
      .expect(200);

    expect(selectRes.body.success).toBe(true);
    expect(typeof selectRes.body.data.accessToken).toBe('string');
    expect(selectRes.body.data.accessToken.length).toBeGreaterThan(0);
    expect(typeof selectRes.body.data.refreshToken).toBe('string');
    expect(selectRes.body.data.selectedRole.name).toBe('KYC_ADMIN');

    // Decode JWT
    const payload = decodeJwt(selectRes.body.data.accessToken);
    expect(payload.roles).toContain('KYC_ADMIN');
    expect((payload.permissions as string[])).toContain('kyc:view');
    expect((payload.permissions as string[])).toContain('kyc:approve');
    expect((payload.permissions as string[])).not.toContain('billing:view');
  });

  // ─── 5.2 — AdminSession created ──────────────────────────────────────

  it('5.2 — AdminSession record created after role selection', async () => {
    // Uses the session created in 5.1 (same user 0500000001)
    const user = await prisma.user.findFirst({ where: { phone: '0500000001' } });
    expect(user).not.toBeNull();

    const session = await prisma.adminSession.findFirst({
      where: { userId: user!.id },
      orderBy: { createdAt: 'desc' },
    });

    expect(session).not.toBeNull();
    expect(session!.terminatedAt).toBeNull();

    // The selectedRoleId should be KYC_ADMIN
    const kycRole = await prisma.role.findUnique({ where: { name: 'KYC_ADMIN' } });
    expect(session!.selectedRoleId).toBe(kycRole!.id);

    // The jwtJti should be a valid UUID
    expect(session!.jwtJti).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  // ─── 5.3 — Cannot select unassigned role ─────────────────────────────

  it('5.3 — Cannot select role not assigned to user', async () => {
    await createAdminWithRoles('0500000002', ['KYC_ADMIN']);

    // Admin with only KYC_ADMIN — single role, auto-selects on login
    // We need multi-role to get a tempToken, so create with 2 roles
    // then test selecting a third that isn't assigned
    await createAdminWithRoles('0500000003', ['KYC_ADMIN', 'SUPPORT_ADMIN']);

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ phone: '0500000003', password: PASSWORD })
      .expect(200);

    const { tempToken } = loginRes.body.data;

    // Try to select FINANCE_ADMIN (not assigned)
    const financeRole = await prisma.role.findUnique({
      where: { name: 'FINANCE_ADMIN' },
    });

    const res = await request(app.getHttpServer())
      .post('/api/auth/admin/select-role')
      .set({ Authorization: `Bearer ${tempToken}` })
      .send({ roleId: financeRole!.id })
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.message.toLowerCase()).toMatch(/not assigned|forbidden/);
  });

  // ─── 5.4 — tempToken lacks roles/permissions for guarded endpoints ───

  it('5.4 — tempToken cannot access permission-guarded admin endpoints', async () => {
    await createAdminWithRoles('0500000004', ['KYC_ADMIN', 'FINANCE_ADMIN']);

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ phone: '0500000004', password: PASSWORD })
      .expect(200);

    const { tempToken } = loginRes.body.data;

    // tempToken has no userType/roles/permissions in payload,
    // so permission-guarded admin routes should reject it
    const res = await request(app.getHttpServer())
      .get('/api/admin/users')
      .set(getAuthHeader(tempToken))
      .expect(403);

    expect(res.body.success).toBe(false);

    // Verify the tempToken payload lacks roles and permissions
    const payload = JSON.parse(
      Buffer.from(tempToken.split('.')[1], 'base64url').toString(),
    );
    expect(payload.purpose).toBe('role_selection');
    expect(payload.roles).toBeUndefined();
    expect(payload.permissions).toBeUndefined();
  });

  // ─── 5.5 — Full JWT grants access ────────────────────────────────────

  it('5.5 — Full JWT grants access to protected endpoint', async () => {
    await createAdminWithRoles('0500000005', ['KYC_ADMIN', 'FINANCE_ADMIN']);

    // Login → select role → get full JWT
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ phone: '0500000005', password: PASSWORD })
      .expect(200);

    const { tempToken, availableRoles } = loginRes.body.data;
    const kycRole = availableRoles.find(
      (r: { name: string }) => r.name === 'KYC_ADMIN',
    );

    const selectRes = await request(app.getHttpServer())
      .post('/api/auth/admin/select-role')
      .set({ Authorization: `Bearer ${tempToken}` })
      .send({ roleId: kycRole.id })
      .expect(200);

    const fullToken = selectRes.body.data.accessToken;

    // Now use the full token to access /auth/me
    const meRes = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set(getAuthHeader(fullToken))
      .expect(200);

    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.userType).toBe('ADMIN');
  });

  // ─── 5.6 — Expired tempToken fails ───────────────────────────────────

  it('5.6 — Role selection with expired tempToken fails', async () => {
    const jwtService = new JwtService({});

    // Manually create a temp token that expired 10 minutes ago
    const expiredToken = jwtService.sign(
      { sub: 'fake-user-id', purpose: 'role_selection' },
      {
        secret: process.env.JWT_ACCESS_SECRET || 'test-access-secret-32-chars-minimum-ok',
        expiresIn: '-10m',
      },
    );

    const someRole = await prisma.role.findFirst();

    const res = await request(app.getHttpServer())
      .post('/api/auth/admin/select-role')
      .set({ Authorization: `Bearer ${expiredToken}` })
      .send({ roleId: someRole!.id })
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.message.toLowerCase()).toMatch(/invalid|expired/);
  });

  // ─── 5.7 — SUPER_ADMIN auto-selects ──────────────────────────────────

  it('5.7 — SUPER_ADMIN login auto-selects (single role, all permissions)', async () => {
    await createAdminWithRoles('0500000006', ['SUPER_ADMIN']);

    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ phone: '0500000006', password: PASSWORD })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.requiresRoleSelection).toBeUndefined();
    expect(typeof res.body.data.accessToken).toBe('string');
    expect(res.body.data.selectedRole.name).toBe('SUPER_ADMIN');

    const payload = decodeJwt(res.body.data.accessToken);
    expect(payload.roles).toContain('SUPER_ADMIN');
    expect((payload.permissions as string[]).length).toBeGreaterThanOrEqual(30);
  });
});
