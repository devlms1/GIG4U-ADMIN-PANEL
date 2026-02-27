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
import type { PrismaClient } from '@prisma/client';

describe('Test Setup Smoke Test (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
    prisma = setup.prisma;
  }, 30000);

  afterAll(async () => {
    await teardownTestApp();
  });

  it('should have seeded permission groups', async () => {
    const count = await prisma.permissionGroup.count();
    expect(count).toBe(8);
  });

  it('should have seeded 32 permissions', async () => {
    const count = await prisma.permission.count();
    expect(count).toBe(32);
  });

  it('should have seeded 10 system roles', async () => {
    const count = await prisma.role.count({ where: { isSystem: true } });
    expect(count).toBe(10);
  });

  it('should have seeded 65 role-permission mappings', async () => {
    const count = await prisma.rolePermission.count();
    expect(count).toBe(65);
  });

  describe('Test user factories', () => {
    const userIds: string[] = [];

    afterAll(async () => {
      for (const id of userIds) {
        await cleanupUser(prisma, id);
      }
    });

    it('createTestClient returns valid tokens', async () => {
      const client = await createTestClient(prisma, '0200000001');
      userIds.push(client.user.id);

      expect(client.user.userType).toBe('CLIENT');
      expect(client.accessToken).toBeDefined();
      expect(client.refreshToken).toBeDefined();

      const header = getAuthHeader(client.accessToken);
      expect(header.Authorization).toContain('Bearer ');
    });

    it('createTestSP returns valid tokens', async () => {
      const sp = await createTestSP(prisma, '0300000001');
      userIds.push(sp.user.id);

      expect(sp.user.userType).toBe('SP');
      expect(sp.accessToken).toBeDefined();
    });

    it('createTestAdmin(SUPER_ADMIN) returns valid tokens with all permissions', async () => {
      const admin = await createTestAdmin(prisma, 'SUPER_ADMIN', '0400000001');
      userIds.push(admin.user.id);

      expect(admin.user.userType).toBe('ADMIN');
      expect(admin.accessToken).toBeDefined();
    });
  });

  describe('API health check', () => {
    const userIds: string[] = [];

    afterAll(async () => {
      for (const id of userIds) {
        await cleanupUser(prisma, id);
      }
    });

    it('GET /api/auth/me with valid token should return 200', async () => {
      const client = await createTestClient(prisma, '0500000001');
      userIds.push(client.user.id);

      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set(getAuthHeader(client.accessToken))
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBe(client.user.id);
    });

    it('GET /api/auth/me without token should return 401', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('GET /api/admin/users without ADMIN role should return 403', async () => {
      const sp = await createTestSP(prisma, '0500000002');
      userIds.push(sp.user.id);

      const res = await request(app.getHttpServer())
        .get('/api/admin/users')
        .set(getAuthHeader(sp.accessToken))
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('GET /api/admin/users with SUPER_ADMIN should return 200', async () => {
      const admin = await createTestAdmin(prisma, 'SUPER_ADMIN', '0500000003');
      userIds.push(admin.user.id);

      const res = await request(app.getHttpServer())
        .get('/api/admin/users')
        .set(getAuthHeader(admin.accessToken))
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toBeDefined();
      expect(res.body.data.meta).toBeDefined();
    });
  });
});
