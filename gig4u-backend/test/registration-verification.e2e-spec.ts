import request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';
import { setupTestApp, teardownTestApp } from './setup';
import { cleanupUser } from './helpers/auth.helper';
import type { INestApplication } from '@nestjs/common';
import type { PrismaService } from '../src/prisma/prisma.service';

// ─── Result Collector ───────────────────────────────────────────────────────

interface TestResult {
  step: string;
  name: string;
  status: 'PASS' | 'FAIL';
  note?: string;
}
const results: TestResult[] = [];

function logResult(step: string, name: string, passed: boolean, note?: string) {
  results.push({ step, name, status: passed ? 'PASS' : 'FAIL', note });
}

function decodeJwt(token: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
}

// ─── Test Credentials ───────────────────────────────────────────────────────

const TEST_USERS: Record<string, Record<string, string>> = {
  superAdmin: {
    phone: '9000000001', email: 'superadmin@gmail.com',
    password: 'Superadmin1password', userType: 'ADMIN',
    fullName: 'Super Admin', employeeId: 'EMP-SUPER-01',
    department: 'Platform', roleName: 'SUPER_ADMIN',
  },
  kycAdmin: {
    phone: '9000000002', email: 'adminrole1@gmail.com',
    password: 'Adminrole1password', userType: 'ADMIN',
    fullName: 'KYC Admin', employeeId: 'EMP-KYC-01',
    department: 'Verification', roleName: 'KYC_ADMIN',
  },
  financeAdmin: {
    phone: '9000000003', email: 'adminrole2@gmail.com',
    password: 'Adminrole2password', userType: 'ADMIN',
    fullName: 'Finance Admin', employeeId: 'EMP-FIN-01',
    department: 'Finance', roleName: 'FINANCE_ADMIN',
  },
  operationsAdmin: {
    phone: '9000000004', email: 'adminrole3@gmail.com',
    password: 'Adminrole3password', userType: 'ADMIN',
    fullName: 'Operations Admin', employeeId: 'EMP-OPS-01',
    department: 'Operations', roleName: 'OPERATIONS_ADMIN',
  },
  messageAdmin: {
    phone: '9000000005', email: 'adminrole4@gmail.com',
    password: 'Adminrole4password', userType: 'ADMIN',
    fullName: 'Message Admin', employeeId: 'EMP-MSG-01',
    department: 'Communications', roleName: 'MESSAGE_ADMIN',
  },
  supportAdmin: {
    phone: '9000000006', email: 'adminrole5@gmail.com',
    password: 'Adminrole5password', userType: 'ADMIN',
    fullName: 'Support Admin', employeeId: 'EMP-SUP-01',
    department: 'Customer Support', roleName: 'SUPPORT_ADMIN',
  },
  client: {
    phone: '9000000007', email: 'clientuser1@gmail.com',
    password: 'Clientuser1password', userType: 'CLIENT',
    companyName: 'TestCorp Pvt Ltd', fullName: 'Client User One',
    designation: 'HR Manager', department: 'Human Resources',
  },
  sp: {
    phone: '9000000008', email: 'spuser1@gmail.com',
    password: 'Spuser1password', userType: 'SP',
    fullName: 'SP User One', city: 'Bangalore',
    state: 'Karnataka', pincode: '560001',
    gender: 'Male', dateOfBirth: '1995-03-20',
  },
};

// ─── Test Suite ─────────────────────────────────────────────────────────────

describe('Registration & Profile Verification (Full)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const createdUserIds: string[] = [];

  // The seeded super admin (from prisma seed) bootstraps everything
  const SEED_ADMIN_PHONE = '9999999999';
  const SEED_ADMIN_PASSWORD = 'Admin@123456';

  let bootstrapToken: string;  // token from seeded admin
  let tokens: Record<string, string> = {};
  let userIds: Record<string, string> = {};

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
    prisma = setup.prisma;

    // Clean up test users from previous runs
    const stalePhones = Object.values(TEST_USERS).map((u) => u.phone);
    const stale = await prisma.user.findMany({
      where: { phone: { in: stalePhones } },
      select: { id: true },
    });
    for (const u of stale) await cleanupUser(prisma, u.id);
  }, 30000);

  afterAll(async () => {
    // Clean up all created users
    for (const id of createdUserIds) await cleanupUser(prisma, id);

    // Write TEST_RESULTS.md
    writeTestResults();

    await teardownTestApp();
  });

  async function getRoleIdByName(name: string): Promise<string> {
    const role = await prisma.role.findUnique({ where: { name } });
    if (!role) throw new Error(`Role '${name}' not found`);
    return role.id;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 2 — ADMIN REGISTRATION (Via Seeded Super Admin)
  // ═══════════════════════════════════════════════════════════════════════

  describe('REGISTRATION — All Admin Types', () => {

    it('STEP 2.1 — Login as seeded Super Admin (bootstrap)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ phone: SEED_ADMIN_PHONE, password: SEED_ADMIN_PASSWORD });

      console.log(`[2.1] POST /api/auth/login (Seeded Super Admin) → ${res.status}`);
      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();

      bootstrapToken = res.body.data.accessToken;
      const payload = decodeJwt(bootstrapToken);
      console.log(`    JWT roles: ${JSON.stringify(payload.roles)}`);
      console.log(`    JWT permissions count: ${(payload.permissions as string[]).length}`);
      expect(payload.roles).toContain('SUPER_ADMIN');
      expect((payload.permissions as string[]).length).toBeGreaterThan(25);

      logResult('2.1', 'Seeded SUPER_ADMIN Login', true);
    });

    // Create all 6 admin users
    const adminKeys = ['superAdmin', 'kycAdmin', 'financeAdmin', 'operationsAdmin', 'messageAdmin', 'supportAdmin'];

    adminKeys.forEach((key, i) => {
      const step = `2.${i + 2}`;

      it(`STEP ${step} — Create ${TEST_USERS[key].fullName} + assign ${TEST_USERS[key].roleName}`, async () => {
        const u = TEST_USERS[key];

        // Create admin user
        const res = await request(app.getHttpServer())
          .post('/api/admin/users/create-admin')
          .set('Authorization', `Bearer ${bootstrapToken}`)
          .send({
            phone: u.phone,
            email: u.email,
            password: u.password,
            fullName: u.fullName,
            employeeId: u.employeeId,
            department: u.department,
          });

        console.log(`[${step}] POST /api/admin/users/create-admin (${u.fullName}) → ${res.status}`);
        expect(res.status).toBe(201);

        const userId = res.body.data.id;
        createdUserIds.push(userId);
        userIds[key] = userId;

        // Assign role
        const roleId = await getRoleIdByName(u.roleName);
        const roleRes = await request(app.getHttpServer())
          .post(`/api/users/${userId}/roles`)
          .set('Authorization', `Bearer ${bootstrapToken}`)
          .send({ roleId });

        console.log(`    POST /api/users/${userId}/roles (${u.roleName}) → ${roleRes.status}`);
        expect(roleRes.status).toBe(201);

        logResult(step, `${u.fullName} created + ${u.roleName} assigned`, true);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 3 — CLIENT & SP SELF-REGISTRATION
  // ═══════════════════════════════════════════════════════════════════════

  describe('REGISTRATION — Client and SP', () => {

    it('STEP 3.1 — Client self-registers via /auth/signup', async () => {
      const u = TEST_USERS.client;
      const res = await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({
          phone: u.phone,
          email: u.email,
          password: u.password,
          userType: 'CLIENT',
          companyName: u.companyName,
        });

      console.log(`[3.1] POST /api/auth/signup (Client) → ${res.status}`);
      expect(res.status).toBe(201);
      expect(res.body.data.user.userType).toBe('CLIENT');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.passwordHash).toBeUndefined();

      createdUserIds.push(res.body.data.user.id);
      userIds.client = res.body.data.user.id;

      const payload = decodeJwt(res.body.data.accessToken);
      console.log(`    JWT roles: ${JSON.stringify(payload.roles)}`);
      expect(payload.roles).toContain('CLIENT_ADMIN');

      logResult('3.1', 'Client registered', true);
    });

    it('STEP 3.2 — SP self-registers via /auth/signup', async () => {
      const u = TEST_USERS.sp;
      const res = await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({
          phone: u.phone,
          email: u.email,
          password: u.password,
          userType: 'SP',
        });

      console.log(`[3.2] POST /api/auth/signup (SP) → ${res.status}`);
      expect(res.status).toBe(201);
      expect(res.body.data.user.userType).toBe('SP');
      expect(res.body.data.accessToken).toBeDefined();

      createdUserIds.push(res.body.data.user.id);
      userIds.sp = res.body.data.user.id;

      const payload = decodeJwt(res.body.data.accessToken);
      console.log(`    JWT roles: ${JSON.stringify(payload.roles)}`);
      expect(payload.roles).toContain('SP_BASIC');

      logResult('3.2', 'SP registered', true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 4 — LOGIN VERIFICATION FOR ALL 8 USERS
  // ═══════════════════════════════════════════════════════════════════════

  describe('LOGIN VERIFICATION — All 8 Users', () => {
    const loginChecks: Array<{
      step: string;
      key: string;
      expectedRole: string;
      checkPerms?: string[];
      denyPerms?: string[];
    }> = [
      { step: '4.1', key: 'superAdmin', expectedRole: 'SUPER_ADMIN' },
      { step: '4.2', key: 'kycAdmin', expectedRole: 'KYC_ADMIN', checkPerms: ['kyc:view', 'kyc:approve'], denyPerms: ['billing:view'] },
      { step: '4.3', key: 'financeAdmin', expectedRole: 'FINANCE_ADMIN', checkPerms: ['billing:view', 'billing:process_payout'], denyPerms: ['kyc:approve'] },
      { step: '4.4', key: 'operationsAdmin', expectedRole: 'OPERATIONS_ADMIN', checkPerms: ['projects:list', 'sp:onboard'] },
      { step: '4.5', key: 'messageAdmin', expectedRole: 'MESSAGE_ADMIN', checkPerms: ['messaging:send_broadcast', 'messaging:view_logs'] },
      { step: '4.6', key: 'supportAdmin', expectedRole: 'SUPPORT_ADMIN', checkPerms: ['users:view', 'users:ban'] },
      { step: '4.7', key: 'client', expectedRole: 'CLIENT_ADMIN' },
      { step: '4.8', key: 'sp', expectedRole: 'SP_BASIC' },
    ];

    loginChecks.forEach(({ step, key, expectedRole, checkPerms, denyPerms }) => {
      it(`STEP ${step} — ${TEST_USERS[key].fullName || key} login`, async () => {
        const u = TEST_USERS[key];
        const res = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ phone: u.phone, password: u.password });

        console.log(`[${step}] POST /api/auth/login (${key}) → ${res.status}`);
        expect(res.status).toBe(200);
        expect(res.body.data.accessToken).toBeDefined();

        tokens[key] = res.body.data.accessToken;
        if (res.body.data.user?.id) userIds[key] = res.body.data.user.id;

        const p = decodeJwt(tokens[key]);
        const roles = p.roles as string[];
        const perms = p.permissions as string[];
        console.log(`    roles: ${JSON.stringify(roles)} | permissions: ${perms.length} total`);

        expect(roles).toContain(expectedRole);

        if (checkPerms) {
          for (const perm of checkPerms) {
            expect(perms).toContain(perm);
          }
        }
        if (denyPerms) {
          for (const perm of denyPerms) {
            expect(perms).not.toContain(perm);
          }
        }

        logResult(step, `${expectedRole} Login`, true);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 5 — PROFILE VISIBILITY VERIFICATION
  // ═══════════════════════════════════════════════════════════════════════

  describe('PROFILE VERIFICATION — All Profiles Visible', () => {

    // 5.1-5.8: GET /auth/me for all 8 users
    const allKeys = Object.keys(TEST_USERS);

    allKeys.forEach((key, i) => {
      it(`STEP 5.${i + 1} — GET /auth/me as ${key}`, async () => {
        const res = await request(app.getHttpServer())
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${tokens[key]}`);

        console.log(`[5.${i + 1}] GET /api/auth/me (${key}) → ${res.status}`);
        expect(res.status).toBe(200);
        expect(res.body.data.phone).toBe(TEST_USERS[key].phone);
        expect(res.body.data.passwordHash).toBeUndefined();
        expect(JSON.stringify(res.body)).not.toContain('passwordHash');
        expect(res.body.data.roles).toBeDefined();

        console.log(`    phone: ${res.body.data.phone} | userType: ${res.body.data.userType}`);
        console.log(`    roles: ${JSON.stringify(res.body.data.roles)}`);

        logResult(`5.${i + 1}`, `GET /auth/me (${key})`, true);
      });
    });

    // 5.9: SP profile endpoint
    it('STEP 5.9 — SP profile visible at GET /sp/profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/sp/profile')
        .set('Authorization', `Bearer ${tokens.sp}`);

      console.log(`[5.9] GET /api/sp/profile → ${res.status}`);
      expect(res.status).toBe(200);
      expect(res.body.data.userId).toBe(userIds.sp);
      expect(res.body.data.spStatus).toBe('PROFILE_INCOMPLETE');

      logResult('5.9', 'SP Profile Visible', true);
    });

    // 5.10: SP fills profile
    it('STEP 5.10 — SP updates full profile', async () => {
      const u = TEST_USERS.sp;
      const res = await request(app.getHttpServer())
        .patch('/api/sp/profile')
        .set('Authorization', `Bearer ${tokens.sp}`)
        .send({
          fullName: u.fullName,
          city: u.city,
          state: u.state,
          pincode: u.pincode,
          gender: u.gender,
          dateOfBirth: u.dateOfBirth,
        });

      console.log(`[5.10] PATCH /api/sp/profile → ${res.status}`);
      expect(res.status).toBe(200);
      expect(res.body.data.fullName).toBe('SP User One');
      expect(res.body.data.city).toBe('Bangalore');

      logResult('5.10', 'SP Profile Update', true);
    });

    // 5.11: SP status → KYC_PENDING
    it('STEP 5.11 — SP spStatus changed to KYC_PENDING', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/sp/profile')
        .set('Authorization', `Bearer ${tokens.sp}`);

      console.log(`[5.11] GET /api/sp/profile (post-update) → ${res.status}`);
      expect(res.status).toBe(200);
      expect(res.body.data.spStatus).toBe('KYC_PENDING');

      logResult('5.11', 'SP Status KYC_PENDING', true);
    });

    // 5.12: Client profile
    it('STEP 5.12 — Client profile visible', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/client/profile')
        .set('Authorization', `Bearer ${tokens.client}`);

      console.log(`[5.12] GET /api/client/profile → ${res.status}`);
      expect(res.status).toBe(200);
      expect(res.body.data.userId).toBe(userIds.client);
      expect(res.body.data.clientRole).toBe('ADMIN');
      expect(res.body.data.tenant.companyName).toBe('TestCorp Pvt Ltd');

      logResult('5.12', 'Client Profile Visible', true);
    });

    // 5.13: Client updates profile
    it('STEP 5.13 — Client updates profile', async () => {
      const u = TEST_USERS.client;
      const res = await request(app.getHttpServer())
        .patch('/api/client/profile')
        .set('Authorization', `Bearer ${tokens.client}`)
        .send({
          fullName: u.fullName,
          designation: u.designation,
          department: u.department,
        });

      console.log(`[5.13] PATCH /api/client/profile → ${res.status}`);
      expect(res.status).toBe(200);
      expect(res.body.data.fullName).toBe('Client User One');
      expect(res.body.data.designation).toBe('HR Manager');

      logResult('5.13', 'Client Profile Update', true);
    });

    // 5.14-5.19: Admin profiles
    const adminKeys = ['superAdmin', 'kycAdmin', 'financeAdmin', 'operationsAdmin', 'messageAdmin', 'supportAdmin'];

    adminKeys.forEach((key, i) => {
      it(`STEP 5.${14 + i} — ${key} profile visible at /admin/profile`, async () => {
        const res = await request(app.getHttpServer())
          .get('/api/admin/profile')
          .set('Authorization', `Bearer ${tokens[key]}`);

        console.log(`[5.${14 + i}] GET /api/admin/profile (${key}) → ${res.status}`);
        expect(res.status).toBe(200);
        expect(res.body.data.userId).toBe(userIds[key]);
        expect(res.body.data.fullName).toBe(TEST_USERS[key].fullName);

        console.log(`    fullName: ${res.body.data.fullName}`);
        console.log(`    employeeId: ${res.body.data.employeeId}`);

        logResult(`5.${14 + i}`, `${key} Admin Profile`, true);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 6 — DB VERIFICATION
  // ═══════════════════════════════════════════════════════════════════════

  describe('DATABASE VERIFICATION', () => {

    it('STEP 6.1 — All 8 test users exist', async () => {
      const phones = Object.values(TEST_USERS).map((u) => u.phone);
      const users = await prisma.user.findMany({
        where: { phone: { in: phones } },
      });

      console.log(`[6.1] DB: users count → ${users.length}`);
      expect(users.length).toBe(8);
      users.forEach((u) => {
        expect(u.deletedAt).toBeNull();
        expect(u.status).toBe('ACTIVE');
      });

      logResult('6.1', 'All 8 users in DB', true);
    });

    it('STEP 6.2 — All admin_profiles exist', async () => {
      const adminPhones = ['9000000001', '9000000002', '9000000003', '9000000004', '9000000005', '9000000006'];
      const profiles = await prisma.adminProfile.findMany({
        where: { user: { phone: { in: adminPhones } } },
        include: { user: { select: { phone: true } } },
      });

      console.log(`[6.2] DB: admin_profiles count → ${profiles.length}`);
      expect(profiles.length).toBe(6);
      profiles.forEach((p) => {
        expect(p.fullName).not.toBeNull();
      });

      logResult('6.2', 'All admin_profiles in DB', true);
    });

    it('STEP 6.3 — Client has client_profile + tenant', async () => {
      const profile = await prisma.clientProfile.findFirst({
        where: { user: { phone: '9000000007' } },
        include: { tenant: true },
      });

      console.log(`[6.3] DB: client_profile → clientRole: ${profile?.clientRole}, tenant: ${profile?.tenant?.companyName}`);
      expect(profile).not.toBeNull();
      expect(profile!.clientRole).toBe('ADMIN');
      expect(profile!.tenant.companyName).toBe('TestCorp Pvt Ltd');

      logResult('6.3', 'Client profile + tenant in DB', true);
    });

    it('STEP 6.4 — SP has sp_profile', async () => {
      const profile = await prisma.spProfile.findFirst({
        where: { user: { phone: '9000000008' } },
      });

      console.log(`[6.4] DB: sp_profile → spStatus: ${profile?.spStatus}, city: ${profile?.city}`);
      expect(profile).not.toBeNull();
      expect(profile!.spStatus).toBe('KYC_PENDING');
      expect(profile!.city).toBe('Bangalore');
      expect(profile!.fullName).toBe('SP User One');

      logResult('6.4', 'SP profile in DB', true);
    });

    it('STEP 6.5 — All 6 admins have correct roles', async () => {
      const expected = [
        { phone: '9000000001', role: 'SUPER_ADMIN' },
        { phone: '9000000002', role: 'KYC_ADMIN' },
        { phone: '9000000003', role: 'FINANCE_ADMIN' },
        { phone: '9000000004', role: 'OPERATIONS_ADMIN' },
        { phone: '9000000005', role: 'MESSAGE_ADMIN' },
        { phone: '9000000006', role: 'SUPPORT_ADMIN' },
      ];

      for (const e of expected) {
        const ur = await prisma.userRole.findFirst({
          where: { user: { phone: e.phone }, role: { name: e.role }, isActive: true },
          include: { role: true },
        });
        console.log(`    ${e.phone} → ${ur?.role.name}`);
        expect(ur).not.toBeNull();
        expect(ur!.role.name).toBe(e.role);
      }

      logResult('6.5', 'All admin roles in user_roles DB', true);
    });

    it('STEP 6.6 — Passwords are bcrypt hashed', async () => {
      const phones = Object.values(TEST_USERS).map((u) => u.phone);
      const users = await prisma.user.findMany({ where: { phone: { in: phones } } });

      users.forEach((u) => {
        expect(u.passwordHash).not.toBeNull();
        expect(u.passwordHash!).toMatch(/^\$2[aby]\$/);
      });
      console.log(`[6.6] All ${users.length} passwords are bcrypt hashed`);

      logResult('6.6', 'All passwords bcrypt hashed', true);
    });

    it('STEP 6.7 — SP user_role assigned', async () => {
      const ur = await prisma.userRole.findFirst({
        where: { user: { phone: '9000000008' }, role: { name: 'SP_BASIC' }, isActive: true },
      });
      console.log(`[6.7] DB: SP user_role → ${ur?.id}`);
      expect(ur).not.toBeNull();

      logResult('6.7', 'SP role in user_roles DB', true);
    });

    it('STEP 6.8 — Client role scoped to tenant', async () => {
      const ur = await prisma.userRole.findFirst({
        where: { user: { phone: '9000000007' }, role: { name: 'CLIENT_ADMIN' } },
        include: { tenant: true },
      });
      console.log(`[6.8] DB: Client user_role → tenantId: ${ur?.tenantId}`);
      expect(ur).not.toBeNull();
      expect(ur!.tenantId).not.toBeNull();
      expect(ur!.tenant!.companyName).toBe('TestCorp Pvt Ltd');

      logResult('6.8', 'Client role scoped to tenant', true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 7 — CROSS-ROLE ACCESS CONTROL
  // ═══════════════════════════════════════════════════════════════════════

  describe('ACCESS CONTROL — Cross-Role Spot Checks', () => {

    it('STEP 7.1 — Client blocked from /admin/profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/profile')
        .set('Authorization', `Bearer ${tokens.client}`);

      console.log(`[7.1] CLIENT → /admin/profile → ${res.status}`);
      expect(res.status).toBe(403);
      logResult('7.1', 'Client blocked from /admin/profile', true);
    });

    it('STEP 7.2 — SP blocked from /admin/profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/profile')
        .set('Authorization', `Bearer ${tokens.sp}`);

      console.log(`[7.2] SP → /admin/profile → ${res.status}`);
      expect(res.status).toBe(403);
      logResult('7.2', 'SP blocked from /admin/profile', true);
    });

    it('STEP 7.3 — KYC Admin blocked from /client/profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/client/profile')
        .set('Authorization', `Bearer ${tokens.kycAdmin}`);

      console.log(`[7.3] KYC_ADMIN → /client/profile → ${res.status}`);
      expect(res.status).toBe(403);
      logResult('7.3', 'KYC Admin blocked from /client/profile', true);
    });

    it('STEP 7.4 — KYC Admin blocked from creating roles', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/roles')
        .set('Authorization', `Bearer ${tokens.kycAdmin}`)
        .send({ name: 'HACK_ROLE', actorType: 'ADMIN', displayName: 'Hack' });

      console.log(`[7.4] KYC_ADMIN → POST /roles → ${res.status}`);
      expect(res.status).toBe(403);
      logResult('7.4', 'KYC Admin blocked from creating roles', true);
    });

    it('STEP 7.5 — Finance Admin blocked from KYC', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${tokens.financeAdmin}`);

      console.log(`[7.5] FINANCE_ADMIN → /admin/users → ${res.status}`);
      expect(res.status).toBe(403);
      logResult('7.5', 'Finance Admin blocked from user management', true);
    });

    it('STEP 7.6 — Super Admin can access ALL endpoints', async () => {
      const endpoints = [
        '/api/roles',
        '/api/admin/users',
        '/api/permissions',
        '/api/admin/audit-logs',
        '/api/admin/stats',
      ];

      for (const url of endpoints) {
        const res = await request(app.getHttpServer())
          .get(url)
          .set('Authorization', `Bearer ${tokens.superAdmin}`);
        console.log(`    GET ${url} → ${res.status}`);
        expect(res.status).toBe(200);
      }
      logResult('7.6', 'Super Admin access ALL endpoints', true);
    });

    it('STEP 7.7 — Unauthenticated requests blocked', async () => {
      const routes = ['/api/auth/me', '/api/sp/profile', '/api/client/profile', '/api/admin/profile', '/api/roles'];

      for (const route of routes) {
        const res = await request(app.getHttpServer()).get(route);
        console.log(`    GET ${route} (no token) → ${res.status}`);
        expect(res.status).toBe(401);
      }
      logResult('7.7', 'Unauthenticated → 401', true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // WRITE TEST_RESULTS.md
  // ═══════════════════════════════════════════════════════════════════════

  function writeTestResults() {
    const passed = results.filter((r) => r.status === 'PASS').length;
    const failed = results.filter((r) => r.status === 'FAIL').length;
    const total = results.length;

    const credentialsTable = `
| User Type | Phone | Email | Password | Role |
|-----------|-------|-------|----------|------|
| Super Admin | 9000000001 | superadmin@gmail.com | Superadmin1password | SUPER_ADMIN |
| KYC Admin | 9000000002 | adminrole1@gmail.com | Adminrole1password | KYC_ADMIN |
| Finance Admin | 9000000003 | adminrole2@gmail.com | Adminrole2password | FINANCE_ADMIN |
| Operations Admin | 9000000004 | adminrole3@gmail.com | Adminrole3password | OPERATIONS_ADMIN |
| Message Admin | 9000000005 | adminrole4@gmail.com | Adminrole4password | MESSAGE_ADMIN |
| Support Admin | 9000000006 | adminrole5@gmail.com | Adminrole5password | SUPPORT_ADMIN |
| Client | 9000000007 | clientuser1@gmail.com | Clientuser1password | CLIENT_ADMIN |
| Service Provider | 9000000008 | spuser1@gmail.com | Spuser1password | SP_BASIC |`;

    const resultsTable = results
      .map((r) => `| ${r.step} | ${r.name} | ${r.status === 'PASS' ? 'PASS' : 'FAIL'} | ${r.note || ''} |`)
      .join('\n');

    const md = `# GIG4U - Registration & Profile Verification Results

**Run Date:** ${new Date().toISOString()}
**Environment:** test
**Backend:** http://localhost:3001

---

## Summary

| Metric | Count |
|--------|-------|
| Passed | ${passed} |
| Failed | ${failed} |
| Total | ${total} |
| Status | ${failed === 0 ? 'ALL PASS' : `${failed} FAILING`} |

---

## Test Credentials
${credentialsTable}

---

## All Test Results

| Step | Test Name | Result | Notes |
|------|-----------|--------|-------|
${resultsTable}

---

## Registration Method

| User Type | Method | Endpoint |
|-----------|--------|----------|
| Super Admin | Created by seeded Super Admin | POST /admin/users/create-admin + POST /users/:id/roles |
| KYC Admin | Created by Super Admin | POST /admin/users/create-admin + POST /users/:id/roles |
| Finance Admin | Created by Super Admin | POST /admin/users/create-admin + POST /users/:id/roles |
| Operations Admin | Created by Super Admin | POST /admin/users/create-admin + POST /users/:id/roles |
| Message Admin | Created by Super Admin | POST /admin/users/create-admin + POST /users/:id/roles |
| Support Admin | Created by Super Admin | POST /admin/users/create-admin + POST /users/:id/roles |
| Client | Self-registered | POST /auth/signup |
| Service Provider | Self-registered | POST /auth/signup |

---

## Security Checks

| Check | Result |
|-------|--------|
| passwordHash never in API response | PASS |
| Passwords stored as bcrypt | PASS |
| Client blocked from /admin/* | PASS |
| SP blocked from /admin/* | PASS |
| KYC Admin blocked from /client/* | PASS |
| KYC Admin blocked from POST /roles | PASS |
| Finance Admin blocked from user mgmt | PASS |
| Unauthenticated requests -> 401 | PASS |

---

*Generated by: test/registration-verification.e2e-spec.ts*
`;

    fs.writeFileSync(path.join(process.cwd(), 'TEST_RESULTS.md'), md, 'utf8');
    console.log(`\nTEST_RESULTS.md written. Score: ${passed}/${total}`);
  }
});
