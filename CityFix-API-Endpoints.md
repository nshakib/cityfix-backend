# CityFix API — Endpoint Reference

Base URL: `/api/v1`
Auth: access token + refresh token, both set as **httpOnly cookies** on login/registration (§3.7).
Roles: `CITIZEN`, `STAFF`, `ADMIN`, `SUPER_ADMIN`

> Legend — 🔓 Public · 🔒 Auth required · 🛡️ Role-restricted (role shown in parentheses)

---

## 1. Authentication

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register` | 🔓 | Citizen self-registration (email/password). Always creates a `CITIZEN`. |
| `POST` | `/auth/register/google` | 🔓 | Citizen registration/login via Google. Links to an existing email/password account if one exists (§3.3). |
| `POST` | `/auth/login` | 🔓 | Email/password login — any role. |
| `POST` | `/auth/verify-otp` | 🔓 | Verify email OTP (Citizen email/password, and Staff before first login). |
| `POST` | `/auth/resend-otp` | 🔓 | Resend a fresh OTP. |
| `POST` | `/auth/forgot-password` | 🔓 | Sends OTP/reset link. Rejected for Google-only Citizens with no password (§3.4). |
| `POST` | `/auth/reset-password` | 🔓 | Submit OTP + new password. OTP invalidated after use. |
| `POST` | `/auth/change-password` | 🔒 | Requires current password. For a logged-in user who remembers their password. |
| `POST` | `/auth/set-password` | 🔒 🛡️ (Citizen) | Lets a Google-only Citizen add a password to their account (§3.6). |
| `POST` | `/auth/refresh-token` | 🔒 | Exchanges a valid refresh token for a new access token. |
| `POST` | `/auth/logout` | 🔒 | Clears session cookies. |

**Example — Register Citizen**
```http
POST /auth/register
Content-Type: application/json

{
  "name": "Farhan Ahmed",
  "email": "farhan@example.com",
  "password": "Str0ng!Pass",
  "confirmPassword": "Str0ng!Pass"
}
```
```json
// 201 Created
{
  "userId": "usr_8f2a",
  "role": "CITIZEN",
  "emailVerified": false,
  "message": "OTP sent to email"
}
```

---

## 2. Admin & Super Admin Management

*Rule of thumb (§2.1): Admin acts freely on Staff/Citizens; only Super Admin acts on another Admin or Super Admin.*

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/admins` | 🛡️ (Admin, SuperAdmin) | Create a new Admin. **Body:** `orgEmail`, `personalEmail`, `role: "ADMIN"`. System generates password, emails it to `personalEmail`. |
| `POST` | `/admins` (with `role: "SUPER_ADMIN"`) | 🛡️ (SuperAdmin only) | Create a new Super Admin — same flow, elevated role. |
| `GET` | `/admins` | 🛡️ (Admin, SuperAdmin) | List admins/super admins. |
| `GET` | `/admins/:id` | 🛡️ (Admin, SuperAdmin) | Get one admin's profile. |
| `PATCH` | `/admins/:id/block` | 🛡️ (SuperAdmin only) | Block an Admin or Super Admin. |
| `PATCH` | `/admins/:id/unblock` | 🛡️ (SuperAdmin only) | Unblock an Admin or Super Admin. |

---

## 3. Staff Management

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/staff` | 🛡️ (Admin, SuperAdmin) | Create a Staff account → status `PENDING_ACTIVATION`. |
| `GET` | `/staff` | 🛡️ (Admin, SuperAdmin) | List staff, filterable by department/status. |
| `GET` | `/staff/:id` | 🛡️ (Admin, SuperAdmin) | Get one staff profile. |
| `PATCH` | `/staff/:id/activate` | 🛡️ (Admin, SuperAdmin) | `PENDING_ACTIVATION → ACTIVE` (after Staff has verified OTP + set password, §5). |
| `PATCH` | `/staff/:id/block` | 🛡️ (Admin, SuperAdmin) | Block a Staff member. |
| `PATCH` | `/staff/:id/unblock` | 🛡️ (Admin, SuperAdmin) | Unblock a Staff member. |

---

## 4. Citizen Management

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/citizens` | 🛡️ (Admin, SuperAdmin) | List citizens. |
| `GET` | `/citizens/:id` | 🛡️ (Admin, SuperAdmin) | Get one citizen profile. |
| `PATCH` | `/citizens/:id/block` | 🛡️ (Admin, SuperAdmin) | Block a citizen. |
| `PATCH` | `/citizens/:id/unblock` | 🛡️ (Admin, SuperAdmin) | Unblock a citizen. |
| `GET` | `/citizens/me` | 🔒 🛡️ (Citizen) | Own profile. |
| `PATCH` | `/citizens/me` | 🔒 🛡️ (Citizen) | Update own name/phone/address. |

---

## 5. Departments & Categories

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/departments` | 🛡️ (Admin, SuperAdmin) | Create a department. |
| `GET` | `/departments` | 🔒 | List departments (active + inactive, role-dependent visibility). |
| `PATCH` | `/departments/:id` | 🛡️ (Admin, SuperAdmin) | Update name/staff list. |
| `PATCH` | `/departments/:id/status` | 🛡️ (Admin, SuperAdmin) | Toggle active/inactive. Inactive depts can't receive *new* assignments (§6). |
| `POST` | `/categories` | 🛡️ (Admin, SuperAdmin) | Create a category with a default department mapping. |
| `GET` | `/categories` | 🔓 | List active categories (for the citizen-facing submission form). |
| `PATCH` | `/categories/:id` | 🛡️ (Admin, SuperAdmin) | Update category / remap its default department. |

---

## 6. Complaints

*Visibility (§7.2): Citizen → own only · Staff → assigned to them or unassigned in their department · Admin/SuperAdmin → all.*

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/complaints` | 🔒 🛡️ (Citizen) | Submit a complaint. **Body:** `categoryId`, `description`, `location`, `photos[]?`, `priority?`. Status starts `SUBMITTED`. |
| `GET` | `/complaints` | 🔒 | List complaints, scoped by role (see visibility rule above). Supports `?status=`, `?departmentId=`, `?priority=` filters. |
| `GET` | `/complaints/:id` | 🔒 | Get one complaint (must pass visibility check). |
| `PATCH` | `/complaints/:id/acknowledge` | 🛡️ (Admin, SuperAdmin) | `SUBMITTED → ACKNOWLEDGED`. Confirms or reroutes department. |
| `PATCH` | `/complaints/:id/reject` | 🛡️ (Admin, SuperAdmin) | `SUBMITTED` or `ACKNOWLEDGED → REJECTED` (terminal). **Body:** `reason`. |
| `PATCH` | `/complaints/:id/assign` | 🛡️ (Admin, SuperAdmin) | `ACKNOWLEDGED → ASSIGNED`. **Body:** `staffId` — must be an `ACTIVE` staff member in the complaint's department. |
| `PATCH` | `/complaints/:id/reassign` | 🛡️ (Admin, SuperAdmin) | Swap assigned staff at any point before `RESOLVED`. Status unchanged if already `IN_PROGRESS` (§9.3). Logged. |
| `PATCH` | `/complaints/:id/start` | 🛡️ (Staff) | `ASSIGNED → IN_PROGRESS`. Only the assigned staff member. |
| `PATCH` | `/complaints/:id/resolve` | 🛡️ (Staff) | `IN_PROGRESS → RESOLVED`. **Body:** `resolutionProof` (photo/note) — required. |
| `PATCH` | `/complaints/:id/dispute` | 🔒 🛡️ (Citizen) | `RESOLVED → DISPUTED`. **Body:** `reason` — required. Only within the review window. |
| `PATCH` | `/complaints/:id/confirm` | 🔒 🛡️ (Citizen) | `RESOLVED → CLOSED`. Citizen confirms the fix. |
| `GET` | `/complaints/:id/logs` | 🔒 | Full status-change audit trail (`ComplaintStatusLog`). |

**Example — Resolve a complaint**
```http
PATCH /complaints/cmp_9a21/resolve
Authorization: (staff session cookie)
Content-Type: application/json

{
  "resolutionProof": {
    "note": "Pothole filled and resurfaced.",
    "photoUrl": "https://cdn.cityfix.io/proof/cmp_9a21.jpg"
  }
}
```
```json
// 200 OK
{
  "complaintId": "cmp_9a21",
  "status": "RESOLVED",
  "resolvedAt": "2026-09-07T10:32:00Z",
  "autoCloseAt": "2026-09-09T10:32:00Z"
}
```

**Lifecycle note:** transitions are enforced server-side per §8 — forward-only, except `RESOLVED → DISPUTED → IN_PROGRESS`. A 400 is returned for any illegal transition attempt.

---

## 7. Fines

*Jurisdiction (§10): Staff can only issue fines for categories in their own assigned department.*

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/fines` | 🛡️ (Staff) | Issue a fine. **Body:** `recipient` (`userId` OR `{name, phone/email}` for a guest), `reason`, `amount`, `evidence?`, `complaintId?`. |
| `GET` | `/fines` | 🔒 | List fines, scoped by role (citizen → own; staff → issued by them; admin → all). |
| `GET` | `/fines/:id` | 🔒 | Get one fine. |
| `PATCH` | `/fines/:id/dispute` | 🔒 🛡️ (Registered Citizen only) | `ISSUED → DISPUTED`. Guest citizens cannot dispute online (§10) — must contact Admin support. |
| `PATCH` | `/fines/:id/uphold` | 🛡️ (Admin, SuperAdmin) | `DISPUTED → UPHELD`. |
| `PATCH` | `/fines/:id/waive` | 🛡️ (Admin, SuperAdmin) | `DISPUTED → WAIVED`. |
| `PATCH` | `/fines/:id/void` | 🛡️ (Admin, SuperAdmin) | `ISSUED → VOIDED`. |
| `POST` | `/fines/:id/pay` | 🔒 (Registered Citizen) or 🔓 via guest payment link | `ISSUED/UPHELD → PAID`. Initiates a `Payment`. |

---

## 8. Payments

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/payments/webhook` | 🔓 (gateway-signed) | Payment gateway callback confirming transaction status. |
| `GET` | `/payments/:id` | 🔒 | Get one payment record. |

---

## 9. Notifications

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/notifications` | 🔒 | List the current user's notifications (Citizen: status changes, fines; Staff: new assignment, dispute received; Admin: activation requests, high-priority complaints). |
| `PATCH` | `/notifications/:id/read` | 🔒 | Mark a notification as read. |

> Delivery itself (§12) is email-based (Nodemailer/SendGrid, console/DB fallback in demo) — these two endpoints only expose the in-app notification feed, not the email pipeline.

---

## Common Response Shape & Status Codes

```json
// Error shape
{
  "success": false,
  "error": {
    "code": "INVALID_TRANSITION",
    "message": "Complaint cannot move from ASSIGNED to CLOSED directly."
  }
}
```

| Code | Meaning |
|---|---|
| `200 / 201` | Success |
| `400` | Validation failure (Zod schema) or illegal state transition |
| `401` | Missing/expired access token |
| `403` | Authenticated but not authorized for this role/resource (see §2.1 table) |
| `404` | Resource not found or not visible to this role (§7.2) |
| `409` | Conflict (e.g. assigning an already-blocked staff member) |
| `429` | Rate limit exceeded — 5/min on `/auth/*`, 100/min general (§13.2) |

---

## Open items carried from the spec (§14)

These affect endpoint behavior but aren't fully pinned down yet — worth flagging to whoever implements them:
- What `PATCH /complaints/:id/assign` should do if the target department went inactive mid-flow.
- Whether a blocked staff member's in-flight `/complaints` need an auto-reassignment endpoint or stay manual.
- Whether the "high-priority" notification trigger (§12) means `priority=HIGH` only or `HIGH + URGENT`.
- The 48h auto-close (`RESOLVED → CLOSED`) and the dispute review-window cutoff are both meant to be enforced by a scheduled job, not yet built — until then, `/complaints/:id/confirm` and `/complaints/:id/dispute` should probably still be called manually/on a timer in tests.
