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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const client_1 = require("@prisma/client");
const auth_repository_1 = require("./auth.repository");
const BCRYPT_ROUNDS = 12;
let AuthService = class AuthService {
    authRepo;
    jwtService;
    configService;
    constructor(authRepo, jwtService, configService) {
        this.authRepo = authRepo;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async signup(dto) {
        if (dto.userType === client_1.UserType.ADMIN) {
            throw new common_1.ForbiddenException('Admin accounts cannot be created via public signup');
        }
        const exists = await this.authRepo.phoneExists(dto.phone);
        if (exists) {
            throw new common_1.ConflictException('Phone number is already registered');
        }
        const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
        let user;
        if (dto.userType === client_1.UserType.CLIENT) {
            user = await this.authRepo.createClientUser({
                phone: dto.phone,
                email: dto.email,
                passwordHash,
                companyName: dto.companyName,
            });
        }
        else {
            user = await this.authRepo.createSpUser({
                phone: dto.phone,
                email: dto.email,
                passwordHash,
            });
        }
        const { roles, permissions, tenantId } = this.extractRolesAndPermissions(user);
        const tokens = await this.issueTokenPair(user.id, user.userType, roles, permissions, tenantId);
        return {
            data: {
                user: this.sanitiseUser(user),
                ...tokens,
            },
            message: 'Account created successfully',
        };
    }
    async login(dto) {
        const user = await this.authRepo.findUserByPhone(dto.phone);
        if (!user || !user.passwordHash) {
            throw new common_1.UnauthorizedException('Invalid phone or password');
        }
        if (user.status === client_1.UserStatus.BANNED ||
            user.status === client_1.UserStatus.SUSPENDED) {
            throw new common_1.ForbiddenException(`Your account is ${user.status.toLowerCase()}`);
        }
        const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!passwordValid) {
            throw new common_1.UnauthorizedException('Invalid phone or password');
        }
        await this.authRepo.updateLastLogin(user.id);
        if (user.userType === client_1.UserType.ADMIN) {
            const adminRoles = await this.authRepo.findAdminRolesForUser(user.id);
            if (adminRoles.length === 0) {
                throw new common_1.ForbiddenException('No admin roles assigned');
            }
            if (adminRoles.length === 1) {
                const selectedRole = adminRoles[0].role;
                const permissions = selectedRole.rolePermissions.map((rp) => rp.permission.name);
                const jti = crypto.randomUUID();
                const tokens = await this.issueTokenPair(user.id, client_1.UserType.ADMIN, [selectedRole.name], permissions, null, jti);
                const accessExpiry = this.configService.get('JWT_ACCESS_EXPIRES_IN', '15m');
                await this.authRepo.createAdminSession({
                    userId: user.id,
                    selectedRoleId: selectedRole.id,
                    jwtJti: jti,
                    expiresAt: this.parseExpiryToDate(accessExpiry),
                });
                return {
                    data: {
                        user: this.sanitiseUser(user),
                        ...tokens,
                        selectedRole: {
                            id: selectedRole.id,
                            name: selectedRole.name,
                            displayName: selectedRole.displayName,
                        },
                    },
                    message: 'Login successful',
                };
            }
            const tempToken = this.jwtService.sign({ sub: user.id, purpose: 'role_selection' }, {
                secret: this.configService.getOrThrow('JWT_ACCESS_SECRET'),
                expiresIn: '5m',
            });
            return {
                data: {
                    requiresRoleSelection: true,
                    availableRoles: adminRoles.map((ur) => ({
                        id: ur.role.id,
                        name: ur.role.name,
                        displayName: ur.role.displayName,
                    })),
                    tempToken,
                },
                message: 'Select a role to continue',
            };
        }
        const { roles, permissions, tenantId } = this.extractRolesAndPermissions(user);
        const tokens = await this.issueTokenPair(user.id, user.userType, roles, permissions, tenantId);
        return {
            data: {
                user: this.sanitiseUser(user),
                ...tokens,
            },
            message: 'Login successful',
        };
    }
    async selectRole(dto, tempToken) {
        let payload;
        try {
            payload = this.jwtService.verify(tempToken, {
                secret: this.configService.getOrThrow('JWT_ACCESS_SECRET'),
            });
        }
        catch {
            throw new common_1.UnauthorizedException('Role selection token is invalid or expired');
        }
        if (payload.purpose !== 'role_selection') {
            throw new common_1.UnauthorizedException('Invalid token purpose');
        }
        const userId = payload.sub;
        const hasRole = await this.authRepo.userHasRole(userId, dto.roleId);
        if (!hasRole) {
            throw new common_1.ForbiddenException('This role is not assigned to you');
        }
        const role = await this.authRepo.findRoleById(dto.roleId);
        if (!role) {
            throw new common_1.NotFoundException('Role not found');
        }
        const permissions = role.rolePermissions.map((rp) => rp.permission.name);
        const jti = crypto.randomUUID();
        const tokens = await this.issueTokenPair(userId, client_1.UserType.ADMIN, [role.name], permissions, null, jti);
        const accessExpiry = this.configService.get('JWT_ACCESS_EXPIRES_IN', '15m');
        await this.authRepo.createAdminSession({
            userId,
            selectedRoleId: role.id,
            jwtJti: jti,
            expiresAt: this.parseExpiryToDate(accessExpiry),
        });
        return {
            data: {
                ...tokens,
                selectedRole: {
                    id: role.id,
                    name: role.name,
                    displayName: role.displayName,
                },
            },
            message: 'Role selected successfully',
        };
    }
    async refresh(dto) {
        let payload;
        try {
            payload = this.jwtService.verify(dto.refreshToken, {
                secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
            });
        }
        catch {
            throw new common_1.UnauthorizedException('Refresh token is invalid or expired');
        }
        const tokenHash = this.hashToken(dto.refreshToken);
        const storedToken = await this.authRepo.findRefreshToken(tokenHash);
        if (!storedToken) {
            throw new common_1.UnauthorizedException('Refresh token not found or revoked');
        }
        if (storedToken.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Refresh token has expired');
        }
        await this.authRepo.revokeRefreshToken(storedToken.id);
        const tokens = await this.issueTokenPair(payload.sub, payload.userType, payload.roles, payload.permissions, payload.tenantId, payload.jti);
        return {
            data: tokens,
            message: 'Tokens refreshed successfully',
        };
    }
    async logout(currentUser) {
        await this.authRepo.revokeAllUserRefreshTokens(currentUser.sub);
        if (currentUser.userType === client_1.UserType.ADMIN) {
            await this.authRepo.terminateAdminSessions(currentUser.sub);
        }
        return {
            data: null,
            message: 'Logged out successfully',
        };
    }
    async getMe(currentUser) {
        const user = await this.authRepo.findUserById(currentUser.sub);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const { roles, permissions, tenantId } = this.extractRolesAndPermissions(user);
        return {
            data: {
                ...this.sanitiseUser(user),
                roles,
                permissions,
                tenantId,
            },
            message: 'Profile retrieved',
        };
    }
    async issueTokenPair(userId, userType, roles, permissions, tenantId, jti) {
        const accessPayload = {
            sub: userId,
            userType,
            roles,
            permissions,
            tenantId,
            ...(jti && { jti }),
        };
        const refreshPayload = {
            sub: userId,
            userType,
            roles,
            permissions,
            tenantId,
            jti: crypto.randomUUID(),
        };
        const accessToken = this.jwtService.sign(accessPayload, {
            secret: this.configService.getOrThrow('JWT_ACCESS_SECRET'),
            expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN', '15m'),
        });
        const refreshToken = this.jwtService.sign(refreshPayload, {
            secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
        });
        const refreshExpiry = this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d');
        await this.authRepo.createRefreshToken({
            userId,
            tokenHash: this.hashToken(refreshToken),
            expiresAt: this.parseExpiryToDate(refreshExpiry),
        });
        return { accessToken, refreshToken };
    }
    extractRolesAndPermissions(user) {
        const roles = user.userRoles.map((ur) => ur.role.name);
        const permissions = [
            ...new Set(user.userRoles.flatMap((ur) => ur.role.rolePermissions.map((rp) => rp.permission.name))),
        ];
        const tenantId = user.userRoles.find((ur) => ur.tenantId)?.tenantId ?? null;
        return { roles, permissions, tenantId };
    }
    sanitiseUser(user) {
        return {
            id: user.id,
            phone: user.phone,
            email: user.email,
            userType: user.userType,
            status: user.status,
            isPhoneVerified: user.isPhoneVerified,
            isEmailVerified: user.isEmailVerified,
            lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
            createdAt: user.createdAt.toISOString(),
            profile: user.clientProfile ?? user.spProfile ?? user.adminProfile ?? null,
        };
    }
    hashToken(token) {
        return crypto.createHash('sha256').update(token).digest('hex');
    }
    parseExpiryToDate(duration) {
        const match = duration.match(/^(\d+)([smhd])$/);
        if (!match) {
            return new Date(Date.now() + 15 * 60 * 1000);
        }
        const value = parseInt(match[1], 10);
        const unit = match[2];
        const multipliers = {
            s: 1000,
            m: 60 * 1000,
            h: 60 * 60 * 1000,
            d: 24 * 60 * 60 * 1000,
        };
        return new Date(Date.now() + value * multipliers[unit]);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_repository_1.AuthRepository,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map