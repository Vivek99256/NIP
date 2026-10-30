# MedRec — Patient Medical Record Management System

Production-oriented Patient Medical Record Management System built with **Next.js (App Router)**, **TypeScript**, **PostgreSQL**, **Prisma ORM**, and **Tailwind CSS**.

---

## 🏥 Architecture & Core Capabilities

The platform implements strict role-based access control (RBAC), data segregation, patient privacy protections, and cryptographic auditability across three distinct user roles:

### 1. Patient Portal
- **Mobile OTP Authentication**: Secure passwordless sign-in with phone normalization (`libphonenumber-js`), HMAC-SHA256 hashed challenges, and rate limiting.
- **Medical Profile Management**: Demographics, blood group, emergency contacts, known allergies, pre-existing chronic conditions, and completion progress indicator.
- **Radiology Imaging Reports**: Categorized diagnostic imaging (X-Ray, CT Scan, MRI, Sonography/Ultrasound, PET-CT) with PDF/image preview modal and secure download.
- **Pathology & Laboratory Records**: Structured biochemical results (CBC, LFT, KFT, Blood Sugar, Urinalysis, Histopathology) with numerical values, reference ranges, and critical abnormality flags.
- **Versioned Prescriptions**: Official electronic prescriptions with clinical diagnoses, full medication dosing schedules, follow-up dates, and printable clinic letterhead view.
- **Appointment Scheduling**: Doctor discovery, specialty filtering, real-time slot selection, and transactional double-booking collision guards.
- **Medical Documents**: Discharge summaries, operative records, and medical certificates with encrypted private object storage.

### 2. Doctor Portal
- **Assigned Consultations**: Today's and upcoming appointment management with status transitions (Confirm, Complete, Cancel).
- **Authorized Patient Directory**: Strict clinical relationship enforcement—doctors can only view charts for patients they are actively treating or consulting with.
- **Prescription Workflow**: Dynamic medicine entry builder with dosage, strength, route, frequency, and instructions.
- **Tamper-Evident Immutability**: Once a prescription is finalized, silent edits are prohibited. Changes produce versioned amendments preserving historical snapshots and author audit trails.
- **Physician Profile**: Medical registration number, qualifications, consultation fees, and practice details.

### 3. Administrator Portal
- **Platform Analytics**: Executive stat cards and Recharts data visualization of consultations, diagnostics, and prescriptions.
- **Physician Verification Queue**: Review and approve, reject, or suspend doctor accounts before granting clinical prescribing rights.
- **Patient Account Directory**: Monitor verified mobile accounts with strict clinical data segregation.
- **Security & Audit Ledger**: Real-time audit trail of all sensitive medical actions, zero-PHI metadata, actor tracking, and timestamp verification.
- **Diagnostic Master Data**: Standardized radiology modalities and pathology panels.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router with Turbopack) |
| **Language** | TypeScript (Strict mode enabled) |
| **Frontend** | React 19, Tailwind CSS, Lucide React Icons |
| **UI Components** | Custom design system styled with Tailwind CSS & CVA |
| **Database** | PostgreSQL |
| **ORM** | Prisma ORM 5.22.0 |
| **Authentication** | Mobile Phone + OTP, HMAC-SHA256, HttpOnly/SameSite Session Cookies |
| **Input Validation** | Zod schemas for all untrusted client payloads |
| **Form Handling** | React Hook Form with `@hookform/resolvers/zod` |
| **Data Visualization** | Recharts (Responsive bar and trend charts) |
| **Storage Layer** | Private S3-compatible adapter (`@aws-sdk/client-s3`) & Local Disk provider |
| **Testing** | Vitest, React Testing Library, JSDOM |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.17+ or LTS (v24.x tested and supported)
- **NPM**: v9+

### 2. Installation
```bash
git clone <repository-url>
cd NIP
npm install --legacy-peer-deps
```

### 3. Environment Configuration
Copy the provided `.env.example` to `.env`:
```bash
cp .env.example .env
```

Key environment variables:
```ini
# PostgreSQL Connection String
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/medrec?schema=public"

# Session Security Secret
SESSION_SECRET="your_32_character_random_hex_secret_here"
SESSION_COOKIE_NAME="medrec_session_token"

# SMS OTP Provider (MOCK for development, TWILIO / MSG91 for production)
SMS_PROVIDER="MOCK"
OTP_EXPIRY_SECONDS="300"
OTP_RESEND_COOLDOWN_SECONDS="60"
OTP_MAX_ATTEMPTS="3"

# Private File Storage (LOCAL for local disk, S3 for cloud object store)
STORAGE_PROVIDER="LOCAL"
LOCAL_STORAGE_DIR="./uploads"

# AWS S3 / MinIO / Cloudflare R2 (Required only when STORAGE_PROVIDER=S3)
S3_ENDPOINT=""
S3_BUCKET="medrec-private-documents"
S3_REGION="us-east-1"
S3_ACCESS_KEY=""
S3_SECRET_KEY=""
```

### 4. Database Initialization & Migrations
When your PostgreSQL instance is running:
```bash
# Push schema or apply migrations
npx prisma migrate deploy

# Seed database with initial medical fixtures
npm run prisma:seed
```

> **Zero-Config Development Adapter**: If running without a live PostgreSQL instance, the included development repository (`lib/db/repo.ts` and `lib/db/memory-store.ts`) automatically falls back to an in-memory data store seeded with realistic fixtures. All UI flows, authentication, and tests work immediately out of the box!

### 5. Running the Application
```bash
# Start local development server
npm run dev

# Run production build
npm run build
npm run start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Fast-Fill Demo Test Accounts

The development SMS provider automatically logs OTPs to the console and displays a **⚡ Quick Fill** button on the `/verify-otp` page:

| Role | Mobile Number | Credentials / Description |
|---|---|---|
| **Patient** | `+91 98765 43210` | Rohan Verma (Radiology, CBC/LFT Labs, Prescriptions) |
| **Doctor** | `+91 98200 11223` | Dr. Aarav Mehta (Verified Consultant, MD Internal Medicine) |
| **Doctor (Pending)** | `+91 98200 44556` | Dr. Vikram Deshmukh (MD Cardiology, Pending License Verification) |
| **Admin** | `+91 90000 00001` | Platform Administrator (Doctor verification queue & audit ledger) |

---

## 🧪 Automated Testing Suite

The repository includes comprehensive unit and integration tests covering security, cryptography, RBAC, prescription versioning, and appointment locks:

```bash
# Run all automated tests
npm test
```

### Test Coverage Highlights:
- **`tests/unit/auth.test.ts`**: OTP hashing, cryptographic randomness, attempt counters, replay attack prevention, and session token tamper protection.
- **`tests/unit/phone-and-validation.test.ts`**: E.164 phone normalization, Zod input validation schemas for all routes.
- **`tests/unit/storage.test.ts`**: MIME type allowlist, max file size guard (15MB), path traversal attack prevention.
- **`tests/integration/prescriptions-and-appointments.test.ts`**: Draft creation, authorized finalization, immutable versioned amendments, and transactional double-booking prevention.
- **`tests/integration/authorization.test.ts`**: Patient ownership checks, doctor-patient relationship authorization, and unverified physician privilege blocks.

---

## 🔒 Security & Privacy Architecture

1. **Patient Data Isolation**: Patients can never view another patient's medical records. URL parameter tampering or changing IDs returns an explicit 403 Forbidden.
2. **Doctor-Patient Access Policy**: Doctors can only access medical records for patients with an active clinical consultation or treatment history.
3. **No Plaintext Passcodes**: One-time codes are stored as salted HMAC-SHA256 digests. OTPs are invalidated immediately after single use or after exceeding 3 failed attempts.
4. **Prescription Integrity**: Finalized prescriptions cannot be modified. Any updates require an official amendment workflow that preserves the original record snapshot and logs the doctor's reason.
5. **Private Storage**: Medical documents are stored with random UUID storage keys outside public directories. Downloads are served via secure signed URLs or streaming endpoints verifying record-level access.
6. **Segregated Administrative Access**: Administrators have platform and doctor verification access, but sensitive medical diagnostic notes are segregated from general admin views to adhere to HIPAA/GDPR data-minimization principles.
