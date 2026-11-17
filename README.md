# Eventra

> A modern, multi-tenant Event Management and Ticketing SaaS platform built for high-throughput event operations, robust tenant isolation, dual payment workflows, and real-time QR-based venue check-in.

---

## Architectural Overview

Eventra is designed from the ground up as an enterprise-grade multi-tenant software-as-a-service platform. Event organizers register their organizations, configure custom workspace slugs, invite team members with granular role-based permissions, publish tiered events, and manage attendee check-in using an integrated hardware/webcam QR verification engine.

```
+-----------------------------------------------------------------------------------+
|                                  EVENTRA CLIENT                                   |
|                React 18 + Vite + Tailwind CSS + Lucide React + GSAP               |
+-----------------------------------------+-----------------------------------------+
                                          |
                                    REST APIs (JWT)
                                          |
+-----------------------------------------v-----------------------------------------+
|                                  EXPRESS BACKEND                                  |
|                                                                                   |
|  +--------------------+  +----------------------+  +---------------------------+  |
|  | Tenant Middleware  |  | RBAC Middleware      |  | Plan Limit Middleware     |  |
|  +--------------------+  +----------------------+  +---------------------------+  |
|                                                                                   |
|  +--------------------+  +----------------------+  +---------------------------+  |
|  | Event Management   |  | Dual-Payment Engine  |  | QR Code Engine (UUIDv4)   |  |
|  +--------------------+  +----------------------+  +---------------------------+  |
|                                                                                   |
|  +--------------------+  +----------------------+  +---------------------------+  |
|  | Audit Log Service  |  | Email Dispatcher     |  | Cascading Deletion Engine |  |
|  +--------------------+  +----------------------+  +---------------------------+  |
+-----------------------------------------+-----------------------------------------+
                                          |
                        Mongoose ODM / MongoDB Atlas
                                          |
+-----------------------------------------v-----------------------------------------+
|                               DATABASE ARCHITECTURE                               |
|   Users | Organizations | Invites | Events | Tickets | Bookings | AuditLogs       |
+-----------------------------------------------------------------------------------+
```

---

## Core Capabilities

### 1. Multi-Tenancy and Workspace Isolation
- Each organization operates within an isolated workspace defined by a unique organization slug.
- Data queries across events, team members, bookings, and audit records enforce tenant-level filtering at the middleware and service layers.
- Supports public vanity URLs (`/o/:orgSlug/events`) for direct marketplace exposure.

### 2. Role-Based Access Control (RBAC) & Team Collaboration
- Granular permission hierarchy:
  - **ORG_ADMIN**: Workspace owner with full billing, deletion, and team management authority.
  - **ORG_MEMBER**: Event management, ticket inventory, and attendee verification privileges.
- Cryptographically signed team invitation workflow via email tokens with 7-day expiration.

### 3. Tiered SaaS Subscriptions & Feature Gating
- Three subscription tiers:
  - **Starter**: 3 events maximum, 2 team members, standard support.
  - **Pro**: 25 events maximum, 10 team members, priority verification.
  - **Enterprise**: Unlimited events, unlimited team members, dedicated audit logging.
- Enforcement via reusable Express middleware validating live plan limits before event creation or member addition.

### 4. Dual Payment Processing Architecture
- **Stripe Hosted Checkout**: Secure checkout integration for paid tickets with webhook verification.
- **Pay at Venue**: Alternative checkout pathway allowing attendees to reserve tickets instantly and complete cash or card payments directly at the venue gate before check-in.
- Atomic inventory reservation to prevent overselling under high concurrency.

### 5. High-Security QR Ticket Verification Engine
- Cryptographically unique ticket tokens generated using UUIDv4.
- In-browser live camera scanner powered by `html5-qrcode` with instant audio/visual feedback.
- Manual fallback code entry for damaged or low-contrast mobile screens.
- Strict state-machine validation: Prevents double check-ins and disallows entry on unpaid venue reservations without prior payment confirmation.

### 6. Audit Logging and Compliance
- Automated immutable event capture for high-consequence administrative actions (event modifications, team invitations, ticket cancellations, payment overrides).
- Complete cascading deletion engine: Removing an organization cleans up all associated events, tickets, bookings, team memberships, and audit trails without leaving orphaned documents.

---

## Technical Stack

### Frontend
- **Framework**: React 18 with Vite build tooling
- **Styling**: Tailwind CSS with custom dark palette and neon emerald accents
- **Typography**: Satoshi (headings) and General Sans (body)
- **Icons**: Lucide React
- **Animations**: GSAP (GreenSock Animation Platform)
- **Scanning**: html5-qrcode
- **Networking**: Axios with centralized interceptors and bearer token injection

### Backend
- **Runtime**: Node.js (LTS)
- **Framework**: Express.js
- **Database**: MongoDB Atlas with Mongoose ODM
- **Authentication**: Stateless JWT (Access and Refresh token pairing) + bcrypt password hashing
- **Payments**: Stripe API SDK (SaaS subscriptions and paid ticket checkout)
- **Emails**: Nodemailer with transactional HTML templates
- **QR Generation**: qrcode library + UUIDv4

---

## Database Architecture and Compound Indexes

The data model is optimized for rapid multi-tenant lookups and data integrity through compound unique indexes:

| Model | Index Fields | Properties | Purpose |
|---|---|---|---|
| Organization | `slug` | `{ unique: true }` | Fast vanity URL resolution |
| User | `email` | `{ unique: true }` | Single-sign-on identity uniqueness |
| Booking | `qrCodeToken` | `{ unique: true, sparse: true }` | O(1) instant gate verification |
| Booking | `organizationId + user` | Compound Index | Fast attendee query filtering |
| Booking | `event + paymentStatus` | Compound Index | Rapid check-in roster querying |
| Invite | `token` | `{ unique: true }` | Single-use invitation validation |
| Invite | `organizationId + email` | Compound Index | Prevent duplicate active invitations |
| AuditLog | `organizationId + timestamp` | Compound Index | High-speed audit query pagination |

---

## Project Structure

```
week-13/
├── backend/
│   ├── config/             # Database connection, JWT secrets, and token config
│   ├── middleware/         # Auth, Tenant, Plan Limit, and RBAC middleware
│   ├── models/             # Mongoose schemas (User, Org, Event, Ticket, Booking, AuditLog)
│   ├── routes/             # REST API routing modules
│   ├── scripts/            # Database seeding and verification test suites
│   ├── services/           # Business logic (Billing, Booking, Email, Audit, Event)
│   ├── templates/          # Transactional email templates (HTML)
│   └── app.js              # Application entrypoint
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios API client with automatic token refreshing
│   │   ├── components/     # Reusable UI components (Navbar, Footer, TicketScanner)
│   │   ├── pages/          # Admin Dashboard, Event Details, Landing, Login, Register
│   │   ├── App.jsx         # Client routing and layout definitions
│   │   └── index.css       # Tailwind directives and custom theme styles
│   ├── index.html          # HTML entrypoint
│   └── vite.config.js      # Vite configuration
├── EVENTRA_PROJECT_SPECIFICATION.md # Full technical specification document
└── README.md               # Repository documentation
```

---

## Getting Started

### Prerequisites
- Node.js (v18.x or higher)
- npm (v9.x or higher)
- MongoDB Atlas instance or local MongoDB server

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/muntaha221/Eventra.git
   cd Eventra
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend/` directory:
   ```env
   PORT=3000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_REFRESH_SECRET=your_jwt_refresh_secret
   FRONTEND_URL=http://localhost:5173
   SMTP_HOST=your_smtp_host
   SMTP_PORT=587
   SMTP_USER=your_smtp_username
   SMTP_PASS=your_smtp_password
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   ```

3. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Running Locally:**
   - In terminal 1 (Backend):
     ```bash
     cd backend
     npm start
     ```
   - In terminal 2 (Frontend):
     ```bash
     cd frontend
     npm run dev
     ```

5. **Access Application:**
   Open `http://localhost:5173` in your browser.

---

## Verification Test Suite

Run the automated backend test suites to verify system functionality across all phases:

```bash
# Verify multi-tenancy, RBAC, and invitations
node backend/scripts/test-phase1.js

# Verify event lifecycle and ticket inventory
node backend/scripts/test-phase2.js

# Verify SaaS subscriptions and plan limits
node backend/scripts/test-phase3.js

# Verify Pay at Venue, QR scanner, audit logging, and cascading deletion
node backend/scripts/test-phase5-verification.js
```

---

## License

This project is licensed under the MIT License.
