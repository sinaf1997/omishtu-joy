# Omishtu-Joy

Omishtu-Joy is a professional student management, academics, and finance platform purpose-built for a short-course training center. It provides an end-to-end operational hub spanning in-person student intake, curriculum scheduling, attendance, certificate issuance, tuition cashiering, and core financial accounting.

The platform is engineered as a high-performance TypeScript monorepo featuring a **React 19** single-page application (SPA) styled with **Tailwind CSS 4** and **shadcn/ui**, an **Express** REST API service with strict runtime validation, and a relational **MySQL 8.x** database accessed through pure SQL with zero ORM overhead.

---

## 1. Tech Stack

The application stack is defined across root, backend, and frontend package configurations:

| Layer | Technology | Version | Purpose / Capabilities |
|---|---|---|---|
| **Frontend Framework** | React | `^19.0.0` | Declarative UI framework with modern React 19 concurrent features |
| **Frontend Language** | TypeScript | `^5.7.3` | Type-safe client-side application logic |
| **Frontend Build Tool** | Vite | `^6.2.0` | High-speed frontend dev server and production bundler |
| **CSS Framework** | Tailwind CSS | `^4.0.9` | Utility-first CSS engine using `@tailwindcss/vite` integration |
| **UI Component Library** | shadcn/ui | Latest | Accessible primitives using Radix UI, CVA, clsx, tailwind-merge |
| **Icons** | Lucide React | `^0.475.0` | Comprehensive iconography system |
| **Frontend Routing** | React Router DOM | `^7.2.0` | Client routing with public and role-protected route guards |
| **HTTP Client** | Axios | `^1.7.9` | Promise-based HTTP client with automatic Bearer token interceptor |
| **Charts & Analytics** | Recharts | `^2.15.1` | Composable charting library for operational and financial metrics |
| **QR Code Generation** | react-qr-code | `^2.0.15` | QR code generation for student verification and certificates |
| **PDF Document Export** | jsPDF | `^2.5.2` | Client-side generation of student invoices, receipts, and certificates |
| **Backend Runtime** | Node.js | `>=18.x` (LTS) | Server execution environment (ES Modules enabled) |
| **Backend Language** | TypeScript | `^5.7.3` | Server-side type safety in strict compilation mode |
| **Backend Framework** | Express | `^4.21.2` | Robust HTTP application server |
| **Database Driver** | mysql2 | `^3.12.0` | MySQL 8 driver using `mysql2/promise` with parameterized queries |
| **Validation Engine** | Zod | `^3.24.2` | Runtime schema validation for requests and environment variables |
| **Authentication** | JWT (`jsonwebtoken`) | `^9.0.2` | Stateless bearer token authentication |
| **Password Hashing** | bcrypt | `^5.1.1` | Strong adaptive password hashing with salt rounds |
| **Security Headers** | Helmet | `^8.0.0` | Standard HTTP security headers |
| **CORS Middleware** | cors | `^2.8.5` | Origin whitelisting and credentialed requests |
| **Request Logging** | Morgan | `^1.10.0` | HTTP request and response logger |
| **Testing** | Vitest & Supertest | `^3.0.6` / `^7.0.0`| Fast test runner and HTTP endpoint integration assertion |
| **TS Execution Engine** | tsx | `^4.19.3` | Native TypeScript watcher for server dev, migrations, and seeds |
| **Monorepo Tooling** | Concurrently | `^9.1.2` | Orchestrates parallel frontend and backend services |

---

## 2. Prerequisites

Ensure the following tools are installed on your host machine before starting development:

| Component | Minimum / Recommended Version | Purpose |
|---|---|---|
| **Node.js** | `18.x` or `20.x` LTS (v22.x supported) | JavaScript/TypeScript server runtime |
| **npm** | `9.x` or `10.x` | Monorepo workspaces and package manager |
| **MySQL Server** | `8.x` (Community or Enterprise) | Relational database engine (InnoDB, utf8mb4) |
| **Git** | `2.x+` | Source control and collaboration |

---

## 3. Users and Portals

Omishtu-Joy segregates operational concerns between internal staff members and training center students:

| User Role / Portal | Portal Surface | Access Level & Core Workflow |
|---|---|---|
| **Owner** | Staff Hub (`/staff`) | Full system administrative authority, master configuration, financial ledger control |
| **Manager** | Staff Hub (`/staff`) | Center oversight, scheduling sign-off, executive analytics, and supervisor overrides |
| **Academic Admin** | Staff Hub (`/staff`) | Course catalog management, cohort scheduling, instructor allocation, graduation |
| **Trainer** | Staff Hub (`/staff`) | Daily attendance marking, session assessments, student grading, performance notes |
| **Accountant** | Staff Hub (`/staff`) | Fee structures, cashiering, payment plans, accounts payable, bank reconciliation |
| **Receptionist** | Staff Hub (`/staff`) | In-person student intake, ID generation, profile creation, initial credential issue |
| **Student Portal** | Student Portal (`/portal`) | Student self-service: login using receptionist-issued Student ID and password to access course schedule, attendance history, grades, fee receipts, and digital certificates |

---

## 4. Project Layout

The codebase is organized as an npm workspaces monorepo separating server-side logic from the client application:

```text
omishtu/
├── .editorconfig                          ← Code indentation, charset, and newline rules
├── .env.example                           ← Monorepo environment variable template
├── .gitignore                             ← Git exclusions (node_modules, dist, .env)
├── package.json                           ← Root workspace orchestrator & shared scripts
├── package-lock.json                      ← Deterministic dependency lockfile
├── README.md                              ← System documentation and operational manual
│
├── backend/                               ← Node.js + Express TypeScript API workspace
│   ├── .env.example                       ← Backend configuration template
│   ├── package.json                       ← Backend dependencies, test scripts, and runners
│   ├── tsconfig.json                      ← Strict backend TypeScript configuration (ES2022/NodeNext)
│   └── src/
│       ├── app.ts                         ← Express app setup, CORS, Helmet, routes mount [S1]
│       ├── server.ts                      ← Server listener & graceful shutdown lifecycle [S1]
│       ├── config/
│       │   ├── database.ts                ← mysql2/promise connection pool & health probe [S1]
│       │   └── env.ts                     ← Zod runtime environment validation [S1]
│       ├── db/
│       │   ├── migrate.ts                 ← Zero-ORM SQL migration runner (_migrations table) [S1]
│       │   ├── seed.ts                    ← Development data seeder (disabled in production) [S1]
│       │   ├── migrations/
│       │   │   ├── 001_auth_and_rbac.sql                  ← Core authentication & RBAC tables [S1]
│       │   │   ├── 002_seed_roles_permissions.sql         ← Seed system roles and permissions [S1]
│       │   │   ├── 003_student_profiles_and_documents.sql ← Student intake, profiles & documents [S2]
│       │   │   ├── 004_courses_and_enrollments.sql        ← Courses, cohorts & enrollments [S3]
│       │   │   ├── 005_attendance_and_grading.sql         ← Sessions, attendance, grades & certs [S4]
│       │   │   ├── 006_fees_and_payments.sql              ← Invoices, cashiering & receipts [S5]
│       │   │   ├── 007_vendors_and_payables.sql           ← Vendors, bills & trainer payouts [S6]
│       │   │   ├── 008_ledger_and_reconciliation.sql      ← General ledger, chart of accounts [S7]
│       │   │   ├── 009_tax_budgets_and_audit.sql          ← Tax rules, budgets & audit trails [S8]
│       │   │   └── 010_lms_sync.sql                       ← External LMS sync & analytics [S9]
│       │   └── seeds/
│       │       └── 001_seed_dev_users.sql ← Seed SQL fixture for development users [S1]
│       ├── middleware/
│       │   ├── authenticate.ts            ← JWT bearer token verification middleware [S1]
│       │   ├── authorize.ts               ← Role-based access control (RBAC) guard [S1]
│       │   ├── error-handler.ts           ← Centralized error handler with standard JSON format [S1]
│       │   ├── not-found.ts               ← 404 handler returning standard JSON error payload [S1]
│       │   └── validate.ts                ← Zod request body, query, and params validator [S1]
│       ├── modules/
│       │   ├── auth/                      ← Authentication & token issuance module [S1]
│       │   │   ├── auth.controller.ts     ← Login handler & /me session retriever [S1]
│       │   │   ├── auth.routes.ts         ← POST /api/auth/login and GET /api/auth/me [S1]
│       │   │   └── auth.schema.ts         ← Zod validation schema for credentials [S1]
│       │   ├── health/                    ← Observability & readiness probe module [S1]
│       │   │   ├── health.controller.ts   ← System uptime & database connection checkers [S1]
│       │   │   └── health.routes.ts       ← GET /api/health and GET /api/health/ready [S1]
│       │   └── users/                     ← User management & persistence module [S1]
│       │       ├── users.repository.ts    ← Parameterized SQL queries for users table [S1]
│       │       ├── users.service.ts       ← User business logic & sanitization [S1]
│       │       └── users.types.ts         ← User interfaces & database records [S1]
│       ├── tests/
│       │   ├── env.test.ts                ← Vitest unit tests for environment validation [S1]
│       │   └── health.test.ts             ← Supertest integration tests for health & 404 [S1]
│       ├── types/
│       │   ├── express.d.ts               ← Express Request type augmentation for authenticated user [S1]
│       │   └── index.ts                   ← Core shared backend domain and token types [S1]
│       └── utils/
│           ├── api-response.ts            ← Standardized API response formatters [S1]
│           └── password.ts                ← bcrypt hashing & comparison utilities [S1]
│
└── frontend/                              ← React 19 + Vite SPA workspace
    ├── .env.example                       ← Frontend environment template
    ├── index.html                         ← HTML shell with viewport and root container
    ├── package.json                       ← Frontend dependencies and scripts
    ├── tsconfig.json                      ← Strict frontend TypeScript config with @/* path alias
    ├── vite.config.ts                     ← Vite configuration with React & Tailwind 4 plugins
    └── src/
        ├── App.tsx                        ← App root with RouterProvider and AuthProvider [S1]
        ├── index.css                      ← Tailwind CSS 4 theme tokens & shadcn variables [S1]
        ├── main.tsx                       ← React 19 createRoot DOM entry point [S1]
        ├── vite-env.d.ts                  ← Vite client environment type definitions [S1]
        ├── api/
        │   ├── auth.ts                    ← Authentication API client functions [S1]
        │   ├── client.ts                  ← Axios client with interceptors and error handling [S1]
        │   └── health.ts                  ← Health check and database probe callers [S1]
        ├── components/
        │   ├── layouts/
        │   │   ├── AppLayout.tsx          ← Main application shell with navbar and footer [S1]
        │   │   └── AuthLayout.tsx         ← Centered clean layout for authentication pages [S1]
        │   └── ui/                        ← shadcn/ui reusable component primitives
        │       ├── badge.tsx              ← Status badge component [S1]
        │       ├── button.tsx             ← Accessible button with variants [S1]
        │       ├── card.tsx               ← Card container with header, content, footer [S1]
        │       ├── input.tsx              ← Form text input component [S1]
        │       └── label.tsx              ← Accessible form label component [S1]
        ├── context/
        │   └── AuthContext.tsx            ← Global authentication state and token management [S1]
        ├── hooks/
        │   └── useAuth.ts                 ← Hook exposing auth context to components [S1]
        ├── lib/
        │   └── utils.ts                   ← shadcn cn() class combiner (clsx + tailwind-merge) [S1]
        ├── pages/
        │   ├── LandingPage.tsx            ← Landing page with live backend connectivity probe [S1]
        │   ├── NotFoundPage.tsx           ← 404 error page with return navigation [S1]
        │   ├── auth/
        │   │   └── LoginPage.tsx          ← Accessible login page with validation & error alerts [S1]
        │   ├── portal/
        │   │   └── PortalPlaceholderPage.tsx ← Student / user portal foundation [S1/S2]
        │   └── staff/
        │       └── StaffPlaceholderPage.tsx  ← Role-guarded staff workspace foundation [S1]
        ├── routes/
        │   ├── AppRoutes.tsx              ← React Router routes with public & protected paths [S1]
        │   └── ProtectedRoute.tsx         ← Route guard handling auth verification & RBAC [S1]
        └── types/
            ├── api.ts                     ← Standard frontend API envelope types [S1]
            └── auth.ts                    ← Frontend user identity & session types [S1]
```

---

## 5. Roadmap Status

| Sprint | Phase | Target Timeline | Functional Focus | Implementation Status |
|---|---|---|---|---|
| **S1** | Foundation & Security | Weeks 1–2 | Monorepo structure, Express API, React 19 SPA, Tailwind 4, JWT auth, RBAC guards, MySQL migration runner | **Done** (Dual separated portals, 6 staff roles, student auth, owner staff provisioning, forced password reset) |
| **S2** | Student Intake & Profiles | Weeks 3–4 | In-person student registration, photo upload, emergency contacts, profile cards, student ID generation | **Planned** |
| **S3** | Course Catalog & Scheduling | Weeks 5–6 | Short-course definitions, class cohorts, timetable schedules, classroom assignments, enrollments | **Planned** |
| **S4** | Academics & Operations | Weeks 7–8 | Session-by-session attendance tracking, trainer grade entry, QR code verification, PDF certificate generation | **Planned** |
| **S5** | Revenue & Cashiering | Weeks 9–10 | Tuition schedules, installment plans, POS/cash desk cashiering, automated PDF receipts, accounts receivable | **Planned** |
| **S6** | Accounts Payable & Vendors | Weeks 11–12 | Supplier bills, trainer disbursements, facility overhead tracking, payment vouchers | **Planned** |
| **S7** | General Ledger & Banking | Weeks 13–14 | Chart of accounts, double-entry journal transactions, bank statement imports, reconciliation | **Planned** |
| **S8** | Governance & Compliance | Weeks 15–16 | Withholding tax automation, departmental budgeting, immutable activity audit trails | **Planned** |
| **S9** | Executive Intelligence | Weeks 17–18 | Real-time P&L, balance sheets, cashflow statements, LMS synchronizer, executive analytics dashboard | **Planned** |

---

## 6. Getting Started

Follow these step-by-step instructions to set up the development environment from scratch:

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd omishtu
```

### Step 2: Install Monorepo Dependencies
Install all root, backend, and frontend dependencies in one command via npm workspaces:
```bash
npm install
```
*(On Windows systems where PowerShell script execution is restricted, run `npm.cmd install`)*.

### Step 3: Configure Environment Variables
Create the environment configuration files from their respective templates:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```
*(See [Section 7: Environment Variables](#7-environment-variables) for required keys).*

### Step 4: Create MySQL Database and User
Log into your local MySQL instance as `root` (or administrative user) and run:
```sql
CREATE DATABASE IF NOT EXISTS omishtu CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'omishtu_app'@'localhost' IDENTIFIED BY 'your_db_password';
GRANT ALL PRIVILEGES ON omishtu.* TO 'omishtu_app'@'localhost';
FLUSH PRIVILEGES;
```

### Step 5: Run Database Migrations
Execute the migration runner to build the database schema:
```bash
npm run migrate
```

### Step 6: (Optional) Seed Initial Development Accounts
Populate local testing accounts (`admin@dev.local`, `staff@dev.local`, `user@dev.local` with password `DevPassword123!`):
```bash
npm run seed
```

### Step 7: Start Development Servers
Start both backend (port 4000) and frontend (port 5173) concurrently:
```bash
npm run dev
```

You can also run each application independently:
- **Backend dev server:** `npm run dev:backend`
- **Frontend dev server:** `npm run dev:frontend`

### Application URLs

| Application / Service | Local Development URL | Purpose |
|---|---|---|
| **Frontend Web App** | [http://localhost:5173](http://localhost:5173) | Main user interface and portals |
| **Backend REST API** | [http://localhost:4000](http://localhost:4000) | Express API service base URL |
| **API Health Check** | [http://localhost:4000/api/health](http://localhost:4000/api/health) | Uptime and service status probe |
| **Database Readiness** | [http://localhost:4000/api/health/ready](http://localhost:4000/api/health/ready) | Safe MySQL connection validation |

---

## 7. Environment Variables

> [!IMPORTANT]
> **Never commit `.env` or `.env.local` files to version control.** Secrets must remain local or be injected via secure CI/CD and deployment secret managers.

### Backend Configuration (`backend/.env`)

Configure the backend environment with the following keys:

```env
PORT=4000
CORS_ORIGIN=http://localhost:5173
DB_HOST=localhost
DB_PORT=3306
DB_USER=omishtu_app
DB_PASSWORD=your_db_password
DB_NAME=omishtu
JWT_SECRET=generate_a_long_random_string_here
JWT_EXPIRES_IN=8h
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

#### Generating a Strong JWT Secret
Run the following Node command to generate a cryptographically secure 64-character hex secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Frontend Configuration (`frontend/.env.local`)

Create `frontend/.env.local` to point the frontend Axios client to the local API:

```env
VITE_API_URL=http://localhost:4000/api
```

---

## 8. Database Setup

### Migration Engine Architecture

Omishtu-Joy uses a custom, zero-ORM SQL migration engine (`backend/src/db/migrate.ts`) to maintain complete transparency and control over database schema changes:

1. **Tracking Table (`_migrations`):** Upon execution, the runner checks for or creates the `_migrations` tracking table:
   ```sql
   CREATE TABLE IF NOT EXISTS _migrations (
     id INT AUTO_INCREMENT PRIMARY KEY,
     name VARCHAR(255) NOT NULL UNIQUE,
     executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
   ```
2. **Deterministic Order:** The runner scans `backend/src/db/migrations/`, orders all `.sql` files lexicographically, and filters out files already recorded in `_migrations`.
3. **Execution Guarantee:** Each pending migration is executed sequentially. If a migration fails, execution halts immediately with exit code 1, leaving the failed file unrecorded so that errors can be diagnosed and fixed before retrying.

### Example Migration Runner Output

```text
> npm run migrate

--- Starting Database Migration Runner ---
Found 1 pending migration(s):
  - 001_create_users.sql
Executing migration: 001_create_users.sql...
Successfully applied: 001_create_users.sql
--- All migrations applied successfully ---
```

Running the command again when no changes are pending confirms idempotency:
```text
--- Starting Database Migration Runner ---
Database is already up to date. No pending migrations.
```

### Migration File List

The following schema migrations are currently active in `backend/src/db/migrations/`:

| Migration File | Sprint | Primary Tables / Changes | Purpose |
|---|---|---|---|
| `001_auth_and_rbac.sql` | S1 | `roles`, `permissions`, `role_permissions`, `staff`, `students` | Core authentication, staff identities across 6 roles, student code identities, and RBAC infrastructure. |
| `002_seed_roles_permissions.sql` | S1 | Seeds `roles` (the 6 staff roles), `permissions`, `role_permissions` | Populates the 6 standard training center staff roles and granular module permissions with ON DUPLICATE KEY UPDATE. |

*Note: Migration specifications for future sprints (003 through 010) are organized in `backend/src/db/migrations_drafts/` and will be migrated as each respective sprint is implemented.*


### Adding a New Migration

1. Create a new file in `backend/src/db/migrations/` using the 3-digit sequential naming convention:
   ```text
   backend/src/db/migrations/002_create_students_table.sql
   ```
2. Write raw, idempotent SQL statements.
3. **Never edit or rename an applied migration file.** Schema modifications must be performed by creating a new forward migration.
4. Execute `npm run migrate` and verify that the changes apply cleanly.

### Syncing an Existing Database

When deploying against an existing database that may already contain partial tables or schemas, track all structural adjustments:

#### Schema Changes Tracking Table
| Date | Target Table | Action | Reason |
|---|---|---|---|
| *None pending* | — | — | Clean initial database baseline |

#### Guarded DDL for MySQL 8 (Safe Column Alteration)
Because MySQL 8 does not support native `ADD COLUMN IF NOT EXISTS`, use a guarded `information_schema` PREPARE/EXECUTE procedure for safe column additions on existing databases:

```sql
-- Guarded column addition: adds 'phone_number' to 'users' only if it does not already exist
SET @col_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'phone_number'
);

SET @stmt = IF(
  @col_exists = 0,
  'ALTER TABLE users ADD COLUMN phone_number VARCHAR(20) NULL AFTER email',
  'SELECT "Column phone_number already exists in users" AS info'
);

PREPARE stmt_to_run FROM @stmt;
EXECUTE stmt_to_run;
DEALLOCATE PREPARE stmt_to_run;
```

---

## 9. Branching Strategy

Our team utilizes a streamlined Git workflow structured around feature sprints:

```text
main ───────────────────────────────────────────────────────────► (Production)
       ▲                                               ▲
       │ Release Merge                                 │ Hotfix
develop ───────────────────────────────────────────────┴────────► (Staging / Next Sprint)
          ▲                           ▲
          │ Feature PR                │ Feature PR
feature/sN-short-name       feature/sN-short-name
```

- **`main`**: Production branch. Every commit must be fully tested, verified, and deployable. Direct commits are restricted.
- **`develop`**: Integration branch. Contains the current state of development for the active sprint.
- **`feature/sN-short-name`**: Dedicated feature branches branched from `develop` (e.g., `feature/s2-student-registration`, `feature/s5-fee-cashiering`).
- **`fix/short-name`**: Bug fix branches branched from `develop` for sprint defects, or hotfix branches branched from `main` for critical production patches.

---

## 10. Change Log

| Date | Change | Who Needs to Act |
|---|---|---|
| **2026-10-19** | **Sprint 1 Database Migration & Seeding Stabilization**: Resolved `ER_NO_SUCH_TABLE: Table 'omishtu.staff' doesn't exist` root cause. Overhauled `migrate.ts` with statement-by-statement parsing (`splitSqlStatements`), fail-loud diagnostics reporting failing statement and file, and automatic recovery if `_migrations` contains stale entries while tables are missing. Synchronized `001_auth_and_rbac.sql` and `002_seed_roles_permissions.sql` as whole, clean migration files. Enhanced `seed.ts` to guarantee prerequisite migration execution before seeding and dynamically resolve foreign key role mappings. All 31 test suites verified passing. | Backend / Database / All |
| **2026-10-19** | **Sprint 1 (Phase 2) Completed**: Owner Seeding, Dashboard Shell & Staff Provisioning. Seeded dev owner (`owner@gmail.com`) with `SEED_OWNER_EMAIL` / `SEED_OWNER_PASSWORD` env overrides; built owner dashboard shell with 4 live stat cards, recent staff table, topbar search, and non-blocking security banner; implemented unified `navigation.ts` config filtered by role with `ComingSoonPage` fallbacks; delivered complete Users & Roles management (`/staff/owner/users`) with single-use temporary password issuance, password reset, role updates, and self-deactivation protection. | All / Backend / Frontend |
| **2026-10-19** | **Sprint 1 Completed**: Foundation, Security & Authentication. Delivered two completely separated portals (Staff & Student), 6 staff roles (`owner`, `receptionist`, `academic_admin`, `trainer`, `accountant`, `manager`), owner-only staff provisioning with single-use temporary password generation, forced password reset flow (`/change-password`), rate-limited login endpoints, production-safe migrations (`001_auth_and_rbac.sql` & `002_seed_roles_permissions.sql`), role and portal route guards, and modern purple & white landing page. | All / Backend / Frontend |
| **2026-10-17** | Added complete 10-migration suite (`001_auth_and_rbac.sql` through `010_lms_sync.sql`) covering RBAC, student intake, courses, attendance, cashiering, payables, ledger, compliance, and LMS sync. Updated migration scripts to `npm run migrate` and `npm run seed`. | Backend / Database Architects / All |
| **2026-10-17** | Initial project initialization: Full-stack monorepo foundation with React 19, Tailwind CSS 4, Express API, MySQL 8 migration runner, JWT authentication, and baseline technical README. | All developers / Team |

### Row Template for Future Changes
```markdown
| YYYY-MM-DD | Brief description of module, schema, env variable, or dependency change | Roles or developers impacted (e.g., All / Backend / DevOps) |
```

> [!NOTE]
> Add new entries at the **top** of the Change Log table for every project change (new module, schema migration, environment variable addition, dependency change, or setup procedure update).

---

## 11. Contribution Rules

To keep the codebase maintainable, secure, and production-ready, all contributors must observe these engineering standards:

1. **No Committed Secrets:** Never push `.env`, `.env.local`, API keys, database credentials, or secret keys to Git. Keep `.env.example` templates updated with sanitized placeholders.
2. **Self-Contained Modules:** Every backend business module must reside in its own folder under `backend/src/modules/<name>/` encapsulating:
   - `<name>.routes.ts`: HTTP route definitions and attached middleware.
   - `<name>.controller.ts`: Request parsing and HTTP response mapping.
   - `<name>.service.ts`: Core business logic and coordination.
   - `<name>.repository.ts`: Parameterized SQL execution (zero raw string concatenation).
   - `<name>.schema.ts`: Zod validation schemas for request bodies, queries, and params.
   - `<name>.types.ts`: Module-specific TypeScript interfaces.
3. **Guarded Staff Routes:** Every staff route must be guarded by both authentication (`authenticate`) and role-based authorization (`authorize(['owner', 'manager', ...])`). Client route guards in React must be backed by server-side middleware enforcement.
4. **Mandatory README Updates in Every PR:** Whenever a pull request introduces a new module, schema migration, environment variable, or sprint milestone, the following sections in `README.md` **must be updated in the same PR**:
   - **Roadmap Status** (Section 5)
   - **Migration File List** (Section 8)
   - **Change Log** (Section 10)
5. **Strict Compilation & Verification:** Pull requests must pass all checks before merge:
   ```bash
   npm run typecheck   # Must return 0 errors across backend and frontend
   npm run test        # Must pass all automated unit and integration tests
   npm run build       # Must compile backend and bundle frontend cleanly
   ```
