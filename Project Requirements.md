# Project Requirements — CityFix — City Complaint & Service Management Platform

## 1. Overview

CityFix connects citizens with city service authorities to report, track, and resolve local issues. A citizen submits a complaint with the relevant details, the complaint is reviewed and assigned to the appropriate department or staff member, and its progress can be tracked through the resolution process. Staff members manage assigned complaints, update their status, and work toward resolving reported issues. Administrators oversee the platform, manage users and departments, and ensure complaints are properly handled from submission to resolution.

This backend provides the core services and business logic that power the CityFix platform. It manages authentication, role-based access, complaint workflows, user and department management, validation, and secure data operations through RESTful APIs.

The system is designed to keep responsibilities clearly separated: citizens focus on reporting and tracking their issues, staff focus on handling assigned complaints, and administrators focus on managing the people, departments, and overall operation of the platform.

This repository contains the backend implementation of CityFix, including its API, business logic, authentication, authorization, database integration, and supporting services.

## 2. User roles

Four roles exist: **Super Admin**,**Admin**, **Staff**, **Citizen**.

| Role           | How they join the platform                                                   | How they log in                  |
| -------------- | ------------------------------------------------------------------------------ | ---------------------------------- |
| **Citizen**    | Registers directly — email/password or Google                                  | Email/password or Google           |
| **Staff**     | Created by Admin/Super Admin; requires email verification and administrator activation.       | Email/password only                |
| **Admin**      | Created by a Super Admin or an existing Admin — cannot self-register           | Email/password only                |              |

Google login is a **citizen-only** feature. Staff, Admins, and Super Admins always use email and password.

### 2.1 Who can manage whom

Admin and Super Admin have the same day-to-day powers — approving staff, managing citizen, creating new admins — with two exceptions reserved for Super Admin:

| Action                              | Admin | Super Admin |
| ------------------------------------ | :---: | :----------:  |
| Approve or reject a citizen's submitted complaint. | ✅    | ✅         |
| Block or unblock a Staff                | ✅    | ✅         |
| Block or unblock a Citizen              | ✅    | ✅         |
| Create a new Admin                      | ✅    | ✅         |
| Create a new Super Admin                | ❌    | ✅         |
| Block or unblock an Admin               | ❌    | ✅         |
| Block or unblock a Super Admin          | ❌    | ✅         |

In short: Admin can act on staff and citizen freely, but only a Super Admin can act on another Admin or Super Admin — including blocking one.

These actions live behind three management screens: **Staff Management** (manage Staff activation, block/unblock Staff), Complaint Management (review/approve/reject complaints), Citizen Management (block/unblock Citizen), and Admin Management

## 3. Accounts and authentication

### 3.1 Registration

- **Citizen** registers with name, email, and password — or through Google. Regardless of the registration method, the account is created with the Citizen role. Citizens cannot register directly as Staff, Admin, or Super Admin.
- 
- **Staff** accounts are created and managed by an Admin or Super Admin through the Staff Management system. A newly created Staff account remains *Pending* until activated by an authorized administrator. Once activated, the Staff member can log in and handle complaints assigned to them.

- **Admin** and **Super Admin** are never self-registered. They can only be created by an authorized Admin or Super Admin, according to the permissions defined in ( [Section 4](#4-admin-and-super-admin-management)).

### 3.2 Email OTP verification

- Citizen self-registration requires email verification. After registering with email and password, the Citizen receives a one-time password (OTP) at their email address. The account cannot be used until the OTP is successfully verified.
-
- Staff accounts are not self-registered. They are created by an Admin or Super Admin through Staff Management. Since the account is created by an authorized administrator, the Staff member does not go through the public registration flow. However, the Staff member must verify their email through an OTP before completing their first login, ensuring that they control the registered email address.
-
- Google registration does not require a separate OTP because Google has already verified ownership of the email address.
-
- Admin and Super Admin accounts do not use OTP during account creation because they are created by an existing authorized administrator. Their access is protected through administrative authorization, account activation, and normal authentication controls.

(see [Section 4](#4-admin-and-super-admin-management) for how those are secured instead).

### 3.3 Login

- Citizen can log in using either email/password or Google. Both methods always refer to the same Citizen account. If a Citizen initially registers with email/password and later signs in with Google using the same verified email address, the system links the Google identity to the existing account rather than creating a second Citizen account. Likewise, a Citizen who first registers with Google can later use email/password if a password has been established for the account.
-  
- Staff, Admin, and Super Admin can log in using email/password only. Google authentication is not available for these roles.

### 3.4 Forgot password / reset password

Four-step flow, available to anyone who logs in with a password:

1. **Forgot password** — Available to all password-based accounts: Citizen, Staff, Admin, and Super Admin (except citizen google user). Users can request a password reset using their registered/login email. The system sends an OTP or secure reset link, validates the request, and allows the user to set a new password.

2. **Reset password** — user submits the OTP along with a new password. The system verifies the OTP, invalidates the OTP, and securely updates the account password.
3. Google-only Citizens who have never set a password cannot use password reset. They should continue to sign in through Google.

4. **Password Policy:** All password-based accounts must use a password of at least 8 characters containing at least one uppercase letter, one lowercase letter, one number, and one special character. The same policy applies during registration, initial password setup, forgot-password reset, and password change.

- New password must not be the same as the previous password.
- Confirm password must match the new password.
- Password should never be stored in plain text; store a secure hash.
- Initial/generated passwords should require a password change on first login.
- Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.

### 3.5 Change password (logged in)

A logged-in user submits their **current password** and a **new password**. This is different from reset: it's for someone who remembers their current password and just wants to change it. Someone who's forgotten their current password uses forgot-password/reset-password instead — change-password is not a substitute for that flow.

### 3.6 Set password (citizen only)

- A Citizen who initially registered through Google does not have a password because Google authentication does not require one. The Set Password feature allows that Citizen to create a password for their existing account.

- After setting a password, the Citizen can authenticate using either Google or email/password. Both methods continue to access the same Citizen account.

- This feature is available only to Citizens. Staff, Admin, and Super Admin accounts are created through administrative processes and always have a password from the time their account is created.

### 3.7 Tokens and sessions

Every successful login or registration — credential or Google, any role — issues an **access token** and a **refresh token**, both set as cookies.

### 3.8 Welcome emails

| Event                                             | Recipient          | Contains                                                        |
| --------------------------------------------------- | -------------------- | ------------------------------------------------------------------ |
| Citizen's first registration, right after successful verification/auto-login | Citizen's email       | Welcome message, account confirmation, and brief information about CityFix                                                    |
| Staff account is activated                    | Staff's email        | Welcome message, account activation confirmation, and login information                                                    |
| Admin or Super Admin gets created                     | Their **personal** email | Their new **organization** email (their login), their generated password, and a prompt to change that password after logging in |

## 4. Admin and Super Admin management

Only a Super Admin or an Admin can create a new Admin (a Super Admin can also create a new Super Admin — see the permissions table in [Section 2.1](#21-who-can-manage-whom)). The creator fills in two email addresses for the new account:

- **Organization email** — the account's login identity going forward, assigned by whoever creates the account (e.g. a company email).
- **Personal email** — the actual person's own inbox, used only to deliver the welcome message.

The system generates a password for the new account and sends it to the **personal** email inside the welcome email, along with the organization email and a prompt to change the password on first login. There is no self-registration and no OTP step for Admin or Super Admin accounts — the invite-and-generated-password flow, plus the forced password change, is what secures them instead.

## 5. Staff onboarding and activation

1. Admin creates the Staff account → Staff receives an email → Staff verifies their email through the verification link/OTP → Staff sets the initial password → account becomes pending activation → Admin activates the Staff account.
2. System sends Activation Email with a secure token.
3. Staff clicks link → Verifies Email (OTP) → Sets Initial Password.
4. Status updates to PENDING_ACTIVATION.
5. Admin clicks "Activate" → Status: ACTIVE.
6. Staff can now log in.

## 6. Complaint categories and departments
 
A category is what a citizen picks when filing a complaint (e.g., Pothole, Streetlight Outage, Garbage Overflow, Water Leakage). Each category maps to exactly one department by default.
 
| Rule | Detail |
|---|---|
| Category → Department mapping | Maintained by Admin/Super Admin. Each category has one default department. |
| Auto-suggestion | When a citizen submits a complaint, the system auto-suggests a department based on the selected category. |
| Admin override | The assigned Admin/Super Admin can confirm the auto-suggested department or reroute to a different one before assignment proceeds. |
| Department status | A department can be active or inactive. Inactive departments cannot receive new assignments, but existing complaints already assigned to them are unaffected. |
 
## 7. Complaint submission
 
### 7.1 What a citizen submits
 
| Field | Detail |
|---|---|
| Category | Required — selected from the active category list. |
| Description | Required — free text describing the issue. |
| Location | Required — address text and/or coordinates. |
| Photo(s) | Optional — evidence of the issue. |
| Priority (citizen-suggested) | Optional — Low/Medium/High; final priority can be adjusted by Staff/Admin. |
 
### 7.2 Visibility
 
- A citizen can only view and track their own complaints.
- Staff can only view complaints assigned to them (individually or to their department, pending individual assignment).
- Admin/Super Admin can view all complaints across all departments.
## 8. Complaint lifecycle
 
A complaint moves through the following statuses:
 
```
SUBMITTED → UNDER_REVIEW → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED
                                                          ↓
                                                      DISPUTED → IN_PROGRESS
```
 
| Status | Set by | Meaning |
|---|---|---|
| **SUBMITTED** | Automatic | Citizen has filed the complaint; category auto-suggests a department. |
| **UNDER_REVIEW** | Automatic/Admin | Admin/Super Admin confirms or reroutes the department. |
| **ASSIGNED** | Admin/Super Admin | A specific Staff member is assigned to handle it. |
| **IN_PROGRESS** | Staff | Staff has started work on the issue. |
| **RESOLVED** | Staff | Staff marks the issue fixed; must attach resolution proof (photo/note). |
| **DISPUTED** | Citizen | Citizen rejects the resolution within a review window; reason required. Only reachable from RESOLVED. |
| **CLOSED** | Citizen or auto-timeout | Citizen confirms resolution, or the complaint auto-closes after a review window passes with no dispute. |
 
**Legal transition rule:** A complaint can never move backward except `RESOLVED → DISPUTED → IN_PROGRESS`. Every other transition is strictly forward. This is enforced in the service layer, not left to the client.
 
 ## Auto-Close Rule: 
 - If a complaint remains in RESOLVED status for 48 hours without a Dispute, it automatically transitions to CLOSED.

## 9. Assignment
 
1. Admin/Super Admin reviews a `SUBMITTED` complaint, confirms/reroutes its department (→ `UNDER_REVIEW`).
2. Admin/Super Admin assigns it to a specific, **active** Staff member within that department (→ `ASSIGNED`). Assignment to a Pending, blocked, or inactive Staff account is not allowed.
3. A complaint can be reassigned to a different Staff member by Admin/Super Admin at any point before `RESOLVED`, with the reassignment logged.
## 10. Fines
 
A fine is a monetary penalty issued by Staff for violations.
Recipient Types:
Registered Citizen: Linked via userId. Disputes and payments appear in their dashboard.
Guest Citizen: Identified by name and phone/email. Receives a secure payment link via SMS/Email. Cannot dispute online; must contact Admin support.
Lifecycle: ISSUED → (PAID | DISPUTED → UPHELD/WAIVED | VOIDED).
Jurisdiction: Staff can only issue fines related to their assigned Department’s categories.

**Guest Citizens:** Staff can issue fines to individuals without CityFix accounts by providing their name and contact info. These guests receive a secure payment link via SMS/Email. They cannot dispute online; disputes must be handled by Admin support.
 
## 11. Data models (conceptual)
 
- **User** — shared identity for every role: email, password (nullable — kept nullable for consistency with the OAuth-linking pattern used by Citizen/Google), linked Google account (Citizen only), role (`SUPER_ADMIN` / `ADMIN` / `STAFF` / `CITIZEN`), account status (Pending/Active/Blocked), email-verified flag, "must change password" flag (for Admin/Super Admin post-creation).
- **Citizen profile** — personal info (name, phone, address).
- **Staff profile** — personal info, department, activation status.
- **Admin profile** — personal info, organization email assigned at creation. Shared shape for Admin and Super Admin; `role` distinguishes them.
- **Department** — name, status (active/inactive), list of staff.
- **Category** — name, default department mapping.
- **Complaint** — citizen, category, department, assigned staff (nullable), description, location, photos, priority, status, timestamps per status, resolution proof.
- **ComplaintStatusLog** — complaint, from-status, to-status, changed-by, timestamp, note (audit trail).
- **Fine** — citizen, issuing staff, linked complaint (nullable), reason, amount, evidence, status, payment reference.
    recipientId (Optional, links to User), guestName (String, Optional), guestContact (String, Optional). If recipientId is - present, it's a registered citizen; if guestName is present, it's a guest.

- **Payment** — fine, amount, gateway, transaction reference, status, timestamp.

12. ## Notifications
- The system will send email notifications for critical events:
- Citizen: Complaint Status Changes (Assigned, Resolved), Fine Issued.
- Staff: New Complaint Assigned, Fine Dispute Received.
- Admin: Staff Account Activation Request, High-Priority Complaint Submitted.
- Technical Note: For the backend demo, these will be logged to the console/database if an SMTP server is not configured, but the architecture will support real email sending via Nodemailer/SendGrid.

13. ## Security & Validation Rules
Add this to ensure your "Input Validation" and "Security" marks are covered in the requirements:
13.1 Input Validation (Zod)
All incoming data must be validated against a schema before reaching the controller.
Email: Must be a valid format.
Password: Minimum 8 characters, including at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.
Phone: Must match local format (e.g., +880...).
File Uploads: Max 5MB per file, allowed types: jpg, png, pdf.
13.2 Rate Limiting
Auth Endpoints: Max 5 requests per minute (to prevent brute-force).
General API: Max 100 requests per minute per IP.

