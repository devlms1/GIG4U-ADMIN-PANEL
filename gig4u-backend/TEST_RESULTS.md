# GIG4U - Registration & Profile Verification Results

**Run Date:** 2026-02-27T05:01:01.387Z
**Environment:** test
**Backend:** [http://localhost:3001](http://localhost:3001)

---

## Summary


| Metric | Count    |
| ------ | -------- |
| Passed | 51       |
| Failed | 0        |
| Total  | 51       |
| Status | ALL PASS |


---

## Test Credentials


| User Type        | Phone      | Email                                                 | Password            | Role             |
| ---------------- | ---------- | ----------------------------------------------------- | ------------------- | ---------------- |
| Super Admin      | 9000000001 | [superadmin@gmail.com](mailto:superadmin@gmail.com)   | Superadmin1password | SUPER_ADMIN      |
| KYC Admin        | 9000000002 | [adminrole1@gmail.com](mailto:adminrole1@gmail.com)   | Adminrole1password  | KYC_ADMIN        |
| Finance Admin    | 9000000003 | [adminrole2@gmail.com](mailto:adminrole2@gmail.com)   | Adminrole2password  | FINANCE_ADMIN    |
| Operations Admin | 9000000004 | [adminrole3@gmail.com](mailto:adminrole3@gmail.com)   | Adminrole3password  | OPERATIONS_ADMIN |
| Message Admin    | 9000000005 | [adminrole4@gmail.com](mailto:adminrole4@gmail.com)   | Adminrole4password  | MESSAGE_ADMIN    |
| Support Admin    | 9000000006 | [adminrole5@gmail.com](mailto:adminrole5@gmail.com)   | Adminrole5password  | SUPPORT_ADMIN    |
| Client           | 9000000007 | [clientuser1@gmail.com](mailto:clientuser1@gmail.com) | Clientuser1password | CLIENT_ADMIN     |
| Service Provider | 9000000008 | [spuser1@gmail.com](mailto:spuser1@gmail.com)         | Spuser1password     | SP_BASIC         |


---

## All Test Results


| Step | Test Name                                            | Result | Notes |
| ---- | ---------------------------------------------------- | ------ | ----- |
| 2.1  | Seeded SUPER_ADMIN Login                             | PASS   |       |
| 2.2  | Super Admin created + SUPER_ADMIN assigned           | PASS   |       |
| 2.3  | KYC Admin created + KYC_ADMIN assigned               | PASS   |       |
| 2.4  | Finance Admin created + FINANCE_ADMIN assigned       | PASS   |       |
| 2.5  | Operations Admin created + OPERATIONS_ADMIN assigned | PASS   |       |
| 2.6  | Message Admin created + MESSAGE_ADMIN assigned       | PASS   |       |
| 2.7  | Support Admin created + SUPPORT_ADMIN assigned       | PASS   |       |
| 3.1  | Client registered                                    | PASS   |       |
| 3.2  | SP registered                                        | PASS   |       |
| 4.1  | SUPER_ADMIN Login                                    | PASS   |       |
| 4.2  | KYC_ADMIN Login                                      | PASS   |       |
| 4.3  | FINANCE_ADMIN Login                                  | PASS   |       |
| 4.4  | OPERATIONS_ADMIN Login                               | PASS   |       |
| 4.5  | MESSAGE_ADMIN Login                                  | PASS   |       |
| 4.6  | SUPPORT_ADMIN Login                                  | PASS   |       |
| 4.7  | CLIENT_ADMIN Login                                   | PASS   |       |
| 4.8  | SP_BASIC Login                                       | PASS   |       |
| 5.1  | GET /auth/me (superAdmin)                            | PASS   |       |
| 5.2  | GET /auth/me (kycAdmin)                              | PASS   |       |
| 5.3  | GET /auth/me (financeAdmin)                          | PASS   |       |
| 5.4  | GET /auth/me (operationsAdmin)                       | PASS   |       |
| 5.5  | GET /auth/me (messageAdmin)                          | PASS   |       |
| 5.6  | GET /auth/me (supportAdmin)                          | PASS   |       |
| 5.7  | GET /auth/me (client)                                | PASS   |       |
| 5.8  | GET /auth/me (sp)                                    | PASS   |       |
| 5.9  | SP Profile Visible                                   | PASS   |       |
| 5.10 | SP Profile Update                                    | PASS   |       |
| 5.11 | SP Status KYC_PENDING                                | PASS   |       |
| 5.12 | Client Profile Visible                               | PASS   |       |
| 5.13 | Client Profile Update                                | PASS   |       |
| 5.14 | superAdmin Admin Profile                             | PASS   |       |
| 5.15 | kycAdmin Admin Profile                               | PASS   |       |
| 5.16 | financeAdmin Admin Profile                           | PASS   |       |
| 5.17 | operationsAdmin Admin Profile                        | PASS   |       |
| 5.18 | messageAdmin Admin Profile                           | PASS   |       |
| 5.19 | supportAdmin Admin Profile                           | PASS   |       |
| 6.1  | All 8 users in DB                                    | PASS   |       |
| 6.2  | All admin_profiles in DB                             | PASS   |       |
| 6.3  | Client profile + tenant in DB                        | PASS   |       |
| 6.4  | SP profile in DB                                     | PASS   |       |
| 6.5  | All admin roles in user_roles DB                     | PASS   |       |
| 6.6  | All passwords bcrypt hashed                          | PASS   |       |
| 6.7  | SP role in user_roles DB                             | PASS   |       |
| 6.8  | Client role scoped to tenant                         | PASS   |       |
| 7.1  | Client blocked from /admin/profile                   | PASS   |       |
| 7.2  | SP blocked from /admin/profile                       | PASS   |       |
| 7.3  | KYC Admin blocked from /client/profile               | PASS   |       |
| 7.4  | KYC Admin blocked from creating roles                | PASS   |       |
| 7.5  | Finance Admin blocked from user management           | PASS   |       |
| 7.6  | Super Admin access ALL endpoints                     | PASS   |       |
| 7.7  | Unauthenticated → 401                                | PASS   |       |


---

## Registration Method


| User Type        | Method                        | Endpoint                                               |
| ---------------- | ----------------------------- | ------------------------------------------------------ |
| Super Admin      | Created by seeded Super Admin | POST /admin/users/create-admin + POST /users/:id/roles |
| KYC Admin        | Created by Super Admin        | POST /admin/users/create-admin + POST /users/:id/roles |
| Finance Admin    | Created by Super Admin        | POST /admin/users/create-admin + POST /users/:id/roles |
| Operations Admin | Created by Super Admin        | POST /admin/users/create-admin + POST /users/:id/roles |
| Message Admin    | Created by Super Admin        | POST /admin/users/create-admin + POST /users/:id/roles |
| Support Admin    | Created by Super Admin        | POST /admin/users/create-admin + POST /users/:id/roles |
| Client           | Self-registered               | POST /auth/signup                                      |
| Service Provider | Self-registered               | POST /auth/signup                                      |


---

## Security Checks


| Check                                | Result |
| ------------------------------------ | ------ |
| passwordHash never in API response   | PASS   |
| Passwords stored as bcrypt           | PASS   |
| Client blocked from /admin/*         | PASS   |
| SP blocked from /admin/*             | PASS   |
| KYC Admin blocked from /client/*     | PASS   |
| KYC Admin blocked from POST /roles   | PASS   |
| Finance Admin blocked from user mgmt | PASS   |
| Unauthenticated requests -> 401      | PASS   |


---

*Generated by: test/registration-verification.e2e-spec.ts*