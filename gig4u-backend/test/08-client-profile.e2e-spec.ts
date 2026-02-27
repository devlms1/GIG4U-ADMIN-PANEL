import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { setupTestApp, teardownTestApp } from './setup';
import {
  createTestClient,
  createTestSP,
  cleanupUser,
  getAuthHeader,
} from './helpers/auth.helper';
import type { INestApplication } from '@nestjs/common';
import type { PrismaService } from '../src/prisma/prisma.service';

describe('Client Profile (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const createdUserIds: string[] = [];

  let clientToken: string;
  let clientUserId: string;
  let clientTenantId: string;

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
    prisma = setup.prisma;

    const stale = await prisma.user.findMany({
      where: { phone: { startsWith: '080000000' } },
      select: { id: true },
    });
    for (const u of stale) await cleanupUser(prisma, u.id);

    // Primary CLIENT_ADMIN user
    const client = await createTestClient(prisma, '0800000001');
    clientToken = client.accessToken;
    clientUserId = client.user.id;
    createdUserIds.push(clientUserId);

    const profile = await prisma.clientProfile.findUnique({
      where: { userId: clientUserId },
    });
    clientTenantId = profile!.tenantId;
  }, 30000);

  afterAll(async () => {
    for (const id of createdUserIds) await cleanupUser(prisma, id);

    // Clean up tenants created by test helpers
    await prisma.tenant.deleteMany({
      where: { companyName: { startsWith: 'TestCo_080' } },
    });

    await teardownTestApp();
  });

  // ─── 8.1 — Client can fetch own profile ──────────────────────────────

  it('8.1 — Client can fetch their own profile', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/client/profile')
      .set(getAuthHeader(clientToken))
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.userId).toBe(clientUserId);
    expect(res.body.data.tenant).toBeDefined();
    expect(res.body.data.tenant.companyName).toBeDefined();
    expect(res.body.data.clientRole).toBe('ADMIN');
  });

  // ─── 8.2 — Client profile update ─────────────────────────────────────

  it('8.2 — Client can update their profile', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/client/profile')
      .set(getAuthHeader(clientToken))
      .send({
        fullName: 'Client Admin Name',
        designation: 'CEO',
        department: 'Leadership',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.fullName).toBe('Client Admin Name');
    expect(res.body.data.designation).toBe('CEO');
    expect(res.body.data.department).toBe('Leadership');
  });

  // ─── 8.3 — SP cannot access client profile ───────────────────────────

  it('8.3 — SP token cannot access client profile endpoint', async () => {
    const sp = await createTestSP(prisma, '0800000002');
    createdUserIds.push(sp.user.id);

    const res = await request(app.getHttpServer())
      .get('/api/client/profile')
      .set(getAuthHeader(sp.accessToken))
      .expect(403);

    expect(res.body.success).toBe(false);
  });

  // ─── 8.4 — CLIENT_ADMIN can view team ────────────────────────────────

  it('8.4 — CLIENT_ADMIN can view team members', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/client/team')
      .set(getAuthHeader(clientToken))
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);

    const self = res.body.data.find(
      (m: { userId: string }) => m.userId === clientUserId,
    );
    expect(self).toBeDefined();
  });

  // ─── 8.5 — CLIENT_ADMIN can invite team member ───────────────────────

  let invitedUserId: string;

  it('8.5 — CLIENT_ADMIN can invite a team member', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/client/team/invite')
      .set(getAuthHeader(clientToken))
      .send({
        email: 'manager@test.com',
        phone: '0800000005',
        clientRole: 'MANAGER',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.phone).toBe('0800000005');

    invitedUserId = res.body.data.user.id;
    createdUserIds.push(invitedUserId);

    // Verify in DB: user is CLIENT
    const invitedUser = await prisma.user.findUnique({
      where: { id: invitedUserId },
    });
    expect(invitedUser!.userType).toBe('CLIENT');

    // Verify role: CLIENT_MANAGER assigned
    const userRole = await prisma.userRole.findFirst({
      where: { userId: invitedUserId },
      include: { role: true },
    });
    expect(userRole).not.toBeNull();
    expect(userRole!.role.name).toBe('CLIENT_MANAGER');

    // Verify tenant matches
    const invitedProfile = await prisma.clientProfile.findUnique({
      where: { userId: invitedUserId },
    });
    expect(invitedProfile!.tenantId).toBe(clientTenantId);
  });

  // ─── 8.6 — CLIENT_VIEWER cannot invite ───────────────────────────────

  it('8.6 — CLIENT_VIEWER cannot invite team members', async () => {
    // Create a VIEWER user in the same tenant
    const viewerUser = await prisma.user.create({
      data: { phone: '0800000006', userType: 'CLIENT' },
    });
    await prisma.clientProfile.create({
      data: {
        userId: viewerUser.id,
        tenantId: clientTenantId,
        clientRole: 'VIEWER',
      },
    });
    createdUserIds.push(viewerUser.id);

    const viewerRole = await prisma.role.findUnique({
      where: { name: 'CLIENT_VIEWER' },
    });
    if (viewerRole) {
      await prisma.userRole.create({
        data: {
          userId: viewerUser.id,
          roleId: viewerRole.id,
          tenantId: clientTenantId,
        },
      });
    }

    // Sign a token with CLIENT userType but no admin clientRole
    const jwtService = new JwtService({});
    const viewerToken = jwtService.sign(
      {
        sub: viewerUser.id,
        userType: 'CLIENT',
        roles: ['CLIENT_VIEWER'],
        permissions: ['projects:list', 'projects:view'],
        tenantId: clientTenantId,
      },
      {
        secret:
          process.env.JWT_ACCESS_SECRET ||
          'test-access-secret-32-chars-minimum-ok',
        expiresIn: '15m',
      },
    );

    const res = await request(app.getHttpServer())
      .post('/api/client/team/invite')
      .set(getAuthHeader(viewerToken))
      .send({
        email: 'nobody@test.com',
        phone: '0800000099',
        clientRole: 'VIEWER',
      })
      .expect(403);

    expect(res.body.success).toBe(false);
  });

  // ─── 8.7 — Invited member exists with correct type ───────────────────

  it('8.7 — Invited team member exists as CLIENT user', async () => {
    const user = await prisma.user.findFirst({
      where: { phone: '0800000005' },
    });

    expect(user).not.toBeNull();
    expect(user!.userType).toBe('CLIENT');
    expect(user!.email).toBe('manager@test.com');
  });

  // ─── 8.8 — Team member belongs to correct tenant ─────────────────────

  it('8.8 — Invited team member belongs to the same tenant', async () => {
    const profile = await prisma.clientProfile.findFirst({
      where: { user: { phone: '0800000005' } },
    });

    expect(profile).not.toBeNull();
    expect(profile!.tenantId).toBe(clientTenantId);
    expect(profile!.clientRole).toBe('MANAGER');
  });
});
