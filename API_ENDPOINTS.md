# CityFix API Endpoints

Base URL:

```text
/api/v1
```

## Authentication

Handles citizen registration, login, Google authentication, email verification, password reset, and token management.

| Method | Endpoint                 | Access        | Description                          |
| ------ | ------------------------ | ------------- | ------------------------------------ |
| POST   | `/auth/register/citizen` | Public        | Register citizen with email/password |
| POST   | `/auth/verify-email`     | Public        | Verify citizen/staff email           |
| POST   | `/auth/login`            | Public        | Login with email/password            |
| POST   | `/auth/google`           | Public        | Citizen Google authentication        |
| POST   | `/auth/refresh-token`    | Public        | Refresh access token                 |                            |
| POST   | `/auth/forgot-password`  | Public        | Request password reset               |
| POST   | `/auth/reset-password`   | Public        | Reset password                       |
| POST   | `/auth/change-password`  | Authenticated | Change current password              |
| POST   | `/auth/set-password`     | Citizen       | Set password for Google-only account |
| GET    | `/auth/me`               | Authenticated | Get current authenticated user       |

---

## User

General authenticated-user management.

| Method | Endpoint             | Access            | Description         |
| ------ | -------------------- | ----------------- | ------------------- |
| GET    | `/users/me`          | Authenticated     | Get current user    |
| PATCH  | `/users/me`          | Authenticated     | Update current user |
| PATCH  | `/users/me/password` | Authenticated     | Change password     |
| GET    | `/users/:id`         | Admin/Super Admin | Get user            |
| PATCH  | `/users/:id/status`  | Admin/Super Admin | Block/unblock user  |

---

## Citizen

Citizen profile and citizen management.

| Method | Endpoint               | Access            | Description             |
| ------ | ---------------------- | ----------------- | ----------------------- |
| GET    | `/citizens/me`         | Citizen           | Get own citizen profile |
| PATCH  | `/citizens/me`         | Citizen           | Update own profile      |
| GET    | `/citizens`            | Admin/Super Admin | List citizens           |
| GET    | `/citizens/:id`        | Admin/Super Admin | Get citizen             |
| PATCH  | `/citizens/:id/status` | Admin/Super Admin | Block/unblock citizen   |

---

## Staff

Staff creation, activation, and management.

| Method | Endpoint                | Access            | Description         |
| ------ | ----------------------- | ----------------- | ------------------- |
| POST   | `/staff`                | Admin/Super Admin | Create staff        |
| GET    | `/staff`                | Admin/Super Admin | List staff          |
| GET    | `/staff/:id`            | Admin/Super Admin | Get staff           |
| PATCH  | `/staff/:id`            | Admin/Super Admin | Update staff        |
| PATCH  | `/staff/:id/status`     | Admin/Super Admin | Block/unblock staff |
| PATCH  | `/staff/:id/activate`   | Admin/Super Admin | Activate staff      |
| PATCH  | `/staff/:id/deactivate` | Admin/Super Admin | Deactivate staff    |
| GET    | `/staff/me`             | Staff             | Get own profile     |
| PATCH  | `/staff/me`             | Staff             | Update own profile  |

---

## Admin

Admin and Super Admin management.

| Method | Endpoint             | Access            | Description                   |
| ------ | -------------------- | ----------------- | ----------------------------- |
| POST   | `/admins`            | Admin/Super Admin | Create Admin                  |
| GET    | `/admins`            | Admin/Super Admin | List Admins                   |
| GET    | `/admins/:id`        | Admin/Super Admin | Get Admin                     |
| PATCH  | `/admins/:id`        | Admin/Super Admin | Update Admin                  |
| PATCH  | `/admins/:id/status` | Super Admin       | Block/unblock Admin           |
| PATCH  | `/admins/:id/role`   | Super Admin       | Change Admin/Super Admin role |

### Admin creation rules

* Admin can create Admin.
* Admin cannot create Super Admin.
* Super Admin can create Admin.
* Super Admin can create Super Admin.
* Only Super Admin can block/unblock Admin and Super Admin.

---

## Department

Department management and staff assignment.

| Method | Endpoint                  | Access            | Description                    |
| ------ | ------------------------- | ----------------- | ------------------------------ |
| POST   | `/departments`            | Admin/Super Admin | Create department              |
| GET    | `/departments`            | Authenticated     | List departments               |
| GET    | `/departments/:id`        | Authenticated     | Get department                 |
| PATCH  | `/departments/:id`        | Admin/Super Admin | Update department              |
| PATCH  | `/departments/:id/status` | Admin/Super Admin | Activate/deactivate department |
| GET    | `/departments/:id/staff`  | Admin/Super Admin | List department staff          |

---

## Category

Complaint category and department mapping.

| Method | Endpoint                     | Access            | Description                  |
| ------ | ---------------------------- | ----------------- | ---------------------------- |
| POST   | `/categories`                | Admin/Super Admin | Create category              |
| GET    | `/categories`                | Authenticated     | List categories              |
| GET    | `/categories/:id`            | Authenticated     | Get category                 |
| PATCH  | `/categories/:id`            | Admin/Super Admin | Update category              |
| PATCH  | `/categories/:id/status`     | Admin/Super Admin | Activate/deactivate category |
| PATCH  | `/categories/:id/department` | Admin/Super Admin | Change default department    |

---

# Complaint

Core CityFix complaint management.

## Citizen endpoints

| Method | Endpoint                  | Description                |
| ------ | ------------------------- | -------------------------- |
| POST   | `/complaints`             | Submit complaint           |
| GET    | `/complaints/my`          | List own complaints        |
| GET    | `/complaints/:id`         | Get own complaint          |
| PATCH  | `/complaints/:id/dispute` | Dispute resolved complaint |
| PATCH  | `/complaints/:id/confirm` | Confirm resolution         |

## Staff endpoints

| Method | Endpoint                   | Description                |
| ------ | -------------------------- | -------------------------- |
| GET    | `/complaints/assigned`     | List assigned complaints   |
| GET    | `/complaints/department`   | List department complaints |
| GET    | `/complaints/:id`          | Get assigned complaint     |
| PATCH  | `/complaints/:id/start`    | Start complaint work       |
| PATCH  | `/complaints/:id/resolve`  | Resolve complaint          |
| PATCH  | `/complaints/:id/priority` | Update final priority      |

## Admin/Super Admin endpoints

| Method | Endpoint                     | Description                |
| ------ | ---------------------------- | -------------------------- |
| GET    | `/complaints`                | List all complaints        |
| GET    | `/complaints/:id`            | Get complaint              |
| PATCH  | `/complaints/:id/review`     | Move complaint into review |
| PATCH  | `/complaints/:id/department` | Confirm/reroute department |
| PATCH  | `/complaints/:id/assign`     | Assign complaint           |
| PATCH  | `/complaints/:id/reassign`   | Reassign complaint         |
| PATCH  | `/complaints/:id/priority`   | Adjust complaint priority  |

### Complaint lifecycle

```text
SUBMITTED
    ↓
UNDER_REVIEW
    ↓
ASSIGNED
    ↓
IN_PROGRESS
    ↓
RESOLVED
    ↓
CLOSED
```

Dispute flow:

```text
RESOLVED
    ↓
DISPUTED
    ↓
IN_PROGRESS
```

A generic status-update endpoint should not be exposed. Status transitions must be controlled by the service layer.

---

## Complaint Attachments

| Method | Endpoint                                    | Access        | Description       |
| ------ | ------------------------------------------- | ------------- | ----------------- |
| POST   | `/complaints/:id/attachments`               | Citizen/Staff | Upload attachment |
| GET    | `/complaints/:id/attachments`               | Authorized    | List attachments  |
| DELETE | `/complaints/:id/attachments/:attachmentId` | Owner/Admin   | Delete attachment |

Attachment types:

```text
COMPLAINT_PHOTO
RESOLUTION_PROOF
```

---

## Complaint Assignment

Assignment history is maintained separately so reassignment can be audited.

| Method | Endpoint                      | Access            | Description             |
| ------ | ----------------------------- | ----------------- | ----------------------- |
| POST   | `/complaints/:id/assign`      | Admin/Super Admin | Assign staff            |
| POST   | `/complaints/:id/reassign`    | Admin/Super Admin | Reassign staff          |
| GET    | `/complaints/:id/assignments` | Admin/Super Admin | View assignment history |

---

## Complaint Status History

| Method | Endpoint                         | Access     | Description         |
| ------ | -------------------------------- | ---------- | ------------------- |
| GET    | `/complaints/:id/status-history` | Authorized | View status history |

---

# Fine

Fine issuance and dispute management.

| Method | Endpoint              | Access            | Description    |
| ------ | --------------------- | ----------------- | -------------- |
| POST   | `/fines`              | Staff             | Issue fine     |
| GET    | `/fines`              | Admin/Super Admin | List all fines |
| GET    | `/fines/my`           | Citizen           | List own fines |
| GET    | `/fines/:id`          | Authorized        | Get fine       |
| PATCH  | `/fines/:id/dispute`  | Citizen           | Dispute fine   |
| PATCH  | `/fines/:id/uphold`   | Admin/Super Admin | Uphold dispute |
| PATCH  | `/fines/:id/waive`    | Admin/Super Admin | Waive fine     |
| PATCH  | `/fines/:id/void`     | Admin/Super Admin | Void fine      |
| POST   | `/fines/:id/payment`  | Citizen/Guest     | Create payment |
| GET    | `/fines/:id/payments` | Authorized        | View payments  |

### Fine lifecycle

```text
ISSUED
   ├── PAID
   ├── DISPUTED
   │      ├── UPHELD
   │      └── WAIVED
   └── VOIDED
```

Staff can only issue fines for categories belonging to their assigned department.

---

# Payment

Payment gateway integration.

| Method | Endpoint            | Access          | Description            |
| ------ | ------------------- | --------------- | ---------------------- |
| POST   | `/payments/create`  | Citizen/Guest   | Create payment         |
| POST   | `/payments/webhook` | Payment Gateway | Receive payment status |
| GET    | `/payments/:id`     | Authorized      | Get payment            |

Payment status should be updated from the gateway webhook rather than trusting the frontend.

---

# Notification

Application notification management.

| Method | Endpoint                  | Access        | Description                    |
| ------ | ------------------------- | ------------- | ------------------------------ |
| GET    | `/notifications`          | Authenticated | List notifications             |
| PATCH  | `/notifications/:id/read` | Owner         | Mark notification as read      |
| PATCH  | `/notifications/read-all` | Owner         | Mark all notifications as read |

Critical notification events include:

* Complaint assigned
* Complaint resolved
* Fine issued
* Fine dispute received
* Staff activation request
* High-priority complaint submitted

---

# Endpoint Summary

| Module       | Main Purpose                              |
| ------------ | ----------------------------------------- |
| Auth         | Authentication & password management      |
| User         | Common user management                    |
| Citizen      | Citizen profiles & administration         |
| Staff        | Staff onboarding & management             |
| Admin        | Admin/Super Admin management              |
| Department   | Department management                     |
| Category     | Complaint categories & department mapping |
| Complaint    | Complaint lifecycle                       |
| Assignment   | Complaint assignment & reassignment       |
| Fine         | Fine management                           |
| Payment      | Fine payments                             |
| Notification | User notifications                        |

## API Version

All endpoints use:

```text
/api/v1
```

Example:

```http
POST /api/v1/auth/login
GET  /api/v1/complaints/my
POST /api/v1/complaints
PATCH /api/v1/complaints/:id/resolve
POST /api/v1/fines
```
