import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { setupTestApp, teardownTestApp } from './setup';
import { cleanupUser, getAuthHeader } from './helpers/auth.helper';
import type { INestApplication } from '@nestjs/common';
import type { PrismaService } from '../src/prisma/prisma.service';

const PASSWORD = 'Test@123456';
const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret-32-chars-minimum-ok';

describe('Auth → Token Management (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
    prisma = setup.prisma;

    const stale = await prisma.user.findMany({
      where: { phone: { startsWith: '060000000' } },
      select: { id: true },
    });
    for (const u of stale) await cleanupUser(prisma, u.id);
  }, 30000);

  afterAll(async () => {
    for (const id of createdUserIds) await cleanupUser(prisma, id);
    await teardownTestApp();
  });

  /** Sign up a fresh client and return tokens. */
  async function signupClient(phone: string) {
    const res = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({ phone, password: PASSWORD, userType: 'CLIENT', companyName: `Co_${phone}` })
      .expect(201);

    createdUserIds.push(res.body.data.user.id);
    return {
      userId: res.body.data.user.id as string,
      accessToken: res.body.data.accessToken as string,
      refreshToken: res.body.data.refreshToken as string,
    };
  }

  // ─── 6.1 — Token refresh works ───────────────────────────────────────

  it('6.1 — Token refresh returns new token pair', async () => {
    const { accessToken: origAccess, refreshToken: origRefresh } =
      await signupClient('0600000001');

    const res = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken: origRefresh })
      .expect(200);

    expect(res.body.success).toBe(true);

    const newAccess: string = res.body.data.accessToken;
    const newRefresh: string = res.body.data.refreshToken;

    expect(typeof newAccess).toBe('string');
    expect(typeof newRefresh).toBe('string');
    expect(newAccess).not.toBe(origAccess);
    expect(newRefresh).not.toBe(origRefresh);
  });

  // ─── 6.2 — Old refresh token invalidated after rotation ──────────────

  it('6.2 — Old refresh token is revoked after rotation', async () => {
    const { refreshToken: rt1 } = await signupClient('0600000002');

    // Rotate once
    const rotateRes = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken: rt1 })
      .expect(200);

    expect(rotateRes.body.data.refreshToken).toBeDefined();

    // Try the old token again
    const res = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken: rt1 })
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  // ─── 6.3 — Valid token grants access ─────────────────────────────────

  it('6.3 — Access protected route with valid token', async () => {
    const { accessToken } = await signupClient('0600000003');

    const res = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set(getAuthHeader(accessToken))
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
  });

  // ─── 6.4 — No token → 401 ───────────────────────────────────────────

  it('6.4 — No Authorization header returns 401', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/auth/me')
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  // ─── 6.5 — Malformed token → 401 ────────────────────────────────────

  it('6.5 — Malformed token returns 401', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set(getAuthHeader('not.a.valid.jwt.token'))
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  // ─── 6.6 — Logout invalidates refresh token ─────────────────────────

  it('6.6 — Logout revokes refresh tokens', async () => {
    const { accessToken, refreshToken } = await signupClient('0600000004');

    // Logout
    const logoutRes = await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set(getAuthHeader(accessToken))
      .expect(200);

    expect(logoutRes.body.success).toBe(true);

    // Try to refresh with the old token
    const refreshRes = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(401);

    expect(refreshRes.body.success).toBe(false);
  });

  // ─── 6.7 — Expired token rejected ───────────────────────────────────

  it('6.7 — Expired access token is rejected', async () => {
    const jwtService = new JwtService({});

    const expiredToken = jwtService.sign(
      {
        sub: 'some-user-id',
        userType: 'CLIENT',
        roles: [],
        permissions: [],
        tenantId: null,
      },
      { secret: JWT_SECRET, expiresIn: '-10s' },
    );

    const res = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set(getAuthHeader(expiredToken))
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  // ─── 6.8 — Wrong secret rejected ────────────────────────────────────

  it('6.8 — Token signed with wrong secret is rejected', async () => {
    const jwtService = new JwtService({});

    const wrongSecretToken = jwtService.sign(
      {
        sub: 'some-user-id',
        userType: 'CLIENT',
        roles: [],
        permissions: [],
        tenantId: null,
      },
      { secret: 'completely-wrong-secret-that-does-not-match', expiresIn: '15m' },
    );

    const res = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set(getAuthHeader(wrongSecretToken))
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});
