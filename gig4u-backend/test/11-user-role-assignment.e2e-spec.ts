import request from 'supertest';
import * as bcrypt from 'bcrypt';
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

const PASSWORD = 'Test@123456';

describe('RBAC → User Role Assignment (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const createdUserIds: string[] = [];

  let superAdminToken: string;
  let kycAdminRoleId: string;
  let supportAdminRoleId: string;
  let clientManagerRoleId: string;

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
    prisma = setup.prisma;

    const stale = await prisma.user.findMany({
      where: { phone: { startsWith: '110000000' } },
      select: { id: true },
    });
    for (const u of stale) await cleanupUser(prisma, u.id);

    const admin = await createTestAdmin(prisma, 'SUPER_ADMIN', '1100000001');
    superAdminToken = admin.accessToken;
    createdUserIds.push(admin.user.id);

    const kycRole = await prisma.role.findUnique({ where: { name: 'KYC_ADMIN' } });
    const supportRole = await prisma.role.findUnique({ where: { name: 'SUPPORT_ADMIN' } });
    const cmRole = await prisma.role.findUnique({ where: { name: 'CLIENT_MANAGER' } });
    kycAdminRoleId = kycRole!.id;
    supportAdminRoleId = supportRole!.id;
    clientManagerRoleId = cmRole!.id;
  }, 30000);

  afterAll(async () => {
    for (const id of createdUserIds) await cleanupUser(prisma, id);
    await teardownTestApp();
  });

  /** Create a blank ADMIN user with no roles. */
  async function createBlankAdmin(phone: string): Promise<string> {
    const hash = await bcrypt.hash(PASSWORD, 4);
    const user = await prisma.user.create({
      data: { phone, passwordHash: hash, userType: 'ADMIN' },
    });
    await prisma.adminProfile.create({
      data: { userId: user.id, fullName: `BlankAdmin_${phone}` },
    });
    createdUserIds.push(user.id);
    return user.id;
  }

  // ─── 11.1 — Assign role to admin user ────────────────────────────────

  let blankAdminId: string;

  it('11.1 — Super Admin can assign role to admin user', async () => {
    blankAdminId = await createBlankAdmin('1100000002');

    const res = await request(app.getHttpServer())
      .post(`/api/users/${blankAdminId}/roles`)
      .set(getAuthHeader(superAdminToken))
      .send({ roleId: kycAdminRoleId })
      .expect(201);

    expect(res.body.success).toBe(true);

    const userRole = await prisma.userRole.findFirst({
      where: { userId: blankAdminId, roleId: kycAdminRoleId },
    });
    expect(userRole).not.toBeNull();
    expect(userRole!.isActive).toBe(true);
  });

  // ─── 11.2 — Assigned user gets correct permissions ───────────────────

  it('11.2 — Assigned user can login with correct permissions', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ phone: '1100000002', password: PASSWORD })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.requiresRoleSelection).toBeUndefined();

    const payload = JSON.parse(
      Buffer.from(res.body.data.accessToken.split('.')[1], 'base64url').toString(),
    );
    expect(payload.roles).toContain('KYC_ADMIN');
    expect(payload.permissions).toContain('kyc:view');
  });

  // ─── 11.3 — Multiple roles → role selection ──────────────────────────

  let multiRoleAdminId: string;

  it('11.3 — Multiple roles assigned → login requires role selection', async () => {
    multiRoleAdminId = await createBlankAdmin('1100000003');

    await request(app.getHttpServer())
      .post(`/api/users/${multiRoleAdminId}/roles`)
      .set(getAuthHeader(superAdminToken))
      .send({ roleId: kycAdminRoleId })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/users/${multiRoleAdminId}/roles`)
      .set(getAuthHeader(superAdminToken))
      .send({ roleId: supportAdminRoleId })
      .expect(201);

    const dbRoles = await prisma.userRole.count({
      where: { userId: multiRoleAdminId, isActive: true },
    });
    expect(dbRoles).toBe(2);

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ phone: '1100000003', password: PASSWORD })
      .expect(200);

    expect(loginRes.body.data.requiresRoleSelection).toBe(true);
    expect(loginRes.body.data.availableRoles.length).toBe(2);
  });

  // ─── 11.4 — Duplicate assignment rejected ────────────────────────────

  it('11.4 — Cannot assign same role twice to same user', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/users/${blankAdminId}/roles`)
      .set(getAuthHeader(superAdminToken))
      .send({ roleId: kycAdminRoleId })
      .expect(409);

    expect(res.body.success).toBe(false);
  });

  // ─── 11.5 — Revoke role ──────────────────────────────────────────────

  it('11.5 — Super Admin can revoke a role', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/api/users/${multiRoleAdminId}/roles/${supportAdminRoleId}`)
      .set(getAuthHeader(superAdminToken))
      .expect(200);

    expect(res.body.success).toBe(true);

    const revokedRole = await prisma.userRole.findFirst({
      where: { userId: multiRoleAdminId, roleId: supportAdminRoleId },
    });
    expect(revokedRole!.isActive).toBe(false);
  });

  // ─── 11.6 — Revoked role not in login JWT ────────────────────────────

  it('11.6 — Revoked role does not appear on login', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ phone: '1100000003', password: PASSWORD })
      .expect(200);

    // Only KYC_ADMIN remains active → auto-select (single role)
    expect(res.body.data.requiresRoleSelection).toBeUndefined();
    expect(res.body.data.accessToken).toBeDefined();

    const payload = JSON.parse(
      Buffer.from(res.body.data.accessToken.split('.')[1], 'base64url').toString(),
    );
    expect(payload.roles).toContain('KYC_ADMIN');
    expect(payload.roles).not.toContain('SUPPORT_ADMIN');
  });

  // ─── 11.7 — Assign CLIENT_MANAGER to client user ─────────────────────

  it('11.7 — CLIENT user can be assigned CLIENT_MANAGER role with tenantId', async () => {
    const client = await createTestClient(prisma, '1100000004');
    createdUserIds.push(client.user.id);

    const clientProfile = await prisma.clientProfile.findUnique({
      where: { userId: client.user.id },
    });
    const tenantId = clientProfile!.tenantId;

    const res = await request(app.getHttpServer())
      .post(`/api/users/${client.user.id}/roles`)
      .set(getAuthHeader(superAdminToken))
      .send({ roleId: clientManagerRoleId, tenantId })
      .expect(201);

    expect(res.body.success).toBe(true);

    const userRole = await prisma.userRole.findFirst({
      where: { userId: client.user.id, roleId: clientManagerRoleId },
    });
    expect(userRole).not.toBeNull();
    expect(userRole!.tenantId).toBe(tenantId);
  });

  // ─── 11.8 — Cross-type role assignment succeeds ──────────────────────

  it('11.8 — Assigning ADMIN role to SP user succeeds (no actorType guard)', async () => {
    const sp = await createTestSP(prisma, '1100000005');
    createdUserIds.push(sp.user.id);

    const res = await request(app.getHttpServer())
      .post(`/api/users/${sp.user.id}/roles`)
      .set(getAuthHeader(superAdminToken))
      .send({ roleId: kycAdminRoleId })
      .expect(201);

    expect(res.body.success).toBe(true);

    const userRole = await prisma.userRole.findFirst({
      where: { userId: sp.user.id, roleId: kycAdminRoleId },
    });
    expect(userRole).not.toBeNull();
    expect(userRole!.isActive).toBe(true);
  });
});
