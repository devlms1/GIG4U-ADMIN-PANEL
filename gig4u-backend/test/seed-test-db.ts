/**
 * Seeds only permission_groups, permissions, roles, and role_permissions
 * into the test database. No user data. Idempotent via upsert.
 *
 * Usage: DATABASE_URL="..." ts-node test/seed-test-db.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.test') });

import { PrismaClient, UserType } from '@prisma/client';

const prisma = new PrismaClient();

const PERMISSION_GROUPS = [
  { name: 'kyc',            displayName: 'KYC Management',           description: 'KYC verification workflows' },
  { name: 'users',          displayName: 'User Management',          description: 'User account administration' },
  { name: 'roles',          displayName: 'Role Management',          description: 'Role and permission administration' },
  { name: 'projects',       displayName: 'Project Management',       description: 'Project lifecycle management' },
  { name: 'billing',        displayName: 'Billing & Payments',       description: 'Financial operations and invoicing' },
  { name: 'messaging',      displayName: 'Messaging',                description: 'Broadcast and notification management' },
  { name: 'analytics',      displayName: 'Analytics',                description: 'Dashboards and data exports' },
  { name: 'sp_management',  displayName: 'SP Management',            description: 'Service provider lifecycle management' },
];

const PERMISSIONS: Record<string, { name: string; displayName: string; description: string }[]> = {
  kyc: [
    { name: 'kyc:view',    displayName: 'View KYC',    description: 'View KYC submissions' },
    { name: 'kyc:approve', displayName: 'Approve KYC', description: 'Approve KYC submissions' },
    { name: 'kyc:reject',  displayName: 'Reject KYC',  description: 'Reject KYC submissions' },
    { name: 'kyc:flag',    displayName: 'Flag KYC',    description: 'Flag KYC submissions' },
  ],
  users: [
    { name: 'users:list',         displayName: 'List Users',   description: 'View user listings' },
    { name: 'users:view',         displayName: 'View User',    description: 'View user details' },
    { name: 'users:ban',          displayName: 'Ban User',     description: 'Ban user accounts' },
    { name: 'users:delete',       displayName: 'Delete User',  description: 'Soft-delete users' },
    { name: 'users:create_admin', displayName: 'Create Admin', description: 'Create admin accounts' },
  ],
  roles: [
    { name: 'roles:create', displayName: 'Create Role',  description: 'Create new roles' },
    { name: 'roles:edit',   displayName: 'Edit Role',    description: 'Edit existing roles' },
    { name: 'roles:delete', displayName: 'Delete Role',  description: 'Delete non-system roles' },
    { name: 'roles:assign', displayName: 'Assign Role',  description: 'Assign roles to users' },
    { name: 'roles:view',   displayName: 'View Roles',   description: 'View roles and permissions' },
  ],
  projects: [
    { name: 'projects:list',    displayName: 'List Projects',   description: 'View project listings' },
    { name: 'projects:create',  displayName: 'Create Project',  description: 'Create new projects' },
    { name: 'projects:approve', displayName: 'Approve Project', description: 'Approve projects' },
    { name: 'projects:close',   displayName: 'Close Project',   description: 'Close projects' },
    { name: 'projects:view',    displayName: 'View Project',    description: 'View project details' },
  ],
  billing: [
    { name: 'billing:view',             displayName: 'View Billing',     description: 'View billing' },
    { name: 'billing:process_payout',   displayName: 'Process Payout',   description: 'Process payouts' },
    { name: 'billing:generate_invoice', displayName: 'Generate Invoice', description: 'Generate invoices' },
    { name: 'billing:refund',           displayName: 'Process Refund',   description: 'Process refunds' },
  ],
  messaging: [
    { name: 'messaging:send_broadcast', displayName: 'Send Broadcast',  description: 'Send broadcasts' },
    { name: 'messaging:view_logs',      displayName: 'View Msg Logs',   description: 'View message logs' },
    { name: 'messaging:delete',         displayName: 'Delete Messages', description: 'Delete messages' },
  ],
  analytics: [
    { name: 'analytics:view_dashboard', displayName: 'View Dashboard', description: 'View dashboard' },
    { name: 'analytics:export',         displayName: 'Export Data',    description: 'Export data' },
  ],
  sp_management: [
    { name: 'sp:onboard',    displayName: 'Onboard SP',    description: 'Onboard SPs' },
    { name: 'sp:suspend',    displayName: 'Suspend SP',    description: 'Suspend SPs' },
    { name: 'sp:view_score', displayName: 'View SP Score', description: 'View SP scores' },
    { name: 'sp:view_list',  displayName: 'View SP List',  description: 'View SP listings' },
  ],
};

const ALL_PERM_NAMES = Object.values(PERMISSIONS).flatMap((g) => g.map((p) => p.name));

interface RoleDef {
  name: string;
  displayName: string;
  description: string;
  actorType: UserType;
  parentName?: string;
  permissionNames: string[];
}

const SYSTEM_ROLES: RoleDef[] = [
  { name: 'SUPER_ADMIN',     displayName: 'Super Admin',      description: 'All permissions', actorType: UserType.ADMIN, permissionNames: ALL_PERM_NAMES },
  { name: 'KYC_ADMIN',       displayName: 'KYC Admin',        description: 'KYC workflows',   actorType: UserType.ADMIN, parentName: 'SUPER_ADMIN', permissionNames: ['kyc:view','kyc:approve','kyc:reject','kyc:flag','users:view'] },
  { name: 'MESSAGE_ADMIN',   displayName: 'Messaging Admin',  description: 'Messaging',       actorType: UserType.ADMIN, parentName: 'SUPER_ADMIN', permissionNames: ['messaging:send_broadcast','messaging:view_logs','messaging:delete','users:view'] },
  { name: 'FINANCE_ADMIN',   displayName: 'Finance Admin',    description: 'Finance',         actorType: UserType.ADMIN, parentName: 'SUPER_ADMIN', permissionNames: ['billing:view','billing:process_payout','billing:generate_invoice','billing:refund','analytics:view_dashboard'] },
  { name: 'OPERATIONS_ADMIN',displayName: 'Operations Admin', description: 'Operations',      actorType: UserType.ADMIN, parentName: 'SUPER_ADMIN', permissionNames: ['projects:list','projects:view','projects:approve','sp:onboard','sp:suspend','sp:view_list','sp:view_score'] },
  { name: 'SUPPORT_ADMIN',   displayName: 'Support Admin',    description: 'Support',         actorType: UserType.ADMIN, parentName: 'SUPER_ADMIN', permissionNames: ['users:list','users:view','users:ban','sp:view_score','sp:view_list'] },
  { name: 'CLIENT_ADMIN',    displayName: 'Client Admin',     description: 'Client admin',    actorType: UserType.CLIENT, permissionNames: ['projects:list','projects:create','projects:view'] },
  { name: 'CLIENT_MANAGER',  displayName: 'Client Manager',   description: 'Client manager',  actorType: UserType.CLIENT, parentName: 'CLIENT_ADMIN', permissionNames: ['projects:list','projects:view'] },
  { name: 'CLIENT_VIEWER',   displayName: 'Client Viewer',    description: 'Client viewer',   actorType: UserType.CLIENT, parentName: 'CLIENT_ADMIN', permissionNames: ['projects:list','projects:view'] },
  { name: 'SP_BASIC',        displayName: 'Service Provider', description: 'SP role',         actorType: UserType.SP, permissionNames: [] },
];

async function main(): Promise<void> {
  console.log('Seeding test database...\n');

  // 1. Permission groups
  const groupMap = new Map<string, string>();
  for (const g of PERMISSION_GROUPS) {
    const r = await prisma.permissionGroup.upsert({ where: { name: g.name }, update: g, create: g });
    groupMap.set(r.name, r.id);
  }
  console.log(`  Groups: ${groupMap.size}`);

  // 2. Permissions
  const permMap = new Map<string, string>();
  for (const [gn, perms] of Object.entries(PERMISSIONS)) {
    const gid = groupMap.get(gn)!;
    for (const p of perms) {
      const r = await prisma.permission.upsert({
        where: { name: p.name },
        update: { ...p, groupId: gid },
        create: { ...p, groupId: gid },
      });
      permMap.set(r.name, r.id);
    }
  }
  console.log(`  Permissions: ${permMap.size}`);

  // 3. Roles (two-pass for hierarchy)
  const roleMap = new Map<string, string>();
  for (const def of SYSTEM_ROLES) {
    const r = await prisma.role.upsert({
      where: { name: def.name },
      update: { displayName: def.displayName, description: def.description, actorType: def.actorType, isSystem: true, isActive: true },
      create: { name: def.name, displayName: def.displayName, description: def.description, actorType: def.actorType, isSystem: true, isActive: true },
    });
    roleMap.set(def.name, r.id);
  }
  for (const def of SYSTEM_ROLES) {
    if (def.parentName) {
      await prisma.role.update({ where: { id: roleMap.get(def.name)! }, data: { parentId: roleMap.get(def.parentName)! } });
    }
  }

  // 4. Role-Permission mappings
  let mappings = 0;
  for (const def of SYSTEM_ROLES) {
    const rid = roleMap.get(def.name)!;
    for (const pn of def.permissionNames) {
      const pid = permMap.get(pn);
      if (!pid) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: rid, permissionId: pid } },
        update: {},
        create: { roleId: rid, permissionId: pid },
      });
      mappings++;
    }
  }
  console.log(`  Roles: ${roleMap.size}, Mappings: ${mappings}`);
  console.log('\nTest DB seeded.\n');
}

main()
  .catch((e) => { console.error('Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
