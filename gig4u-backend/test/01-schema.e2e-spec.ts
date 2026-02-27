import { setupTestApp, teardownTestApp } from './setup';
import type { PrismaService } from '../src/prisma/prisma.service';

describe('Database Schema (e2e)', () => {
  let prisma: PrismaService;

  beforeAll(async () => {
    const setup = await setupTestApp();
    prisma = setup.prisma;
  }, 30000);

  afterAll(async () => {
    await teardownTestApp();
  });

  // ─── Test 1.1 ─────────────────────────────────────────────────────────

  it('1.1 — All required tables exist', async () => {
    const result = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
    `;

    const tableNames = result.map((r) => r.table_name);

    const requiredTables = [
      'users',
      'tenants',
      'client_profiles',
      'sp_profiles',
      'admin_profiles',
      'roles',
      'permission_groups',
      'permissions',
      'role_permissions',
      'user_roles',
      'refresh_tokens',
      'otp_records',
      'admin_sessions',
      'audit_logs',
    ];

    for (const table of requiredTables) {
      expect(tableNames).toContain(table);
    }
  });

  // ─── Test 1.2 ─────────────────────────────────────────────────────────

  it('1.2 — users table has correct columns', async () => {
    const result = await prisma.$queryRaw<
      { column_name: string; data_type: string }[]
    >`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'users'
    `;

    const columnNames = result.map((r) => r.column_name);

    const requiredColumns = [
      'id',
      'phone',
      'email',
      'passwordHash',
      'userType',
      'status',
      'isPhoneVerified',
      'isEmailVerified',
      'lastLoginAt',
      'createdAt',
      'updatedAt',
      'deletedAt',
    ];

    for (const col of requiredColumns) {
      expect(columnNames).toContain(col);
    }
  });

  // ─── Test 1.3 ─────────────────────────────────────────────────────────

  it('1.3 — System roles are seeded (>= 10)', async () => {
    const count = await prisma.role.count({ where: { isSystem: true } });
    expect(count).toBeGreaterThanOrEqual(10);
  });

  // ─── Test 1.4 ─────────────────────────────────────────────────────────

  it('1.4 — All permission groups are seeded', async () => {
    const groups = await prisma.permissionGroup.findMany({
      select: { name: true },
    });

    const names = groups.map((g) => g.name);

    const requiredGroups = [
      'kyc',
      'users',
      'roles',
      'projects',
      'billing',
      'messaging',
      'analytics',
      'sp_management',
    ];

    for (const group of requiredGroups) {
      expect(names).toContain(group);
    }
  });

  // ─── Test 1.5 ─────────────────────────────────────────────────────────

  it('1.5 — All permissions are seeded (>= 30)', async () => {
    const count = await prisma.permission.count();
    expect(count).toBeGreaterThanOrEqual(30);
  });

  // ─── Test 1.6 ─────────────────────────────────────────────────────────

  it('1.6 — SUPER_ADMIN has all permissions', async () => {
    const superAdmin = await prisma.role.findUnique({
      where: { name: 'SUPER_ADMIN' },
      include: { _count: { select: { rolePermissions: true } } },
    });

    expect(superAdmin).not.toBeNull();

    const totalPermissions = await prisma.permission.count();

    expect(superAdmin!._count.rolePermissions).toBe(totalPermissions);
  });

  // ─── Test 1.7 ─────────────────────────────────────────────────────────

  it('1.7 — Role hierarchy is correct (KYC_ADMIN → SUPER_ADMIN)', async () => {
    const superAdmin = await prisma.role.findUnique({
      where: { name: 'SUPER_ADMIN' },
    });

    const kycAdmin = await prisma.role.findUnique({
      where: { name: 'KYC_ADMIN' },
    });

    expect(superAdmin).not.toBeNull();
    expect(kycAdmin).not.toBeNull();
    expect(kycAdmin!.parentId).toBe(superAdmin!.id);
    expect(kycAdmin!.isSystem).toBe(true);
    expect(kycAdmin!.actorType).toBe('ADMIN');
  });

  // ─── Test 1.8 ─────────────────────────────────────────────────────────

  it('1.8 — Indexes exist on critical columns', async () => {
    const result = await prisma.$queryRaw<
      { indexname: string; tablename: string; indexdef: string }[]
    >`
      SELECT indexname, tablename, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
    `;

    const indexNames = result.map((r) => r.indexname);

    // users.phone — explicit index
    expect(indexNames).toContain('users_phone_idx');

    // users.userType + status — composite index
    expect(indexNames).toContain('users_userType_status_idx');

    // sp_profiles.city + spStatus — composite index
    expect(indexNames).toContain('sp_profiles_city_spStatus_idx');
  });
});
