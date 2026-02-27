# GIG4U - Complete Project Documentation

> **Version:** 1.0 &nbsp;|&nbsp; **Last Updated:** February 2026 &nbsp;|&nbsp; **Status:** Active Development

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [User Roles and Permissions](#2-user-roles-and-permissions)
3. [System Architecture](#3-system-architecture)
4. [Database Schema](#4-database-schema)
5. [Authentication Flow](#5-authentication-flow)
6. [Backend API Reference](#6-backend-api-reference)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Frontend Pages](#8-frontend-pages)
9. [Security Architecture](#9-security-architecture)
10. [Environment Configuration](#10-environment-configuration)
11. [Setup and Development Guide](#11-setup-and-development-guide)
12. [Test Coverage](#12-test-coverage)

---

## 1. Project Overview

### What is GIG4U?

GIG4U is a **Work Orchestration Platform** that connects businesses (Clients) with service providers (SPs) for seamless workforce management. Think of it as a bridge between companies that need work done and the people who do that work -- with a powerful admin panel to oversee the entire operation.

### Who Uses GIG4U?

There are three primary types of users on the platform:

| User Type | Who They Are | What They Do |
|-----------|-------------|--------------|
| **Client** | Businesses and organizations | Post work requirements, manage teams, handle billing |
| **Service Provider (SP)** | Individual workers or contractors | Accept work, complete KYC verification, manage their profile |
| **Admin** | Platform operators | Oversee users, approve KYC, manage roles, view analytics |

### Key Features

- **Multi-Tenant Architecture** -- Each client organization operates in its own isolated space (tenant), with its own team members, billing, and settings.
- **Role-Based Access Control (RBAC)** -- Fine-grained permissions ensure every user sees only what they should. A KYC admin cannot access finance data, and a finance admin cannot approve KYC.
- **KYC and Compliance Tracking** -- Service providers go through a verification pipeline (Profile Incomplete -> KYC Pending -> KYC Submitted -> KYC Approved -> Active).
- **Audit Trail** -- Every sensitive action (user status change, role assignment, permission grant) is logged for accountability.
- **JWT Authentication with Token Rotation** -- Secure session management with automatic token refresh and revocation.

### Platform Ecosystem

```mermaid
graph TB
    subgraph clients [Client Organizations]
        C1["Company A<br/>(Tenant)"]
        C2["Company B<br/>(Tenant)"]
        C3["Company C<br/>(Tenant)"]
    end

    subgraph platform [GIG4U Platform]
        API["Backend API<br/>(NestJS)"]
        DB["Database<br/>(PostgreSQL)"]
        UI["Frontend<br/>(Next.js)"]
    end

    subgraph providers [Service Providers]
        SP1["Worker 1"]
        SP2["Worker 2"]
        SP3["Worker 3"]
    end

    subgraph admins [Admin Panel]
        SA["Super Admin"]
        KA["KYC Admin"]
        FA["Finance Admin"]
        OA["Operations Admin"]
    end

    C1 --> UI
    C2 --> UI
    C3 --> UI
    SP1 --> UI
    SP2 --> UI
    SP3 --> UI
    UI --> API
    API --> DB
    SA --> UI
    KA --> UI
    FA --> UI
    OA --> UI
```

---

## 2. User Roles and Permissions

### User Types

The system defines four actor types. Each user belongs to exactly one type, set at registration and immutable:

| Type | Code | Description |
|------|------|-------------|
| Client | `CLIENT` | Business users who belong to an organization (tenant) |
| Service Provider | `SP` | Individual workers who complete gigs |
| Admin | `ADMIN` | Platform staff with specific operational roles |
| Partner | `PARTNER` | Reserved for future use |

### System Roles

10 pre-seeded roles are built into the system. They cannot be deleted (marked `isSystem: true`):

**Admin Roles (6):**

| Role | Display Name | Purpose |
|------|-------------|---------|
| `SUPER_ADMIN` | Super Admin | Full platform access. Can manage all users, roles, permissions, and settings. Bypasses all permission checks. |
| `KYC_ADMIN` | KYC Admin | Reviews and approves service provider KYC submissions |
| `FINANCE_ADMIN` | Finance Admin | Manages billing, payouts, and financial reports |
| `OPERATIONS_ADMIN` | Operations Admin | Oversees day-to-day platform operations, projects, and SP management |
| `MESSAGE_ADMIN` | Message Admin | Manages platform messaging and communications |
| `SUPPORT_ADMIN` | Support Admin | Handles user support tickets and issues |

**Client Roles (3):**

| Role | Display Name | Purpose |
|------|-------------|---------|
| `CLIENT_ADMIN` | Client Admin | Full control within their tenant -- manages team, billing, projects |
| `CLIENT_MANAGER` | Client Manager | Can manage projects and team within their tenant |
| `CLIENT_VIEWER` | Client Viewer | Read-only access to tenant data |

**SP Roles (1):**

| Role | Display Name | Purpose |
|------|-------------|---------|
| `SP_BASIC` | SP Basic | Standard service provider access |

### Permission Groups and Permissions

Permissions are organized into 8 groups. Each permission controls access to a specific action:

| Group | Permissions | Description |
|-------|------------|-------------|
| **KYC** | `kyc:view`, `kyc:approve`, `kyc:reject`, `kyc:request_resubmit` | View and manage KYC verification requests |
| **Users** | `users:list`, `users:view`, `users:ban`, `users:create_admin` | View user lists, user details, ban/suspend users, create admin accounts |
| **Roles** | `roles:read`, `roles:write`, `roles:delete`, `roles:assign`, `roles:view` | View, create, modify, delete, and assign roles |
| **Projects** | `projects:create`, `projects:read`, `projects:update`, `projects:delete`, `projects:assign_sp` | Manage work projects and assign service providers |
| **Billing** | `billing:view`, `billing:manage`, `billing:payout`, `billing:refund` | View financials, manage billing, process payouts and refunds |
| **Messaging** | `messaging:broadcast`, `messaging:moderate`, `messaging:templates` | Send broadcasts, moderate messages, manage templates |
| **Analytics** | `analytics:view_dashboard`, `analytics:export`, `analytics:revenue` | View dashboard stats, export data, view revenue reports |
| **SP Management** | `sp_management:view`, `sp_management:assign`, `sp_management:rate`, `sp_management:flag` | View, assign, rate, and flag service providers |

### Role-Permission Mapping

```mermaid
graph LR
    subgraph superAdmin [SUPER_ADMIN]
        ALL["All 32 Permissions"]
    end

    subgraph kycAdmin [KYC_ADMIN]
        KP1["kyc:view"]
        KP2["kyc:approve"]
        KP3["kyc:reject"]
        KP4["kyc:request_resubmit"]
        KP5["users:list"]
        KP6["users:view"]
        KP7["sp_management:view"]
    end

    subgraph financeAdmin [FINANCE_ADMIN]
        FP1["billing:view"]
        FP2["billing:manage"]
        FP3["billing:payout"]
        FP4["billing:refund"]
        FP5["analytics:view_dashboard"]
        FP6["analytics:revenue"]
    end

    subgraph opsAdmin [OPERATIONS_ADMIN]
        OP1["projects:create"]
        OP2["projects:read"]
        OP3["projects:update"]
        OP4["sp_management:view"]
        OP5["sp_management:assign"]
        OP6["analytics:view_dashboard"]
    end
```

### Multi-Tenancy

Client users operate within **tenants** -- isolated organizational units:

- When a Client signs up, a new `Tenant` record is created with their company name.
- The signing-up user becomes `CLIENT_ADMIN` of that tenant.
- Team members invited by the Client Admin join the same tenant.
- Each team member can have a different client role: `ADMIN`, `MANAGER`, `FINANCE`, or `VIEWER`.
- Tenants have properties like `segment` (SMB, MSME, Enterprise), `planTier`, and `walletBalance`.

```mermaid
graph TB
    T["Tenant: Acme Corp<br/>Segment: SMB<br/>Plan: Basic"]
    U1["User A<br/>CLIENT_ADMIN"]
    U2["User B<br/>CLIENT_MANAGER"]
    U3["User C<br/>CLIENT_VIEWER"]

    T --> U1
    T --> U2
    T --> U3
```

---

## 3. System Architecture

### High-Level Architecture

GIG4U follows a classic three-tier architecture:

```mermaid
graph LR
    subgraph frontend [Frontend - Port 3000]
        NextJS["Next.js 16<br/>App Router"]
        Zustand["Zustand<br/>State Store"]
        Axios["Axios<br/>HTTP Client"]
        TW["Tailwind CSS<br/>Styling"]
    end

    subgraph backend [Backend - Port 3001]
        NestJS["NestJS 11<br/>REST API"]
        Passport["Passport<br/>JWT Auth"]
        Prisma["Prisma 5<br/>ORM"]
        Swagger["Swagger<br/>API Docs"]
    end

    subgraph database [Database - Port 5432]
        PG["PostgreSQL<br/>14 Tables<br/>7 Enums"]
    end

    NextJS --> Axios
    Axios -->|"HTTP /api/*"| NestJS
    NestJS --> Prisma
    Prisma --> PG
    Zustand --> NextJS
    TW --> NextJS
    Passport --> NestJS
    Swagger --> NestJS
```

### Technology Stack

#### Backend (`gig4u-backend`)

| Technology | Version | Purpose |
|-----------|---------|---------|
| NestJS | 11.0.1 | Server-side framework with dependency injection, modules, and decorators |
| Prisma | 5.22.0 | Type-safe ORM for PostgreSQL with migrations and seeding |
| PostgreSQL | 18 | Relational database |
| Passport + JWT | 0.7.0 / 11.0.2 | Authentication strategy for bearer token validation |
| bcrypt | 6.0.0 | Password hashing with salt rounds |
| class-validator | 0.15.1 | DTO validation via decorators |
| class-transformer | 0.5.1 | Request body transformation and type coercion |
| Joi | 18.0.2 | Environment variable validation |
| Swagger | 11.2.6 | Auto-generated API documentation at `/api/docs` |

#### Frontend (`gig4u-frontend`)

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 16.1.6 | React framework with App Router, SSR, and middleware |
| React | 18 | UI library |
| TypeScript | 5 | Type safety |
| Zustand | 5.0.11 | Lightweight state management with persistence |
| React Query | 5.90.21 | Server state management and caching |
| Axios | 1.13.5 | HTTP client with interceptors for auth |
| React Hook Form | 7.71.2 | Performant form handling |
| Zod | 4.3.6 | Schema validation for forms |
| Tailwind CSS | 3.4.1 | Utility-first CSS framework |
| Lucide React | 0.575.0 | Icon library |

### Directory Structure

#### Backend

```
gig4u-backend/
├── prisma/
│   ├── schema.prisma          # Database schema (14 models, 7 enums)
│   ├── seed.ts                # Database seed script
│   └── migrations/            # SQL migration files
├── src/
│   ├── main.ts                # Application bootstrap (port, CORS, Swagger)
│   ├── app.module.ts          # Root module importing all feature modules
│   ├── config/                # Environment config with Joi validation
│   ├── prisma/                # PrismaService (global database client)
│   ├── auth/                  # Authentication (signup, login, JWT, refresh)
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.repository.ts
│   │   ├── jwt.strategy.ts
│   │   └── dto/
│   ├── users/                 # Admin user management
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.repository.ts
│   │   └── dto/
│   ├── roles/                 # Role CRUD
│   ├── permissions/           # Permission assignment and user-role mapping
│   ├── profiles/
│   │   ├── client/            # Client profile + team management
│   │   ├── sp/                # Service provider profile + KYC
│   │   └── admin/             # Admin profile management
│   ├── tenants/               # Tenant management module
│   ├── admin/                 # Admin dashboard (stats)
│   ├── audit/                 # Audit log recording and querying
│   └── common/
│       ├── decorators/        # @Public, @Roles, @Permissions, @CurrentUser
│       ├── guards/            # JwtAuthGuard, RolesGuard, PermissionsGuard
│       ├── interceptors/      # ResponseInterceptor, LoggingInterceptor
│       ├── filters/           # HttpExceptionFilter (global error handler)
│       ├── dto/               # PaginationDto (shared)
│       ├── types/             # JwtPayload, ApiResponse
│       └── utils/             # createPaginationMeta helper
├── test/                      # E2E test suites
├── .env                       # Environment variables
├── tsconfig.json
├── nest-cli.json
└── package.json
```

#### Frontend

```
gig4u-frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout (HTML, fonts, metadata)
│   │   ├── globals.css                 # Tailwind directives + CSS variables
│   │   ├── page.tsx                    # Landing page (/)
│   │   ├── (auth)/
│   │   │   ├── layout.tsx             # Split-screen auth layout
│   │   │   ├── login/page.tsx         # Login form
│   │   │   └── signup/page.tsx        # Registration form
│   │   └── (dashboard)/
│   │       ├── layout.tsx             # Dashboard root layout
│   │       ├── client/
│   │       │   ├── layout.tsx         # Client sidebar nav
│   │       │   ├── page.tsx           # Client dashboard
│   │       │   └── profile/page.tsx   # Client profile + team
│   │       ├── sp/
│   │       │   ├── layout.tsx         # SP sidebar nav
│   │       │   ├── page.tsx           # SP dashboard
│   │       │   └── profile/page.tsx   # SP profile
│   │       └── admin/
│   │           ├── layout.tsx         # Admin sidebar nav
│   │           ├── page.tsx           # Admin dashboard redirect
│   │           ├── profile/page.tsx   # Admin profile
│   │           ├── kyc/page.tsx       # KYC management
│   │           ├── finance/page.tsx   # Finance panel
│   │           ├── operations/page.tsx# Operations panel
│   │           └── super/
│   │               ├── page.tsx       # Super admin dashboard
│   │               ├── users/page.tsx # User management
│   │               ├── roles/page.tsx # Role management
│   │               ├── permissions/page.tsx # Permission management
│   │               └── audit/page.tsx # Audit log viewer
│   ├── components/
│   │   ├── layouts/DashboardLayout.tsx # Sidebar + topbar shell
│   │   ├── ui/                         # Reusable UI components
│   │   ├── auth/                       # Auth-specific components
│   │   └── forms/                      # Form field components
│   ├── hooks/
│   │   └── use-auth.ts                # Auth actions hook
│   ├── store/
│   │   └── auth.store.ts             # Zustand auth store with persistence
│   ├── lib/
│   │   ├── api/                       # Axios client + API modules
│   │   ├── auth/                      # Token service (localStorage)
│   │   ├── validations/               # Zod schemas for forms
│   │   └── utils/                     # cn() utility
│   ├── types/                         # TypeScript type definitions
│   └── middleware.ts                  # Route protection middleware
├── .env.local                         # Frontend environment variables
├── tailwind.config.ts
├── tsconfig.json
├── next.config.mjs
└── package.json
```

---

## 4. Database Schema

### Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o| ClientProfile : "has (if CLIENT)"
    User ||--o| SpProfile : "has (if SP)"
    User ||--o| AdminProfile : "has (if ADMIN)"
    User ||--o{ UserRole : "assigned"
    User ||--o{ RefreshToken : "owns"
    User ||--o{ OtpRecord : "receives"
    User ||--o{ AuditLog : "performs"

    Tenant ||--o{ ClientProfile : "contains"
    Tenant ||--o{ UserRole : "scopes"

    Role ||--o{ UserRole : "assigned via"
    Role ||--o{ RolePermission : "has"
    Role ||--o| Role : "parent of"
    Role ||--o{ AdminSession : "selected in"
    Role ||--o{ AdminProfile : "active role"

    Permission ||--o{ RolePermission : "granted via"
    PermissionGroup ||--o{ Permission : "groups"

    User {
        uuid id PK
        string phone UK
        string email UK
        string passwordHash
        UserType userType
        UserStatus status
        boolean isPhoneVerified
        boolean isEmailVerified
        datetime lastLoginAt
        datetime deletedAt
    }

    Tenant {
        uuid id PK
        string companyName
        TenantSegment segment
        string planTier
        decimal walletBalance
        TenantStatus status
    }

    ClientProfile {
        uuid userId PK_FK
        uuid tenantId FK
        string fullName
        string designation
        string department
        ClientRole clientRole
    }

    SpProfile {
        uuid userId PK_FK
        string fullName
        string city
        string state
        string pincode
        SpStatus spStatus
        decimal behaviorScore
        decimal ratingAvg
        int totalCompleted
    }

    AdminProfile {
        uuid userId PK_FK
        string fullName
        string employeeId UK
        string department
        uuid activeRoleId FK
    }

    Role {
        uuid id PK
        string name UK
        string displayName
        UserType actorType
        uuid parentId FK
        boolean isSystem
        boolean isActive
        datetime deletedAt
    }

    PermissionGroup {
        uuid id PK
        string name UK
        string displayName
    }

    Permission {
        uuid id PK
        uuid groupId FK
        string name UK
        string displayName
        boolean isActive
    }

    RolePermission {
        uuid roleId PK_FK
        uuid permissionId PK_FK
        uuid grantedById FK
    }

    UserRole {
        uuid id PK
        uuid userId FK
        uuid roleId FK
        uuid tenantId FK
        uuid assignedById FK
        datetime expiresAt
        boolean isActive
    }

    RefreshToken {
        uuid id PK
        uuid userId FK
        string tokenHash UK
        datetime expiresAt
        datetime revokedAt
    }

    OtpRecord {
        uuid id PK
        string phone FK
        string otpHash
        OtpPurpose purpose
        datetime expiresAt
    }

    AdminSession {
        uuid id PK
        uuid userId
        uuid selectedRoleId FK
        string jwtJti UK
        datetime expiresAt
        datetime terminatedAt
    }

    AuditLog {
        uuid id PK
        uuid actorUserId FK
        string action
        string targetType
        string targetId
        json metadata
    }
```

### Models Summary

| # | Model | Table Name | Description |
|---|-------|-----------|-------------|
| 1 | **User** | `users` | Core identity. Every person on the platform is a User with a phone, email, password hash, and a fixed `userType`. Supports soft delete via `deletedAt`. |
| 2 | **Tenant** | `tenants` | An organization/company. Clients belong to a tenant. Has segment (SMB/MSME/Enterprise), plan tier, and wallet balance. |
| 3 | **ClientProfile** | `client_profiles` | Extended profile for CLIENT users. Linked 1:1 to a User and belongs to a Tenant. Includes designation, department, and client role (ADMIN/MANAGER/FINANCE/VIEWER). |
| 4 | **SpProfile** | `sp_profiles` | Extended profile for SP users. Tracks personal details, KYC status pipeline, behavior score, rating average, and completed gig count. |
| 5 | **AdminProfile** | `admin_profiles` | Extended profile for ADMIN users. Stores employee ID, department, and currently active role reference. |
| 6 | **Role** | `roles` | Defines a named role with an actor type (which user type it applies to). Supports hierarchy via `parentId`. System roles are immutable. Supports soft delete. |
| 7 | **PermissionGroup** | `permission_groups` | Logical grouping of permissions (e.g., "kyc", "billing", "users"). |
| 8 | **Permission** | `permissions` | A single granular permission (e.g., `kyc:approve`, `billing:payout`). Belongs to a group. |
| 9 | **RolePermission** | `role_permissions` | Many-to-many join between Role and Permission. Records who granted it and when. |
| 10 | **UserRole** | `user_roles` | Assigns a role to a user, optionally scoped to a tenant. Supports expiration and soft deactivation. Unique on `(userId, roleId, tenantId)`. |
| 11 | **RefreshToken** | `refresh_tokens` | Stores SHA-256 hashes of issued refresh tokens. Supports revocation. |
| 12 | **OtpRecord** | `otp_records` | One-time password records for phone verification (signup, login, shift start, password reset). |
| 13 | **AdminSession** | `admin_sessions` | Tracks admin login sessions with the selected role. Linked to a JWT `jti` for session-level revocation. |
| 14 | **AuditLog** | `audit_logs` | Immutable record of who did what, when, and to what. Stores structured metadata as JSON. |

### Enums

| Enum | Values | Used By |
|------|--------|---------|
| `UserType` | `CLIENT`, `SP`, `ADMIN`, `PARTNER` | User, Role |
| `UserStatus` | `ACTIVE`, `INACTIVE`, `BANNED`, `SUSPENDED` | User |
| `TenantSegment` | `SMB`, `MSME`, `ENTERPRISE` | Tenant |
| `TenantStatus` | `ACTIVE`, `INACTIVE`, `SUSPENDED` | Tenant |
| `ClientRole` | `ADMIN`, `MANAGER`, `FINANCE`, `VIEWER` | ClientProfile |
| `SpStatus` | `PROFILE_INCOMPLETE`, `KYC_PENDING`, `KYC_SUBMITTED`, `KYC_APPROVED`, `ACTIVE`, `SUSPENDED`, `BANNED` | SpProfile |
| `OtpPurpose` | `SIGNUP`, `LOGIN`, `SHIFT_START`, `PASSWORD_RESET` | OtpRecord |

---

## 5. Authentication Flow

### How Authentication Works (Simple Explanation)

1. **Sign Up** -- A new user registers with their phone number, password, and user type (Client or SP). Admin accounts cannot be self-registered; they must be created by a Super Admin.
2. **Log In** -- The user enters their phone and password. The system returns two tokens: an **access token** (valid 15 minutes) and a **refresh token** (valid 7 days).
3. **Using the App** -- Every request to the backend includes the access token. The backend verifies it before processing the request.
4. **Token Refresh** -- When the access token expires, the frontend automatically uses the refresh token to get a new pair. This happens silently without the user noticing.
5. **Log Out** -- All refresh tokens for the user are revoked, and admin sessions are terminated.

### Standard Login Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant BE as Backend
    participant DB as Database

    U->>FE: Enter phone + password
    FE->>BE: POST /api/auth/login
    BE->>DB: Find user by phone
    DB-->>BE: User record
    BE->>BE: Verify password (bcrypt)
    BE->>BE: Check user status (not BANNED/SUSPENDED)
    BE->>DB: Update lastLoginAt
    BE->>BE: Generate access token (15m)
    BE->>BE: Generate refresh token (7d)
    BE->>DB: Store refresh token hash
    BE-->>FE: { user, accessToken, refreshToken }
    FE->>FE: Store in localStorage
    FE->>FE: Sync to cookie (for middleware)
    FE->>FE: Redirect to dashboard
```

### Admin Multi-Role Login Flow

Admin users may have multiple roles (e.g., a person could be both KYC_ADMIN and SUPPORT_ADMIN). When this happens, a role selection step is required:

```mermaid
sequenceDiagram
    participant U as Admin User
    participant FE as Frontend
    participant BE as Backend

    U->>FE: Enter phone + password
    FE->>BE: POST /api/auth/login
    BE->>BE: Detect multiple admin roles
    BE-->>FE: { requiresRoleSelection: true, availableRoles, tempToken }
    FE->>FE: Show Role Selection Modal
    U->>FE: Select "KYC Admin"
    FE->>BE: POST /api/auth/admin/select-role<br/>{ roleId } + tempToken
    BE->>BE: Verify tempToken (5m expiry)
    BE->>BE: Verify user has the selected role
    BE->>BE: Generate tokens with role-specific permissions
    BE->>BE: Create AdminSession record
    BE-->>FE: { accessToken, refreshToken, selectedRole }
    FE->>FE: Store tokens, redirect to /admin/kyc
```

### Token Refresh Flow

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant BE as Backend

    FE->>BE: Any API request (expired access token)
    BE-->>FE: 401 Unauthorized
    FE->>FE: Queue failed request
    FE->>BE: POST /api/auth/refresh { refreshToken }
    BE->>BE: Verify refresh token signature
    BE->>BE: Look up token hash in DB
    BE->>BE: Revoke old refresh token
    BE->>BE: Issue new access + refresh token pair
    BE-->>FE: { accessToken, refreshToken }
    FE->>FE: Update stored tokens
    FE->>BE: Retry queued request with new token
    BE-->>FE: Original response
```

### Token Storage Architecture

Tokens are stored in two places for different purposes:

| Storage | Contains | Purpose |
|---------|----------|---------|
| **localStorage** | `accessToken`, `refreshToken` | Used by Axios interceptors for API calls (client-side) |
| **Cookie** (`gig4u-auth`) | `{ state: { accessToken, user } }` | Read by Next.js middleware for server-side route protection |

The Zustand auth store automatically syncs to both locations whenever auth state changes.

---

## 6. Backend API Reference

### Request Lifecycle

Every API request passes through multiple layers before reaching the business logic:

```mermaid
graph LR
    REQ["Incoming<br/>Request"] --> CORS["CORS<br/>Check"]
    CORS --> PREFIX["Global Prefix<br/>/api"]
    PREFIX --> JWT["JwtAuthGuard<br/>(verify token)"]
    JWT --> ROLES["RolesGuard<br/>(check userType)"]
    ROLES --> PERMS["PermissionsGuard<br/>(check permissions)"]
    PERMS --> PIPE["ValidationPipe<br/>(validate DTO)"]
    PIPE --> CTRL["Controller<br/>(route handler)"]
    CTRL --> SVC["Service<br/>(business logic)"]
    SVC --> REPO["Repository<br/>(data access)"]
    REPO --> PRISMA["Prisma<br/>(query builder)"]
    PRISMA --> DB["PostgreSQL"]
    DB --> PRISMA
    PRISMA --> REPO
    REPO --> SVC
    SVC --> CTRL
    CTRL --> INTERCEPT["ResponseInterceptor<br/>(wrap response)"]
    INTERCEPT --> RES["API Response"]
```

### Standard API Response Format

Every response follows this envelope:

```json
{
  "success": true,
  "data": { ... },
  "message": "Human-readable message",
  "statusCode": 200
}
```

Error responses include an optional `errors` array (for validation failures):

```json
{
  "success": false,
  "data": null,
  "message": "Validation failed",
  "statusCode": 400,
  "errors": ["Phone must be exactly 10 digits", "Password must contain uppercase"]
}
```

### Auth Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/signup` | Public | Register a new CLIENT or SP user |
| `POST` | `/api/auth/login` | Public | Login with phone and password |
| `POST` | `/api/auth/admin/select-role` | tempToken | Admin selects a role after multi-role login |
| `POST` | `/api/auth/refresh` | Public | Exchange refresh token for new token pair |
| `POST` | `/api/auth/logout` | Bearer | Revoke all tokens and terminate sessions |
| `GET` | `/api/auth/me` | Bearer | Get current user's profile, roles, and permissions |

**POST /api/auth/signup -- Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `phone` | string | Yes | Exactly 10 digits |
| `email` | string | No | Valid email format |
| `password` | string | Yes | Min 8 chars, 1 uppercase, 1 number |
| `userType` | enum | Yes | `CLIENT` or `SP` (not `ADMIN`) |
| `companyName` | string | If CLIENT | Required for CLIENT signup |

**POST /api/auth/login -- Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `phone` | string | Yes | Exactly 10 digits |
| `password` | string | Yes | Non-empty |

**POST /api/auth/admin/select-role -- Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `roleId` | UUID | Yes | Must be a role assigned to the user |

### Admin User Management Endpoints

All require `ADMIN` user type.

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `GET` | `/api/admin/users` | `users:list` | List all users with pagination, filters (userType, status, search) |
| `GET` | `/api/admin/users/:id` | `users:view` | Get full user detail with profile and roles |
| `PATCH` | `/api/admin/users/:id/status` | `users:ban` | Change user status (ACTIVE/INACTIVE/BANNED/SUSPENDED) with reason |
| `POST` | `/api/admin/users/create-admin` | `users:create_admin` | Create a new admin user account |

**GET /api/admin/users -- Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page (max 100) |
| `userType` | enum | - | Filter by CLIENT, SP, ADMIN |
| `status` | enum | - | Filter by ACTIVE, INACTIVE, BANNED, SUSPENDED |
| `search` | string | - | Search by phone or email |

**POST /api/admin/users/create-admin -- Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `phone` | string | Yes | Exactly 10 digits |
| `email` | string | No | Valid email |
| `password` | string | Yes | Min 8 chars, 1 uppercase, 1 number |
| `fullName` | string | Yes | Min 2 chars |
| `employeeId` | string | No | Unique employee identifier |
| `department` | string | No | Department name |

### Role Management Endpoints

All require `ADMIN` user type.

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `GET` | `/api/roles` | `roles:read` | List roles with pagination and filters (actorType, isActive, search) |
| `GET` | `/api/roles/:id` | `roles:read` | Get a single role with full permission list |
| `POST` | `/api/roles` | `roles:write` | Create a new custom role |
| `PATCH` | `/api/roles/:id` | `roles:write` | Update role display name, description, or active status |
| `DELETE` | `/api/roles/:id` | `roles:delete` | Soft-delete a non-system role (blocked if active assignments exist) |

**POST /api/roles -- Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `name` | string | Yes | SCREAMING_SNAKE_CASE, min 3 chars |
| `displayName` | string | Yes | Min 2 chars |
| `description` | string | No | Free text |
| `actorType` | enum | Yes | CLIENT, SP, ADMIN, or PARTNER |
| `parentId` | UUID | No | Parent role (must have same actorType) |

### Permission Management Endpoints

All require `ADMIN` user type.

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `GET` | `/api/permissions` | `roles:read` | List all permissions grouped by permission group |
| `POST` | `/api/roles/:roleId/permissions` | `roles:assign` | Assign permissions to a role |
| `DELETE` | `/api/roles/:roleId/permissions` | `roles:assign` | Revoke permissions from a role |
| `POST` | `/api/users/:userId/roles` | `roles:assign` | Assign a role to a user (optionally scoped to a tenant) |
| `DELETE` | `/api/users/:userId/roles/:roleId` | `roles:assign` | Revoke a role from a user |

### Profile Endpoints

**Client Profile** (requires `CLIENT` user type):

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/client/profile` | Get own client profile with tenant info |
| `PATCH` | `/api/client/profile` | Update own profile (fullName, designation, department) |
| `GET` | `/api/client/team` | Get team members in same tenant (CLIENT_ADMIN only) |
| `POST` | `/api/client/team/invite` | Invite a new team member (CLIENT_ADMIN only) |

**SP Profile** (requires `SP` or `ADMIN` user type):

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/sp/profile` | SP views own profile |
| `PATCH` | `/api/sp/profile` | SP updates own profile (fullName, city, state, etc.) |
| `GET` | `/api/sp/profile/:id` | Admin views any SP profile by user ID |

**Admin Profile** (requires `ADMIN` user type):

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/profile` | Admin views own profile with active role |
| `PATCH` | `/api/admin/profile` | Admin updates own profile (fullName, department, employeeId) |

### Dashboard and Audit Endpoints

| Method | Path | Auth/Permission | Description |
|--------|------|----------------|-------------|
| `GET` | `/api/admin/stats` | `analytics:view_dashboard` | Platform overview: user counts by type, pending KYC count |
| `GET` | `/api/admin/audit-logs` | `roles:view` | Paginated audit logs with filters (actor, action, target, date range) |

---

## 7. Frontend Architecture

### Routing Structure

The frontend uses Next.js App Router with route groups to organize pages by access level:

```mermaid
graph TB
    Root["/"]

    subgraph authGroup ["(auth) Route Group"]
        Login["/login"]
        Signup["/signup"]
    end

    subgraph dashGroup ["(dashboard) Route Group"]
        subgraph clientRoutes ["/client"]
            ClientDash["/client"]
            ClientProfile["/client/profile"]
        end

        subgraph spRoutes ["/sp"]
            SpDash["/sp"]
            SpProfile["/sp/profile"]
        end

        subgraph adminRoutes ["/admin"]
            AdminDash["/admin"]
            AdminProfilePage["/admin/profile"]
            AdminKYC["/admin/kyc"]
            AdminFinance["/admin/finance"]
            AdminOps["/admin/operations"]

            subgraph superRoutes ["/admin/super"]
                SuperDash["/admin/super"]
                SuperUsers["/admin/super/users"]
                SuperRoles["/admin/super/roles"]
                SuperPerms["/admin/super/permissions"]
                SuperAudit["/admin/super/audit"]
            end
        end
    end

    Root --> authGroup
    Root --> dashGroup
```

### State Management

The frontend uses **Zustand** for auth state with persistence to `localStorage` and cookie sync:

```mermaid
graph TB
    subgraph zustandStore [Zustand Auth Store]
        State["State:<br/>user, accessToken,<br/>refreshToken, isAuthenticated"]
        Actions["Actions:<br/>setAuth, clearAuth,<br/>updateUser, setLoading"]
    end

    LS["localStorage<br/>(gig4u-auth)"]
    Cookie["Cookie<br/>(gig4u-auth)"]
    Axios["Axios Interceptor<br/>(Authorization header)"]
    MW["Next.js Middleware<br/>(Route protection)"]

    State -->|persist| LS
    State -->|syncToCookie| Cookie
    LS -->|rehydrate on load| State
    Cookie -->|read by| MW
    State -->|token used by| Axios
```

### API Client Architecture

The Axios client (`src/lib/api/client.ts`) implements:

1. **Base URL**: Reads from `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:3001`), appends `/api`.
2. **Request Interceptor**: Attaches `Authorization: Bearer <accessToken>` header from `localStorage`.
3. **Response Interceptor**: On 401 errors, automatically attempts token refresh. During refresh, all other failing requests are queued and replayed after the new token arrives.
4. **Token Refresh Queue**: Prevents multiple simultaneous refresh attempts. Only one refresh runs at a time; others wait in a promise queue.

### Middleware (Route Protection)

The Next.js middleware (`src/middleware.ts`) runs on every navigation and enforces:

| Rule | Behavior |
|------|----------|
| Authenticated user visits `/login` or `/signup` | Redirect to their dashboard |
| Unauthenticated user visits protected route | Redirect to `/login?returnUrl=...` |
| CLIENT user visits `/admin/*` or `/sp/*` | Redirect to `/login` |
| SP user visits `/admin/*` or `/client/*` | Redirect to `/login` |
| ADMIN user visits `/client/*` or `/sp/*` | Redirect to `/login` |
| Non-SUPER_ADMIN visits `/admin/super/*` | Redirect to `/admin/kyc` |

### UI Component Library

| Component | File | Description |
|-----------|------|-------------|
| `DashboardShell` | `components/layouts/DashboardLayout.tsx` | Full page layout with sidebar navigation, topbar with user info, and main content area. Responsive with mobile hamburger menu. |
| `Avatar` | `components/ui/avatar.tsx` | Displays user avatar from image URL or generates initials from name. Sizes: sm, md, lg, xl. |
| `Badge` | `components/ui/badge.tsx` | Colored label pill. Variants: gray, yellow, blue, green, red, orange, navy. Includes `StatusBadge` for automatic status-to-color mapping. |
| `Button` | `components/ui/button.tsx` | Standard button with variants (primary, secondary, outline, ghost, danger), sizes (sm, md, lg), and loading state with spinner. |
| `Card` | `components/ui/card.tsx` | Container with optional title, description, header action, and padding control. |
| `Input` | `components/ui/input.tsx` | Form input with label, error message display, and focus styling. |
| `PageHeader` | `components/ui/page-header.tsx` | Page title with optional description, breadcrumbs, and action buttons. |
| `FormField` | `components/forms/FormField.tsx` | Label + children + error wrapper for custom form fields. |
| `RoleSelectionModal` | `components/auth/RoleSelectionModal.tsx` | Modal dialog shown during admin login when multiple roles are available. |

---

## 8. Frontend Pages

### Public Pages

**Landing Page (`/`)**
A simple redirect page. If authenticated, redirects to the user's dashboard. If not, displays a hero section with "Get Started" and "Login" buttons.

**Login Page (`/login`)**
Split-screen layout with GIG4U branding on the left and a login form on the right. Fields: phone (10 digits) and password. Validates using Zod schema. On successful login, stores tokens and redirects to dashboard. If admin multi-role detected, shows the `RoleSelectionModal`.

**Signup Page (`/signup`)**
Split-screen layout with registration form. Fields: phone, email (optional), password, confirm password, user type toggle (Client/SP), and company name (if Client). Validates password strength (8+ chars, uppercase, number). On success, auto-logs in and redirects.

### Client Dashboard

| Page | Path | Description |
|------|------|-------------|
| Dashboard | `/client` | Welcome message, quick stats (placeholder for projects/gigs). |
| Profile | `/client/profile` | View and edit profile fields (full name, designation, department). Shows tenant info (company name, segment). |
| Team | `/client/team` | View team members in the same tenant. Invite new members with phone, email, and role selection. Only visible to CLIENT_ADMIN. |

### Service Provider Dashboard

| Page | Path | Description |
|------|------|-------------|
| Dashboard | `/sp` | Welcome message, profile completion status, KYC status badge. |
| Profile | `/sp/profile` | View and edit profile (full name, city, state, pincode, gender, DOB). Displays behavior score, rating, and completed gig count. |

### Admin Dashboard

| Page | Path | Required Role | Description |
|------|------|--------------|-------------|
| Dashboard | `/admin` | Any ADMIN | Redirects to appropriate sub-panel based on role. |
| Profile | `/admin/profile` | Any ADMIN | View/edit admin profile (full name, department, employee ID). |
| KYC | `/admin/kyc` | KYC_ADMIN | KYC verification queue (placeholder for KYC management). |
| Finance | `/admin/finance` | FINANCE_ADMIN | Financial dashboard (placeholder for billing/payouts). |
| Operations | `/admin/operations` | OPERATIONS_ADMIN | Operations panel (placeholder for project/SP management). |

### Super Admin Panel

| Page | Path | Required | Description |
|------|------|----------|-------------|
| Dashboard | `/admin/super` | SUPER_ADMIN or `roles:write` | Platform stats: total clients, SPs, admins, pending KYC. |
| Users | `/admin/super/users` | SUPER_ADMIN or `roles:write` | Full user management table with search, filter by type/status, pagination. Create admin modal. Status change actions. |
| Roles | `/admin/super/roles` | SUPER_ADMIN or `roles:write` | Role list with create/edit/delete. Shows permission count per role. System role badge. Filter by actor type. |
| Permissions | `/admin/super/permissions` | SUPER_ADMIN or `roles:write` | Permission list grouped by permission group. Assign/revoke permissions to roles. |
| Audit Logs | `/admin/super/audit` | SUPER_ADMIN or `roles:write` | Searchable, filterable audit log table showing who did what, when. Filters by action, actor, target type, and date range. |

---

## 9. Security Architecture

### Defense Layers

The backend implements security through multiple layered guards. Each request passes through all applicable layers in order:

```mermaid
graph TB
    REQ["Incoming Request"]
    REQ --> G1

    subgraph guardChain [Guard Chain]
        G1["1. JwtAuthGuard<br/>Validates JWT signature and expiry.<br/>Skips if @Public() decorator present."]
        G2["2. RolesGuard<br/>Checks user.userType matches<br/>@Roles() decorator requirement."]
        G3["3. PermissionsGuard<br/>Checks user.permissions includes<br/>all @Permissions() required.<br/>SUPER_ADMIN bypasses all checks."]
    end

    G1 --> G2
    G2 --> G3
    G3 --> CTRL["Controller Handler"]
    CTRL --> RES["Response"]

    G1 -.->|"Fail"| R401["401 Unauthorized"]
    G2 -.->|"Fail"| R403a["403 Forbidden<br/>(wrong user type)"]
    G3 -.->|"Fail"| R403b["403 Forbidden<br/>(insufficient permissions)"]
```

### Security Measures

| Measure | Implementation | Details |
|---------|---------------|---------|
| **Password Hashing** | bcrypt with 12 salt rounds | Passwords are never stored in plain text. The `passwordHash` field is stripped from all API responses. |
| **JWT Tokens** | Separate access and refresh secrets | Access tokens expire in 15 minutes. Refresh tokens expire in 7 days. Both use different signing secrets. |
| **Refresh Token Storage** | SHA-256 hash in database | The raw refresh token is never stored. Only its hash is persisted, preventing token theft from database compromise. |
| **Token Rotation** | Old token revoked on refresh | When a refresh token is used, it is immediately revoked and a new pair is issued. This limits the window of replay attacks. |
| **Admin Sessions** | Session tracking with JWT JTI | Each admin login creates an `AdminSession` record tied to the JWT's unique ID (`jti`). Sessions can be individually terminated. |
| **CORS** | Origin restricted to frontend URL | Only requests from `http://localhost:3000` (or the configured `FRONTEND_URL`) are accepted. Credentials are enabled. |
| **Input Validation** | class-validator + ValidationPipe | All DTOs are validated with whitelist mode (unknown fields are stripped) and `forbidNonWhitelisted` (unknown fields cause errors). |
| **Soft Deletes** | `deletedAt` timestamp | Users and Roles use soft delete. Records are never physically removed, preserving audit trail integrity. |
| **Audit Logging** | Fire-and-forget pattern | Sensitive operations (status changes, role assignments, permission grants, admin creation) are logged to the `AuditLog` table. The audit service never throws exceptions to the caller. |
| **Error Normalization** | Global HttpExceptionFilter | All errors (HTTP exceptions, Prisma errors, unknown errors) are caught and returned in a consistent format. Prisma P2002 (unique constraint) and P2025 (not found) are translated to user-friendly messages. |
| **SUPER_ADMIN Bypass** | PermissionsGuard | Users with the `SUPER_ADMIN` role skip all permission checks, ensuring they always have full platform access. |

### Frontend Security

| Measure | Implementation |
|---------|---------------|
| **Route Protection** | Next.js middleware reads auth cookie on every navigation. Unauthenticated users are redirected to `/login`. |
| **User Type Guards** | Routes are restricted by user type. A CLIENT cannot access `/admin/*` routes even with a valid token. |
| **Permission Checks** | The `/admin/super/*` routes require `SUPER_ADMIN` role or `roles:write` permission. |
| **Token Auto-Refresh** | Axios interceptor catches 401 responses and silently refreshes the token before retrying the request. |
| **Cookie Sync** | Auth state is synced to an HTTP cookie so the server-side middleware can read it without JavaScript. |

---

## 10. Environment Configuration

### Backend Environment Variables (`gig4u-backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | -- | PostgreSQL connection string. Format: `postgresql://user:password@host:port/database` |
| `JWT_ACCESS_SECRET` | Yes | -- | Secret key for signing JWT access tokens. Should be at least 32 characters. |
| `JWT_REFRESH_SECRET` | Yes | -- | Secret key for signing JWT refresh tokens. Should be different from access secret. |
| `JWT_ACCESS_EXPIRES_IN` | No | `15m` | Access token lifetime (e.g., `15m`, `1h`) |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Refresh token lifetime (e.g., `7d`, `30d`) |
| `PORT` | No | `3001` | Backend server port |
| `NODE_ENV` | No | `development` | Environment: `development`, `production`, or `test` |
| `FRONTEND_URL` | No | `http://localhost:3000` | Allowed CORS origin |
| `SEED_ADMIN_PHONE` | No | -- | Phone number for the seeded super admin |
| `SEED_ADMIN_EMAIL` | No | -- | Email for the seeded super admin |
| `SEED_ADMIN_PASSWORD` | No | -- | Password for the seeded super admin |

All required variables are validated at startup using Joi. The application will fail to start if any required variable is missing.

### Frontend Environment Variables (`gig4u-frontend/.env.local`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:3001` | Backend API base URL |
| `NEXT_PUBLIC_APP_NAME` | No | `GIG4U` | Application display name |

Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. They are embedded at build time.

---

## 11. Setup and Development Guide

### Prerequisites

| Software | Required Version | Purpose |
|----------|-----------------|---------|
| Node.js | 18 or higher (v24 recommended) | JavaScript runtime |
| npm | Comes with Node.js | Package manager |
| PostgreSQL | 14 or higher | Relational database |

### Step-by-Step Setup

#### 1. Clone and Install Dependencies

```bash
# Backend
cd gig4u-backend
npm install

# Frontend
cd gig4u-frontend
npm install
```

#### 2. Configure Environment

**Backend** -- Edit `gig4u-backend/.env`:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/gig4u"
JWT_ACCESS_SECRET="your-super-secret-access-key-min-32-chars"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-min-32-chars"
```

**Frontend** -- Edit `gig4u-frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

#### 3. Set Up the Database

```bash
# Create the database (run in your terminal)
createdb -U postgres gig4u

# Generate Prisma client (type-safe DB access)
cd gig4u-backend
npx prisma generate

# Run migrations (creates all tables)
npx prisma migrate deploy

# Seed initial data (roles, permissions, test users)
npx prisma db seed
```

#### 4. Start Development Servers

```bash
# Terminal 1 -- Backend (port 3001)
cd gig4u-backend
npm run start:dev

# Terminal 2 -- Frontend (port 3000)
cd gig4u-frontend
npm run dev
```

#### 5. Access the Application

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Frontend application |
| http://localhost:3001/api/docs | Swagger API documentation |

### Seed User Credentials

After running `npx prisma db seed`, these users are available:

| User | Phone | Password | Role |
|------|-------|----------|------|
| Super Admin (seed) | `9999999999` | `Admin@123456` | SUPER_ADMIN |

After running the E2E test suite, these additional test users are created:

| User | Phone | Email | Password | Role |
|------|-------|-------|----------|------|
| Super Admin | 9000000001 | superadmin@gmail.com | Superadmin1password | SUPER_ADMIN |
| KYC Admin | 9000000002 | adminrole1@gmail.com | Adminrole1password | KYC_ADMIN |
| Finance Admin | 9000000003 | adminrole2@gmail.com | Adminrole2password | FINANCE_ADMIN |
| Operations Admin | 9000000004 | adminrole3@gmail.com | Adminrole3password | OPERATIONS_ADMIN |
| Message Admin | 9000000005 | adminrole4@gmail.com | Adminrole4password | MESSAGE_ADMIN |
| Support Admin | 9000000006 | adminrole5@gmail.com | Adminrole5password | SUPPORT_ADMIN |
| Client | 9000000007 | clientuser1@gmail.com | Clientuser1password | CLIENT_ADMIN |
| Service Provider | 9000000008 | spuser1@gmail.com | Spuser1password | SP_BASIC |

### Available Scripts

**Backend (`gig4u-backend`):**

| Script | Command | Description |
|--------|---------|-------------|
| Dev server | `npm run start:dev` | Start with hot-reload (watch mode) |
| Production build | `npm run build` | Compile TypeScript to `dist/` |
| Production start | `npm run start:prod` | Run compiled build |
| Debug mode | `npm run start:debug` | Start with Node.js debugger attached |
| Lint | `npm run lint` | Run ESLint with auto-fix |
| Format | `npm run format` | Run Prettier |
| Unit tests | `npm run test` | Run Jest unit tests |
| E2E tests | `npm run test:e2e` | Run end-to-end test suites |

**Frontend (`gig4u-frontend`):**

| Script | Command | Description |
|--------|---------|-------------|
| Dev server | `npm run dev` | Start Next.js dev server with hot-reload |
| Build | `npm run build` | Production build |
| Start | `npm run start` | Start production server |
| Lint | `npm run lint` | Run Next.js ESLint |

---

## 12. Test Coverage

### E2E Test Results Summary

| Metric | Value |
|--------|-------|
| **Total Tests** | 145 |
| **Passed** | 145 |
| **Failed** | 0 |
| **Test Suites** | 17 |
| **Total Time** | ~19 seconds |

### Test Suites

| Suite | Tests | Description |
|-------|-------|-------------|
| Test Setup Smoke | 11 | Application bootstrapping and basic connectivity |
| Database Schema | 8 | Verify all tables, enums, and indexes exist |
| Auth: Client Signup | 10 | Client registration with validation edge cases |
| Auth: SP Signup | 5 | Service provider registration flow |
| Auth: Login Flow | 10 | Login for all user types, error handling |
| Auth: Admin Role Select | 7 | Multi-role admin login and role selection |
| Auth: Token Management | 8 | Refresh, rotation, revocation, expiry |
| SP Profile CRUD | 8 | SP profile read, update, KYC status tracking |
| Client Profile CRUD | 8 | Client profile, team management, invitations |
| Admin Profile | 5 | Admin profile with employee ID and department |
| RBAC: Role Management | 13 | Role create, update, soft-delete, hierarchy |
| RBAC: User Role Assignment | 8 | Assign/revoke roles with tenant scoping |
| Security: Permission Guards | 9 | Verify access denied across all role boundaries |
| Admin: User Management | 12 | User listing, filtering, status changes, admin creation |
| Audit Logs | 8 | Log creation, immutability, filtered queries |
| Data Integrity | 10 | Soft deletes, unique constraints, cascading, concurrency |
| Performance Baselines | 5 | Response time thresholds for critical endpoints |

### Performance Baselines

| Endpoint | Threshold | Actual | Status |
|----------|-----------|--------|--------|
| `POST /auth/login` | < 700ms | ~330ms | Pass |
| `GET /auth/me` | < 200ms | ~17ms | Pass |
| `GET /admin/users` (paginated) | < 500ms | ~200ms | Pass |
| `PATCH /sp/profile` | < 300ms | ~26ms | Pass |
| 10 sequential logins | < 8s | ~4.5s | Pass |

### Security Verification

| Check | Status |
|-------|--------|
| `passwordHash` never appears in any API response | Pass |
| All passwords stored as bcrypt hashes | Pass |
| CLIENT users blocked from `/admin/*` endpoints | Pass |
| SP users blocked from `/admin/*` endpoints | Pass |
| KYC Admin blocked from `/client/*` endpoints | Pass |
| KYC Admin blocked from `POST /roles` (needs `roles:write`) | Pass |
| Finance Admin blocked from user management | Pass |
| Unauthenticated requests return 401 | Pass |

### Bugs Found and Fixed During Development

| Bug | File | Fix |
|-----|------|-----|
| Transaction read outside `tx` context | `auth.repository.ts` | Changed `this.prisma.user.findUniqueOrThrow` to `tx.user.findUniqueOrThrow` inside `$transaction` |
| Refresh token hash collision | `auth.service.ts` | Added `jti: crypto.randomUUID()` to refresh token payload for uniqueness |
| `uuid` ESM incompatible with Jest | `auth.service.ts` | Replaced `import { v4 } from 'uuid'` with native `crypto.randomUUID()` |
| `passwordHash` leaked in admin API | `users.service.ts` | Added `const { passwordHash: _, ...sanitised } = user` destructuring in `getUserById()` |

---

*This documentation was generated from the GIG4U codebase. For interactive API exploration, visit the Swagger docs at http://localhost:3001/api/docs when the backend is running.*
