"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
const BCRYPT_ROUNDS = 12;
const PERMISSION_GROUPS = [
    { name: 'kyc', displayName: 'KYC Management', description: 'KYC verification workflows' },
    { name: 'users', displayName: 'User Management', description: 'User account administration' },
    { name: 'roles', displayName: 'Role Management', description: 'Role and permission administration' },
    { name: 'projects', displayName: 'Project Management', description: 'Project lifecycle management' },
    { name: 'billing', displayName: 'Billing & Payments', description: 'Financial operations and invoicing' },
    { name: 'messaging', displayName: 'Messaging', description: 'Broadcast and notification management' },
    { name: 'analytics', displayName: 'Analytics', description: 'Dashboards and data exports' },
    { name: 'sp_management', displayName: 'SP Management', description: 'Service provider lifecycle management' },
];
const PERMISSIONS = {
    kyc: [
        { name: 'kyc:view', displayName: 'View KYC', description: 'View KYC submissions and status' },
        { name: 'kyc:approve', displayName: 'Approve KYC', description: 'Approve KYC submissions' },
        { name: 'kyc:reject', displayName: 'Reject KYC', description: 'Reject KYC submissions with reason' },
        { name: 'kyc:flag', displayName: 'Flag KYC', description: 'Flag KYC submissions for review' },
    ],
    users: [
        { name: 'users:list', displayName: 'List Users', description: 'View user listings' },
        { name: 'users:view', displayName: 'View User', description: 'View user details' },
        { name: 'users:ban', displayName: 'Ban User', description: 'Ban or suspend user accounts' },
        { name: 'users:delete', displayName: 'Delete User', description: 'Soft-delete user accounts' },
        { name: 'users:create_admin', displayName: 'Create Admin', description: 'Create admin user accounts' },
    ],
    roles: [
        { name: 'roles:create', displayName: 'Create Role', description: 'Create new roles' },
        { name: 'roles:edit', displayName: 'Edit Role', description: 'Edit existing roles' },
        { name: 'roles:delete', displayName: 'Delete Role', description: 'Delete non-system roles' },
        { name: 'roles:assign', displayName: 'Assign Role', description: 'Assign roles to users' },
        { name: 'roles:view', displayName: 'View Roles', description: 'View roles and permissions' },
    ],
    projects: [
        { name: 'projects:list', displayName: 'List Projects', description: 'View project listings' },
        { name: 'projects:create', displayName: 'Create Project', description: 'Create new projects' },
        { name: 'projects:approve', displayName: 'Approve Project', description: 'Approve project submissions' },
        { name: 'projects:close', displayName: 'Close Project', description: 'Close completed projects' },
        { name: 'projects:view', displayName: 'View Project', description: 'View project details' },
    ],
    billing: [
        { name: 'billing:view', displayName: 'View Billing', description: 'View billing and transactions' },
        { name: 'billing:process_payout', displayName: 'Process Payout', description: 'Process SP payouts' },
        { name: 'billing:generate_invoice', displayName: 'Generate Invoice', description: 'Generate invoices for clients' },
        { name: 'billing:refund', displayName: 'Process Refund', description: 'Process refunds' },
    ],
    messaging: [
        { name: 'messaging:send_broadcast', displayName: 'Send Broadcast', description: 'Send broadcast messages' },
        { name: 'messaging:view_logs', displayName: 'View Msg Logs', description: 'View message logs' },
        { name: 'messaging:delete', displayName: 'Delete Messages', description: 'Delete messages' },
    ],
    analytics: [
        { name: 'analytics:view_dashboard', displayName: 'View Dashboard', description: 'View analytics dashboard' },
        { name: 'analytics:export', displayName: 'Export Data', description: 'Export analytics data' },
    ],
    sp_management: [
        { name: 'sp:onboard', displayName: 'Onboard SP', description: 'Onboard service providers' },
        { name: 'sp:suspend', displayName: 'Suspend SP', description: 'Suspend service providers' },
        { name: 'sp:view_score', displayName: 'View SP Score', description: 'View SP behavior scores' },
        { name: 'sp:view_list', displayName: 'View SP List', description: 'View SP listings' },
    ],
};
const ALL_PERMISSION_NAMES = Object.values(PERMISSIONS).flatMap((g) => g.map((p) => p.name));
const SYSTEM_ROLES = [
    {
        name: 'SUPER_ADMIN',
        displayName: 'Super Admin',
        description: 'Full platform access — all permissions',
        actorType: client_1.UserType.ADMIN,
        permissionNames: ALL_PERMISSION_NAMES,
    },
    {
        name: 'KYC_ADMIN',
        displayName: 'KYC Admin',
        description: 'Manages KYC verification workflows',
        actorType: client_1.UserType.ADMIN,
        parentName: 'SUPER_ADMIN',
        permissionNames: ['kyc:view', 'kyc:approve', 'kyc:reject', 'kyc:flag', 'users:view'],
    },
    {
        name: 'MESSAGE_ADMIN',
        displayName: 'Messaging Admin',
        description: 'Manages broadcast messages and notification logs',
        actorType: client_1.UserType.ADMIN,
        parentName: 'SUPER_ADMIN',
        permissionNames: ['messaging:send_broadcast', 'messaging:view_logs', 'messaging:delete', 'users:view'],
    },
    {
        name: 'FINANCE_ADMIN',
        displayName: 'Finance Admin',
        description: 'Manages billing, payouts, invoices, and refunds',
        actorType: client_1.UserType.ADMIN,
        parentName: 'SUPER_ADMIN',
        permissionNames: [
            'billing:view', 'billing:process_payout', 'billing:generate_invoice',
            'billing:refund', 'analytics:view_dashboard',
        ],
    },
    {
        name: 'OPERATIONS_ADMIN',
        displayName: 'Operations Admin',
        description: 'Manages projects, SP onboarding, and day-to-day operations',
        actorType: client_1.UserType.ADMIN,
        parentName: 'SUPER_ADMIN',
        permissionNames: [
            'projects:list', 'projects:view', 'projects:approve',
            'sp:onboard', 'sp:suspend', 'sp:view_list', 'sp:view_score',
        ],
    },
    {
        name: 'SUPPORT_ADMIN',
        displayName: 'Support Admin',
        description: 'Manages user support, bans, and SP oversight',
        actorType: client_1.UserType.ADMIN,
        parentName: 'SUPER_ADMIN',
        permissionNames: ['users:list', 'users:view', 'users:ban', 'sp:view_score', 'sp:view_list'],
    },
    {
        name: 'CLIENT_ADMIN',
        displayName: 'Client Admin',
        description: 'Full access within their tenant scope',
        actorType: client_1.UserType.CLIENT,
        permissionNames: ['projects:list', 'projects:create', 'projects:view'],
    },
    {
        name: 'CLIENT_MANAGER',
        displayName: 'Client Manager',
        description: 'Manages projects within their tenant',
        actorType: client_1.UserType.CLIENT,
        parentName: 'CLIENT_ADMIN',
        permissionNames: ['projects:list', 'projects:view'],
    },
    {
        name: 'CLIENT_VIEWER',
        displayName: 'Client Viewer',
        description: 'Read-only access within their tenant',
        actorType: client_1.UserType.CLIENT,
        parentName: 'CLIENT_ADMIN',
        permissionNames: ['projects:list', 'projects:view'],
    },
    {
        name: 'SP_BASIC',
        displayName: 'Service Provider',
        description: 'Standard service provider role — no admin permissions',
        actorType: client_1.UserType.SP,
        permissionNames: [],
    },
];
async function seedPermissionGroups() {
    const map = new Map();
    for (const group of PERMISSION_GROUPS) {
        const record = await prisma.permissionGroup.upsert({
            where: { name: group.name },
            update: { displayName: group.displayName, description: group.description },
            create: group,
        });
        map.set(record.name, record.id);
    }
    console.log(`  ✓ ${map.size} permission groups`);
    return map;
}
async function seedPermissions(groupMap) {
    const map = new Map();
    for (const [groupName, perms] of Object.entries(PERMISSIONS)) {
        const groupId = groupMap.get(groupName);
        for (const perm of perms) {
            const record = await prisma.permission.upsert({
                where: { name: perm.name },
                update: { displayName: perm.displayName, description: perm.description, groupId },
                create: { name: perm.name, displayName: perm.displayName, description: perm.description, groupId },
            });
            map.set(record.name, record.id);
        }
    }
    console.log(`  ✓ ${map.size} permissions`);
    return map;
}
async function seedRoles(permMap) {
    const roleIdMap = new Map();
    for (const def of SYSTEM_ROLES) {
        const record = await prisma.role.upsert({
            where: { name: def.name },
            update: {
                displayName: def.displayName,
                description: def.description,
                actorType: def.actorType,
                isSystem: true,
                isActive: true,
            },
            create: {
                name: def.name,
                displayName: def.displayName,
                description: def.description,
                actorType: def.actorType,
                isSystem: true,
                isActive: true,
            },
        });
        roleIdMap.set(def.name, record.id);
    }
    for (const def of SYSTEM_ROLES) {
        if (def.parentName) {
            await prisma.role.update({
                where: { id: roleIdMap.get(def.name) },
                data: { parentId: roleIdMap.get(def.parentName) },
            });
        }
    }
    let totalMappings = 0;
    for (const def of SYSTEM_ROLES) {
        const roleId = roleIdMap.get(def.name);
        for (const permName of def.permissionNames) {
            const permissionId = permMap.get(permName);
            if (!permissionId) {
                console.warn(`  ⚠ permission "${permName}" not found, skipping`);
                continue;
            }
            await prisma.rolePermission.upsert({
                where: { roleId_permissionId: { roleId, permissionId } },
                update: {},
                create: { roleId, permissionId },
            });
            totalMappings++;
        }
    }
    console.log(`  ✓ ${roleIdMap.size} roles, ${totalMappings} role-permission mappings`);
    return roleIdMap;
}
async function seedSuperAdminUser(roleIdMap) {
    const phone = process.env.SEED_ADMIN_PHONE || '9999999999';
    const email = process.env.SEED_ADMIN_EMAIL || 'superadmin@gig4u.com';
    const password = process.env.SEED_ADMIN_PASSWORD || 'Admin@123456';
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await prisma.user.upsert({
        where: { phone },
        update: {
            email,
            passwordHash,
            userType: client_1.UserType.ADMIN,
            isPhoneVerified: true,
            isEmailVerified: true,
        },
        create: {
            phone,
            email,
            passwordHash,
            userType: client_1.UserType.ADMIN,
            isPhoneVerified: true,
            isEmailVerified: true,
        },
    });
    await prisma.adminProfile.upsert({
        where: { userId: user.id },
        update: { fullName: 'Super Admin', department: 'Platform' },
        create: {
            userId: user.id,
            fullName: 'Super Admin',
            department: 'Platform',
            activeRoleId: roleIdMap.get('SUPER_ADMIN'),
        },
    });
    const superAdminRoleId = roleIdMap.get('SUPER_ADMIN');
    const existingAssignment = await prisma.userRole.findFirst({
        where: { userId: user.id, roleId: superAdminRoleId, isActive: true },
    });
    if (!existingAssignment) {
        await prisma.userRole.create({
            data: { userId: user.id, roleId: superAdminRoleId },
        });
    }
    console.log(`  ✓ Super Admin user: ${phone} / ${email}`);
}
const TEST_ADMIN_USERS = [
    { phone: '9000000001', email: 'superadmin@gmail.com', password: 'Superadmin1password', fullName: 'Super Admin', employeeId: 'EMP-SUPER-01', department: 'Platform', roleName: 'SUPER_ADMIN' },
    { phone: '9000000002', email: 'adminrole1@gmail.com', password: 'Adminrole1password', fullName: 'KYC Admin', employeeId: 'EMP-KYC-01', department: 'Verification', roleName: 'KYC_ADMIN' },
    { phone: '9000000003', email: 'adminrole2@gmail.com', password: 'Adminrole2password', fullName: 'Finance Admin', employeeId: 'EMP-FIN-01', department: 'Finance', roleName: 'FINANCE_ADMIN' },
    { phone: '9000000004', email: 'adminrole3@gmail.com', password: 'Adminrole3password', fullName: 'Operations Admin', employeeId: 'EMP-OPS-01', department: 'Operations', roleName: 'OPERATIONS_ADMIN' },
    { phone: '9000000005', email: 'adminrole4@gmail.com', password: 'Adminrole4password', fullName: 'Message Admin', employeeId: 'EMP-MSG-01', department: 'Communications', roleName: 'MESSAGE_ADMIN' },
    { phone: '9000000006', email: 'adminrole5@gmail.com', password: 'Adminrole5password', fullName: 'Support Admin', employeeId: 'EMP-SUP-01', department: 'Customer Support', roleName: 'SUPPORT_ADMIN' },
];
const TEST_CLIENT = {
    phone: '9000000007', email: 'clientuser1@gmail.com', password: 'Clientuser1password',
    fullName: 'Client User One', companyName: 'TestCorp Pvt Ltd',
    designation: 'HR Manager', department: 'Human Resources',
};
const TEST_SP = {
    phone: '9000000008', email: 'spuser1@gmail.com', password: 'Spuser1password',
    fullName: 'SP User One', city: 'Bangalore', state: 'Karnataka',
    pincode: '560001', gender: 'Male', dateOfBirth: '1995-03-20',
};
async function seedTestUsers(roleIdMap) {
    for (const admin of TEST_ADMIN_USERS) {
        const passwordHash = await bcrypt.hash(admin.password, BCRYPT_ROUNDS);
        const user = await prisma.user.upsert({
            where: { phone: admin.phone },
            update: { email: admin.email, passwordHash, userType: client_1.UserType.ADMIN },
            create: { phone: admin.phone, email: admin.email, passwordHash, userType: client_1.UserType.ADMIN },
        });
        await prisma.adminProfile.upsert({
            where: { userId: user.id },
            update: { fullName: admin.fullName, employeeId: admin.employeeId, department: admin.department, activeRoleId: roleIdMap.get(admin.roleName) },
            create: { userId: user.id, fullName: admin.fullName, employeeId: admin.employeeId, department: admin.department, activeRoleId: roleIdMap.get(admin.roleName) },
        });
        const roleId = roleIdMap.get(admin.roleName);
        const existing = await prisma.userRole.findFirst({
            where: { userId: user.id, roleId, isActive: true },
        });
        if (!existing) {
            await prisma.userRole.create({ data: { userId: user.id, roleId } });
        }
        console.log(`    ${admin.phone} → ${admin.roleName} (${admin.fullName})`);
    }
    {
        const c = TEST_CLIENT;
        const passwordHash = await bcrypt.hash(c.password, BCRYPT_ROUNDS);
        const user = await prisma.user.upsert({
            where: { phone: c.phone },
            update: { email: c.email, passwordHash, userType: client_1.UserType.CLIENT },
            create: { phone: c.phone, email: c.email, passwordHash, userType: client_1.UserType.CLIENT },
        });
        let tenant = await prisma.tenant.findFirst({ where: { companyName: c.companyName } });
        if (!tenant) {
            tenant = await prisma.tenant.create({ data: { companyName: c.companyName } });
        }
        await prisma.clientProfile.upsert({
            where: { userId: user.id },
            update: { fullName: c.fullName, designation: c.designation, department: c.department, tenantId: tenant.id },
            create: { userId: user.id, tenantId: tenant.id, fullName: c.fullName, designation: c.designation, department: c.department },
        });
        const clientAdminRoleId = roleIdMap.get('CLIENT_ADMIN');
        const existing = await prisma.userRole.findFirst({
            where: { userId: user.id, roleId: clientAdminRoleId, isActive: true },
        });
        if (!existing) {
            await prisma.userRole.create({ data: { userId: user.id, roleId: clientAdminRoleId, tenantId: tenant.id } });
        }
        console.log(`    ${c.phone} → CLIENT_ADMIN (${c.fullName}) @ ${c.companyName}`);
    }
    {
        const s = TEST_SP;
        const passwordHash = await bcrypt.hash(s.password, BCRYPT_ROUNDS);
        const user = await prisma.user.upsert({
            where: { phone: s.phone },
            update: { email: s.email, passwordHash, userType: client_1.UserType.SP },
            create: { phone: s.phone, email: s.email, passwordHash, userType: client_1.UserType.SP },
        });
        await prisma.spProfile.upsert({
            where: { userId: user.id },
            update: { fullName: s.fullName, city: s.city, state: s.state, pincode: s.pincode, gender: s.gender, dateOfBirth: new Date(s.dateOfBirth), spStatus: 'KYC_PENDING' },
            create: { userId: user.id, fullName: s.fullName, city: s.city, state: s.state, pincode: s.pincode, gender: s.gender, dateOfBirth: new Date(s.dateOfBirth), spStatus: 'KYC_PENDING' },
        });
        const spRoleId = roleIdMap.get('SP_BASIC');
        const existing = await prisma.userRole.findFirst({
            where: { userId: user.id, roleId: spRoleId, isActive: true },
        });
        if (!existing) {
            await prisma.userRole.create({ data: { userId: user.id, roleId: spRoleId } });
        }
        console.log(`    ${s.phone} → SP_BASIC (${s.fullName}) @ ${s.city}`);
    }
    console.log(`  ✓ 8 test users seeded`);
}
async function main() {
    console.log('\n🌱 Seeding GIG4U database...\n');
    console.log('Step 1 — Permission Groups');
    const groupMap = await seedPermissionGroups();
    console.log('Step 2 — Permissions');
    const permMap = await seedPermissions(groupMap);
    console.log('Step 3 — System Roles + Permission Mappings');
    const roleIdMap = await seedRoles(permMap);
    console.log('Step 4 — Bootstrap Super Admin (9999999999)');
    await seedSuperAdminUser(roleIdMap);
    console.log('Step 5 — Test Users (8 users from TEST_RESULTS.md)');
    await seedTestUsers(roleIdMap);
    console.log('\n✅ Seed completed successfully.\n');
}
main()
    .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map