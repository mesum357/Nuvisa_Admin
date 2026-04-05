# Nuvisa Getting Started Guide

This guide explains:
- How to run the current local setup
- How the older content system works (and how frontend consumes it)

## 1) Project Setup Overview

This workspace has two apps:
- Admin app: manages content, pricing, countries, and dashboard operations
- Frontend app: customer-facing site that consumes admin/public APIs

Typical local ports:
- Admin: 3001
- Frontend: 3002

## 2) Prerequisites

- Node.js 18+ (Node 20 recommended)
- npm or pnpm
- PostgreSQL / Supabase database access for admin app

## 3) Install Dependencies

Run in each app folder.

Admin app:

```bash
cd d:/arafat/Nuvisa-Admin
npm install
```

Frontend app:

```bash
cd d:/arafat/New-NUvisa
npm install
```

## 4) Environment Configuration

Create environment files with your own values (do not commit secrets).

Admin app environment should include, at minimum:
- DATABASE_URL
- DIRECT_URL (if using migrations)
- NEXTAUTH_SECRET
- NEXTAUTH_URL
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- ADMIN_PUBLIC_URL

Frontend environment should include, at minimum:
- NEXT_PUBLIC_API_URL
- NEXT_PUBLIC_ADMIN_API_URL
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

## 5) Database Setup (Admin)

In admin app:

```bash
cd d:/arafat/Nuvisa-Admin
npm run db:generate
npm run db:push
npm run db:seed
```

Alternative one-shot setup:

```bash
npm run setup
```

## 6) Run Both Apps

Start admin first:

```bash
cd d:/arafat/Nuvisa-Admin
npm run dev
```

Then start frontend:

```bash
cd d:/arafat/New-NUvisa
npm run dev
```

Expected URLs:
- Admin: http://localhost:3001
- Frontend: http://localhost:3002

## 7) Quick Smoke Test

1. Open admin and log in.
2. Update one content value in admin.
3. Open frontend and verify the same section updates.
4. Check browser network calls to confirm frontend is hitting admin public endpoints.

## 8) How the Old System Works

The older system is content-driven and key-based.

### 8.1 Core Pattern

- Admin stores content in database tables.
- Frontend fetches this content via admin APIs.
- UI components map keys to labels/sections and render values with fallbacks.

### 8.2 Two Legacy Content Styles

1. Dedicated section models and APIs
- Examples: header-content, footer-content, slider-content, occasion-content, process-content
- These have structured fields such as key, value, section, order, isActive

2. Generic key-value store
- Endpoint: /api/content
- Backed by SiteContent table
- Used for lightweight dynamic text (single keys like urgent text, subtitles, feature labels)

### 8.3 Frontend Consumption Pattern

Frontend usually:
1. Calls admin/public endpoint (or content endpoint)
2. Builds a key map from API payload
3. Reads known keys
4. Falls back to hardcoded defaults when keys are missing

This is why changing content in admin immediately affects frontend labels without redeploying frontend code.

### 8.4 Examples of Old-System Dynamic Areas

- Slider labels and pricing helper text from slider-content
- Occasion section title/description/cards from occasion-content
- Generic text snippets from content keys (urgent text, "more to love" labels, etc.)

## 9) Common Issues

1. Frontend shows old/default text
- Verify NEXT_PUBLIC_ADMIN_API_URL points to correct admin instance
- Confirm key exists in admin DB and isActive if applicable
- Check CORS/public endpoint and browser network response

2. Admin changes do not persist
- Check DB connection and Prisma schema sync
- Ensure correct API route is used (section-specific vs generic /api/content)

3. Wrong command typo
- Use npm run dev (not npm rund ev)

## 10) Recommended Team Workflow

1. Keep schema updates in admin app only.
2. For simple labels, prefer /api/content key-value style.
3. For complex sections (lists/cards/order/active flags), use section-specific model + API.
4. Document newly added keys in the feature PR so frontend mapping remains clear.

---

If you want, this guide can be split into:
- GET_STARTED_ADMIN.md
- GET_STARTED_FRONTEND.md
- LEGACY_CONTENT_FLOW.md
for cleaner handover docs.
