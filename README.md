# CityFix — City Complaint & Service Management Platform

CityFix is a backend platform that lets citizens submit complaints about city services, routes them to the right department and staff member, tracks resolution through a defined lifecycle, and supports fines and payments tied to complaint enforcement.

Built as the backend assignment for the Programming Hero B7A6 course.

## Features

- **Role-based access control** for four roles: Super Admin, Admin, Staff (field agent), and Citizen
- **Authentication**
  - Citizen self-registration via email/password or Google, with OTP verification (OTP not required for Google sign-in)
  - Staff accounts created by Admin/Super Admin, start in `Pending`, activated after OTP verification
  - Admin/Super Admin accounts are invite-only, provisioned with a generated password and forced password change
  - Access and refresh tokens issued as cookies on every login
- **Complaint lifecycle management**
  - `SUBMITTED → ACKNOWLEDGED → ASSIGNED → IN_PROGRESS → RESOLVED → CONFIRMED → CLOSED`
  - `DISPUTED` branch from `RESOLVED`, looping back to `IN_PROGRESS`
- **Hybrid complaint routing** — category auto-suggests a department, Admin confirms or overrides
- **Assignment & reassignment** of complaints to staff within a department, with reassignment logging
- **Fines & payments**
  - Fines can be linked to a complaint or issued standalone by a field agent
  - Real payment integration via bKash (create-payment, callback handling, refund flow)
- **SLA tracking** — per category/department target resolution times, with breach flagging via a scheduled background job
- **Notifications** — async email delivery (status changes, welcome emails) via a job queue
- **Analytics/reporting module** for the Admin dashboard — complaints by category/department, average resolution time, SLA breach rate (Redis-cached)
- **File uploads** — profile images and complaint attachments (jpg/png/pdf, max 5MB)

## Tech Stack

- **Runtime:** Node.js / Express
- **Database:** PostgreSQL with Prisma ORM (relations, constraints, indexing, transactions)
- **Caching:** Redis (analytics/statistics endpoints)
- **Validation:** Zod / Joi on all applicable endpoints
- **Auth:** JWT (access + refresh tokens), Google OAuth
- **Payments:** bKash
- **File storage:** Cloudinary
- **Background jobs:** Queue-based email sending + scheduled SLA breach detection

## User Roles

| Role | Capabilities |
|---|---|
| **Super Admin** | Full access; only role that can create or block Admins/Super Admins |
| **Admin** | Manage complaints, staff, departments, fines (same powers as Super Admin except admin/super admin management) |
| **Staff** | Field agent; view/manage complaints assigned to them or unassigned within their department; issue fines for their department's categories |
| **Citizen** | Submit and track their own complaints; pay fines; confirm or dispute resolutions |

## API Response Format

All endpoints return a consistent structured response:

```json
// Success
{
  "success": true,
  "message": "string",
  "data": {}
}

// Error
{
  "success": false,
  "message": "string",
  "errors": {}
}
```

## Getting Started

### Prerequisites
- Node.js
- PostgreSQL
- Redis

### Installation

```bash
git clone <repo-url>
cd cityfix
npm install
```

### Environment Variables

Create a `.env` file with the following:

```env
DATABASE_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
BKASH_APP_KEY=
BKASH_APP_SECRET=
BKASH_USERNAME=
BKASH_PASSWORD=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
REDIS_URL=
```

### Database Setup

```bash
npx prisma migrate dev
npx prisma generate
```

### Run the Server

```bash
npm run dev
```

## Demo Credentials

> Add working demo admin credentials here before submission.

```
Email: admin@cityfix.demo
Password: ChangeMe123!
```

## API Documentation

Full Postman/OpenAPI documentation: _add link here_

## Live Deployment

Deployed API URL: _add link here_

## Rate Limits & Validation

- Auth endpoints: 5 requests/minute per IP
- General API: 100 requests/minute per IP
- Passwords: minimum 8 characters, must include uppercase, lowercase, number, and special character
- Phone numbers: must match local format (e.g. `+880...`)
- File uploads: max 5MB, `jpg`, `png`, `pdf` only

## Project Status

- [x] OTP verification flow (citizen registration / staff activation)
- [x] bKash payment integration (create-payment, callback/failure handling)
- [ ] bKash success/refund flow — written, pending live verification (sandbox wallets currently locked)
- [ ] Cloudinary profile image upload — blocked by a 403 on the upload API (account/network-level, root cause unresolved)
- [ ] Live deployment URL

