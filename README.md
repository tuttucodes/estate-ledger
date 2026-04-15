# Estate Ledger (Expo + Supabase)

Production-ready mobile app foundation for owner/tenant property management using Expo, TypeScript, Supabase, Zustand, and React Query.

## Stack

- Expo + React Native + TypeScript
- Supabase (Auth, Postgres, Storage)
- Zustand (session + app state)
- React Query (data fetching/caching)

## Architecture

```
lib/
  supabase.ts
services/
  authService.ts
  propertyService.ts
  tenantService.ts
  paymentService.ts
  expenseService.ts
  documentService.ts
hooks/
  useOwnerData.ts
  useTenantData.ts
store/
  authStore.ts
  appStore.ts
types/
  index.ts
src/
  components/common.tsx
  utils/notifications.ts
App.tsx
```

## 1) Install

```bash
npm install
```

## 2) Environment

Copy `.env.example` to `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

## 3) Supabase SQL (run in SQL Editor)

```sql
create extension if not exists "uuid-ossp";

create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text unique not null,
  role text not null check (role in ('owner', 'tenant')),
  upi_id text
);

create table if not exists properties (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references users(id) on delete cascade,
  name text not null,
  location text not null
);

create table if not exists units (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references properties(id) on delete cascade,
  name text not null
);

create table if not exists tenants (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique not null references users(id) on delete cascade,
  unit_id uuid not null references units(id) on delete cascade
);

create table if not exists rent_agreements (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  rent_amount numeric not null,
  due_date int not null,
  start_date date not null
);

create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  amount numeric not null,
  method text not null check (method in ('upi','bank','cash')),
  utr_id text,
  screenshot_url text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists expenses (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references properties(id) on delete cascade,
  category text not null,
  amount numeric not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists documents (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references properties(id) on delete cascade,
  tenant_id uuid references tenants(id) on delete set null,
  file_url text not null,
  extracted_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```

## 4) Storage buckets

Create public buckets in Supabase Storage:

- `payment-screenshots`
- `documents`

## 5) Run app

```bash
npm run start
```

## 6) Currency switch (USD/INR)

- Currency toggle is available in `Profile`.
- App fetches live USD/INR rate and falls back safely if API is unavailable.
- All major amount screens now respect selected currency.

## 7) Build for real devices (Android/iOS)

Login to Expo + build:

```bash
npx eas login
npm run build:android:preview
npm run build:ios:preview
```

Notes:

- Android preview profile generates installable APK.
- iOS preview profile generates an internal test build (requires Apple account setup in EAS).
- After build completes, EAS provides install links/QR for physical device testing.

## Notes

- UPI flow uses deep link: `upi://pay?...`, with owner-specific UPI configured in owner Profile.
- OCR is a placeholder (`documents.extracted_data`) and is structured for future OCR API integration.
- Prevents duplicate pending payment submissions per tenant.
- Requires UTR for UPI/bank methods.

