# Eventra — Platform Specification & Architecture Documentation
**Enterprise Multi-Tenant Event Management & Ticketing SaaS**

---

## 1. Executive Summary & Vision

**Eventra** is an enterprise-grade, multi-tenant Software-as-a-Service (SaaS) platform built for event production companies, conference organizers, venues, and universities. The platform eliminates operational fragmentation by centralizing:
- **Tenant-isolated organization management** with custom slugs and role-based permissions.
- **Event creation and lifecycle scheduling** with automated categorization and Cloudinary media processing.
- **Multi-tier dynamic ticketing** with atomic inventory locking to eliminate overselling.
- **Dual checkout pathways** featuring Stripe Hosted Checkout for credit card settlements and on-site venue settlement flows.
- **Cryptographic QR check-in scanning** enabling gate staff to validate attendee passes in real time.
- **Edge-cached public discovery & modern GraphQL querying** coupled with automated daily maintenance crons.

---

## 2. Technical Stack & Infrastructure

### 2.1 Technology Matrix
| Layer | Technologies / Libraries |
| :--- | :--- |
| **Frontend Framework** | React 19, Vite 8, React Router v7, Axios |
| **Animation & Design** | GSAP 3, ScrollTrigger, Lucide Icons, Glassmorphism CSS |
| **Backend Runtime** | Node.js (v20+), Express.js |
| **Database & ODM** | MongoDB Atlas, Mongoose 8 (Connection Pooling) |
| **Authentication** | JWT (Access Tokens + HTTP-only Refresh Tokens), Bcrypt.js |
| **Payments & Billing** | Stripe Checkout, Stripe Webhook Listeners, Stripe Billing Portal |
| **Media Management** | Cloudinary v2, Multer (Memory Storage) |
| **Validation & Security** | CORS, Rate Limiting, Helmet, Tenant Scoping Middleware |
| **APIs** | RESTful JSON Endpoints + Lightweight GraphQL API |
| **Hosting & CI/CD** | Vercel (Edge Serverless Functions & Static Asset CDN) |

---

## 3. Multi-Tenancy & Security Architecture

Eventra enforces strict **Logical Multi-Tenancy** at both the routing and data layers. No organization can query, alter, or view another organization's events, tickets, attendees, or revenue.

### 3.1 Tenancy Enforcement Flow
1. **User Authentication:** When an authenticated user initiates a management request, the `authMiddleware` extracts and verifies the bearer JWT:
   $$\text{User Context} = \{ \text{userId}, \text{role}, \text{organizationId} \}$$
2. **Tenant Scoping:** The `attachTenant` middleware inspects the user context:
   - For `SUPER_ADMIN`, tenancy boundaries can be bypassed for system audits.
   - For `ORG_OWNER` and `ORG_MEMBER`, `req.organizationId` is injected into every subsequent query filter.
3. **Database Guardrails:** Mongoose service queries enforce `{ organization: req.organizationId }` on all mutating operations (`findOneAndUpdate`, `deleteMany`, `findByIdAndDelete`).

### 3.2 Role-Based Access Control (RBAC)
| Role | Permissions |
| :--- | :--- |
| **SUPER_ADMIN** | Global system visibility, tenant auditing, cross-org analytics. |
| **ORG_OWNER** | Full control over organization settings, billing plans, team member invitations, event publishing, and ticket revenue withdrawals. |
| **ORG_MEMBER** | Creation and modification of events, ticket tiers, attendee check-in via QR scanner. Cannot alter billing or organization ownership. |
| **ATTENDEE / USER** | Public event browsing, purchasing tickets, accessing personal booking history, downloading signed QR passes. |

---

## 4. Core Business Modules

### 4.1 Organization & Team Hub
- **Branded Slug Creation:** Organizations receive a unique URL identifier (e.g. `eventra-zz9.vercel.app/org/mooncamp-f2a5a5`).
- **Team Invitations:** Owners can invite staff members via encrypted tokens. Members accept invites to gain scoped dashboard permissions.
- **Subscription Upgrades:** Automated Stripe billing tiers (`STARTER` vs `PRO`) controlling published event capacity limits.

### 4.2 Event Lifecycle Management
- **Lifecycle Statuses:** `DRAFT` $\rightarrow$ `PUBLISHED` $\rightarrow$ `COMPLETED` / `CANCELLED`.
- **Dynamic Scheduling:** Multi-timezone scheduling with location coordinate storage and venue addresses.
- **Media Asset Pipeline:** Event posters and banners are streamed to Cloudinary, returning optimized WebP formats with fallback image anchors.
- **Safe Cascade Deletion:** When an organization owner deletes an event, `bookingService.deleteBookingsByEvent` and `ticketService.deleteTicketsByEvent` trigger atomic cascade removals to prevent orphaned records.

### 4.3 Tiered Ticketing & Atomic Inventory
- Events support multiple tiers (e.g., *Early Bird*, *General Admission*, *VIP Backstage Pass*).
- Each tier maintains `totalQuantity`, `soldQuantity`, and `price`.
- **Atomic Locking:** Checkout reservations verify `(totalQuantity - soldQuantity) >= requestedQuantity` using atomic MongoDB increments.

### 4.4 Dual Checkout Architecture
1. **Stripe Hosted Checkout:** Generates a secure Stripe Checkout Session with metadata tracking `organizationId`, `eventId`, and `ticketId`. Fulfills bookings upon webhook receipt (`checkout.session.completed`).
2. **On-Site Reservation Flow:** Direct reservation pathway for free workshops or pay-at-gate events, issuing immediate booking records and email confirmations.

### 4.5 QR Code Check-in Engine
- Each confirmed booking generates a unique ticket payload containing:
  $$\text{QR Payload} = \text{Base64}\left(\text{JSON}(\{ \text{bookingId}, \text{eventId}, \text{ticketId}, \text{code} \})\right)$$
- The in-app camera scanner parses the QR code at the event gate and submits a verification request to `/api/bookings/verify/:qrData`.
- Validations ensure tickets cannot be checked in more than once (`isUsed: true` validation).

### 4.6 Automated Daily Maintenance (Cron Jobs)
- Configured in `vercel.json` with schedule `0 0 * * *` targeting `/api/cron/cleanup`.
- Automatically transitions past events to `isExpired: true`, marks completed bookings, and purges unfulfilled reservation holds older than 24 hours.

### 4.7 High-Performance GraphQL Engine
- Available at `POST /api/graphql` for external integrations and rapid client fetching.
- Supports schema definitions for:
  - `events(category: String, limit: Int)`
  - `event(id: ID!)` with nested ticket tier resolutions.

---

## 5. Performance Engineering & Optimizations

To resolve perceived latency and bundle weight, the following optimizations were applied:

### 5.1 Rollup Chunk Splitting Strategy
Vendor dependencies are isolated into distinct, long-term cached browser bundles:
- `vendor-react`: React 19, React DOM, React Router v7 (~147 kB gzip)
- `vendor-gsap`: GSAP core and ScrollTrigger (~44 kB gzip)
- `vendor-misc`: Axios, Lucide icons, utilities (~128 kB gzip)
- **Route Chunks:**
  - `Landing.js`: reduced to **35.1 kB (7.5 kB gzip)**
  - `AdminDashboard.js`: reduced to **61.6 kB (10.2 kB gzip)**
  - `EventDetails.js`: reduced to **20.9 kB (4.3 kB gzip)**

### 5.2 Edge CDN Caching
Public API responses include Vercel Edge caching headers:
```http
Cache-Control: public, s-maxage=10, stale-while-revalidate=30
```
Subsequent visitors receive cached responses in $< 40\text{ms}$ globally without triggering serverless database round-trips.

### 5.3 UX Transition Architecture
- **Skeleton Pulse Screens:** Replaced blank loading texts with responsive pulsing wireframes matching the final layout.
- **Scroll Memory Management:** The `ScrollToTop` router listener automatically resets the viewport to $(0,0)$ on every navigation, preventing pages from loading at the footer.

---

## 6. Comprehensive API Reference

### Public REST Endpoints
| Method | Endpoint | Description | Cache Policy |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/events` | Browse upcoming public events with pagination & category filter | `s-maxage=10` |
| `GET` | `/api/events/:id` | Fetch full details for a single event | `s-maxage=10` |
| `GET` | `/api/tickets/event/:eventId` | List active ticket tiers for an event | `s-maxage=10` |
| `POST` | `/api/bookings` | Create an attendee booking / ticket reservation | No Cache |
| `POST` | `/api/feedback` | Submit public platform feedback or bug report | No Cache |

### Authenticated SaaS Hub Endpoints
| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Create new user & initialize organization |
| `POST` | `/api/auth/login` | Public | Authenticate user, return JWT |
| `GET` | `/api/events/org/my-events` | `ORG_OWNER`, `ORG_MEMBER` | Tenant-scoped event list |
| `POST` | `/api/events` | `ORG_OWNER`, `ORG_MEMBER` | Create event with image upload |
| `DELETE` | `/api/events/:id` | `ORG_OWNER` | Cascade delete event, tickets & bookings |
| `POST` | `/api/tickets` | `ORG_OWNER`, `ORG_MEMBER` | Create ticket tier for an event |
| `POST` | `/api/bookings/verify/:qr` | `ORG_OWNER`, `ORG_MEMBER` | Check-in attendee pass |
| `POST` | `/api/billing/create-checkout` | `ORG_OWNER` | Initiate Stripe subscription checkout |
| `GET` | `/api/billing/portal` | `ORG_OWNER` | Access Stripe Customer Billing Portal |

### System & Integration Endpoints
| Method | Endpoint | Authentication | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/cron/cleanup` | Cron Secret / Public | Nightly cleanup of expired events and holds |
| `POST` | `/api/graphql` | Public | GraphQL query interface |

---

## 7. Demonstration & Presentation Checklist

When showcasing Eventra to mentors or team members, follow this verified demonstration path:

1. **Platform Landing Page (`/`):**
   - Highlight the minimal, professional hero design and the live real-time runtime engine card.
   - Click category filter tags (*Tech*, *Music*, *Art*) to showcase live database filtering.
   - Scroll to footer and open **"Read More & Specs"** to present the architectural pillars.
2. **Attendee Booking Flow (`/events` $\rightarrow$ `/events/:id`):**
   - Click on an event card. Notice the instant navigation and smooth skeleton pulse loading.
   - Select a ticket tier, enter attendee details, and complete a reservation.
   - Display the issued reservation card with the dynamic QR pass and automated email trigger.
3. **Organizer Dashboard (`/dashboard`):**
   - Log in with organization credentials.
   - Showcase multi-tenant isolation, capacity telemetry, and revenue statistics.
   - Demonstrate the gate scanner (`/dashboard` $\rightarrow$ Scanner tab) parsing an attendee QR code.
   - Demonstrate event deletion confirming clean cascade removal without errors.
