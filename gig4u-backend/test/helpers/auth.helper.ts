import { PrismaClient, UserType } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 4; // faster rounds for tests
const DEFAULT_PASSWORD = 'TestPass1';
const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret-32-chars-minimum-ok';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-32-chars-minimum-ok';

const jwtService = new JwtService({});

interface TestUserResult {
  user: {
    id: string;
    phone: string;
    email: string | null;
    userType: UserType;
  };
  accessToken: string;
  refreshToken: string;
  password: string;
}

/**
 * Creates a generic test user and returns tokens.
 */
export async function createTestUser(
  prisma: PrismaClient,
  overrides: {
    phone?: string;
    email?: string;
    userType?: UserType;
    password?: string;
  } = {},
): Promise<TestUserResult> {
  const phone = overrides.phone || `01${Date.now().toString().slice(-8)}`;
  const password = overrides.password || DEFAULT_PASSWORD;
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      phone,
      email: overrides.email,
      passwordHash,
      userType: overrides.userType || UserType.CLIENT,
    },
  });

  const payload = {
    sub: user.id,
    userType: user.userType,
    roles: [] as string[],
    permissions: [] as string[],
    tenantId: null,
  };

  const accessToken = jwtService.sign(payload, {
    secret: JWT_SECRET,
    expiresIn: '15m',
  });

  const refreshToken = jwtService.sign(payload, {
    secret: JWT_REFRESH_SECRET,
    expiresIn: '7d',
  });

  return { user, accessToken, refreshToken, password };
}

/**
 * Creates a CLIENT user with tenant, client_profile, and CLIENT_ADMIN role.
 */
export async function createTestClient(
  prisma: PrismaClient,
  phone?: string,
): Promise<TestUserResult> {
  const actualPhone = phone || `02${Date.now().toString().slice(-8)}`;
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      phone: actualPhone,
      passwordHash,
      userType: UserType.CLIENT,
    },
  });

  const tenant = await prisma.tenant.create({
    data: { companyName: `TestCo_${actualPhone}` },
  });

  await prisma.clientProfile.create({
    data: { userId: user.id, tenantId: tenant.id },
  });

  const clientAdminRole = await prisma.role.findUnique({
    where: { name: 'CLIENT_ADMIN' },
  });

  const roleNames: string[] = [];
  const permNames: string[] = [];

  if (clientAdminRole) {
    await prisma.userRole.create({
      data: { userId: user.id, roleId: clientAdminRole.id, tenantId: tenant.id },
    });
    roleNames.push(clientAdminRole.name);

    const rolePerms = await prisma.rolePermission.findMany({
      where: { roleId: clientAdminRole.id },
      include: { permission: true },
    });
    permNames.push(...rolePerms.map((rp) => rp.permission.name));
  }

  const payload = {
    sub: user.id,
    userType: UserType.CLIENT,
    roles: roleNames,
    permissions: permNames,
    tenantId: tenant.id,
  };

  const accessToken = jwtService.sign(payload, { secret: JWT_SECRET, expiresIn: '15m' });
  const refreshToken = jwtService.sign(payload, { secret: JWT_REFRESH_SECRET, expiresIn: '7d' });

  return { user, accessToken, refreshToken, password: DEFAULT_PASSWORD };
}

/**
 * Creates an SP user with sp_profile and SP_BASIC role.
 */
export async function createTestSP(
  prisma: PrismaClient,
  phone?: string,
): Promise<TestUserResult> {
  const actualPhone = phone || `03${Date.now().toString().slice(-8)}`;
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      phone: actualPhone,
      passwordHash,
      userType: UserType.SP,
    },
  });

  await prisma.spProfile.create({ data: { userId: user.id } });

  const spRole = await prisma.role.findUnique({ where: { name: 'SP_BASIC' } });
  const roleNames: string[] = [];

  if (spRole) {
    await prisma.userRole.create({ data: { userId: user.id, roleId: spRole.id } });
    roleNames.push(spRole.name);
  }

  const payload = {
    sub: user.id,
    userType: UserType.SP,
    roles: roleNames,
    permissions: [] as string[],
    tenantId: null,
  };

  const accessToken = jwtService.sign(payload, { secret: JWT_SECRET, expiresIn: '15m' });
  const refreshToken = jwtService.sign(payload, { secret: JWT_REFRESH_SECRET, expiresIn: '7d' });

  return { user, accessToken, refreshToken, password: DEFAULT_PASSWORD };
}

/**
 * Creates an ADMIN user with admin_profile and the specified role assigned.
 */
export async function createTestAdmin(
  prisma: PrismaClient,
  roleName: string,
  phone?: string,
): Promise<TestUserResult> {
  const actualPhone = phone || `04${Date.now().toString().slice(-8)}`;
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      phone: actualPhone,
      passwordHash,
      userType: UserType.ADMIN,
    },
  });

  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) throw new Error(`Role "${roleName}" not found in test DB`);

  await prisma.adminProfile.create({
    data: { userId: user.id, fullName: `TestAdmin_${roleName}`, activeRoleId: role.id },
  });

  await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });

  const rolePerms = await prisma.rolePermission.findMany({
    where: { roleId: role.id },
    include: { permission: true },
  });
  const permNames = rolePerms.map((rp) => rp.permission.name);

  const payload = {
    sub: user.id,
    userType: UserType.ADMIN,
    roles: [role.name],
    permissions: permNames,
    tenantId: null,
  };

  const accessToken = jwtService.sign(payload, { secret: JWT_SECRET, expiresIn: '15m' });
  const refreshToken = jwtService.sign(payload, { secret: JWT_REFRESH_SECRET, expiresIn: '7d' });

  return { user, accessToken, refreshToken, password: DEFAULT_PASSWORD };
}

/**
 * Deletes a user and all related data (cascading where possible).
 */
export async function cleanupUser(
  prisma: PrismaClient,
  userId: string,
): Promise<void> {
  await prisma.adminSession.deleteMany({ where: { userId } });
  await prisma.refreshToken.deleteMany({ where: { userId } });
  await prisma.auditLog.deleteMany({ where: { actorUserId: userId } });
  await prisma.userRole.deleteMany({ where: { userId } });
  await prisma.adminProfile.deleteMany({ where: { userId } });
  await prisma.clientProfile.deleteMany({ where: { userId } });
  await prisma.spProfile.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
}

/**
 * Returns an Authorization header object for supertest.
 */
export function getAuthHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}
