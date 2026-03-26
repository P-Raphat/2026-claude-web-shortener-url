# Code Review - URL Shortener Web

Reviewed: 2026-03-26

All 16 issues have been identified and fixed. Issue #4 (rate limiting) requires a design decision and is noted below for manual implementation.

---

## Critical Security

### 1. Leaked secret in `.env.example` - FIXED

Replaced the real `NEXTAUTH_SECRET` with a placeholder value.

### 2. No middleware for route protection - REVERTED

Next.js 16 deprecated `middleware.ts` in favor of `proxy.ts`, and the NextAuth `auth()` function imports the Prisma/MariaDB stack which cannot run in edge runtime. The existing per-route `auth()` checks in every API handler already protect all endpoints. Consider migrating to the Next.js 16 `proxy.ts` convention if centralized route protection is needed in the future.

### 3. PATCH endpoint has no input validation - FIXED

Added `updateUrlSchema` in `src/lib/validations.ts` and applied Zod validation in the PATCH handler at `src/app/api/urls/[id]/route.ts`.

### 4. No rate limiting on auth endpoints - MANUAL ACTION NEEDED

Login and register have no rate limiting, making them vulnerable to brute force attacks. You have Redis available - implement rate limiting using it.

**Suggested approach:** Track failed login attempts per IP/email in Redis and block after N failures within a time window. Consider using a library or writing a simple middleware that increments a counter key with TTL.

---

## Medium Security

### 5. Password min-length mismatch - FIXED

Changed `loginSchema` password validation from `min(6)` to `min(8)` to match `registerSchema`.

### 6. User enumeration via registration - FIXED

Changed the "Email already in use" 409 response to a generic `"Registration failed"` 400 response.

### 7. Dockerfile runs as root - FIXED

Added `adduser --system --uid 1001 nextjs` and `USER nextjs` directive to the runner stage.

### 8. Unhandled `req.json()` errors - FIXED

Added try/catch around `req.json()` in all 3 API routes:
- `src/app/api/urls/route.ts`
- `src/app/api/urls/[id]/route.ts`
- `src/app/api/auth/register/route.ts`

---

## High Priority Best Practices

### 9. Unused and misplaced dependencies - FIXED

- Removed `@prisma/adapter-mssql`, `dotenv`, `@types/mssql`
- Moved `prisma` from `dependencies` to `devDependencies`

### 10. Unsafe NextAuth type casting - FIXED

Created `src/types/next-auth.d.ts` with proper type augmentation for `User`, `Session`, and `JWT`. Removed unsafe type assertions from `src/lib/auth.ts`.

### 11. Fragile short code collision handling - FIXED

Replaced single-retry logic with a 5-attempt retry loop in `src/app/api/urls/route.ts`. Returns 503 if all attempts fail.

### 12. Raw SQL with hardcoded table name - FIXED

Replaced raw SQL query in `src/app/api/urls/[id]/stats/route.ts` with Prisma `findMany` + in-memory grouping by date. No more hardcoded table name.

### 13. Unused state variable - FIXED

Removed the unused `mounted` state and `setMounted(true)` call from `src/app/(auth)/register/page.tsx`.

---

## Low Priority Best Practices

### 14. Commented-out old schema - FIXED

Deleted ~50 lines of commented-out MSSQL schema from `prisma/schema.prisma`.

### 15. Inconsistent CSS gradient class - FIXED

Changed `bg-gradient-to-br` to `bg-linear-to-br` in `src/app/(auth)/register/page.tsx` to match the login page (Tailwind v4 canonical form).

### 16. Duplicated `Url` interface - FIXED

Created shared `src/types/url.ts` and updated both `UrlList.tsx` and `EditUrlModal.tsx` to import from it.

---

## Summary of Changes

| # | File | Change |
|---|---|---|
| 1 | `.env.example` | Replaced leaked secret with placeholder |
| 2 | `src/middleware.ts` | Reverted - Next.js 16 uses `proxy.ts`, and auth imports can't run in edge |
| 3 | `src/lib/validations.ts` | Added `updateUrlSchema` |
| 3 | `src/app/api/urls/[id]/route.ts` | Added Zod validation to PATCH + try/catch |
| 5 | `src/lib/validations.ts` | Fixed `loginSchema` password min to 8 |
| 6 | `src/app/api/auth/register/route.ts` | Generic error + try/catch |
| 7 | `Dockerfile` | Added non-root user |
| 8 | `src/app/api/urls/route.ts` | try/catch on req.json() |
| 9 | `package.json` | Removed unused deps, moved prisma to devDeps |
| 10 | `src/types/next-auth.d.ts` | **New file** - type augmentation |
| 10 | `src/lib/auth.ts` | Removed unsafe type casts |
| 11 | `src/app/api/urls/route.ts` | Retry loop for collision |
| 12 | `src/app/api/urls/[id]/stats/route.ts` | Replaced raw SQL with Prisma |
| 13 | `src/app/(auth)/register/page.tsx` | Removed unused state + fixed gradient |
| 14 | `prisma/schema.prisma` | Removed commented-out old schema |
| 16 | `src/types/url.ts` | **New file** - shared Url interface |
| 16 | `src/components/dashboard/UrlList.tsx` | Import shared Url type |
| 16 | `src/components/dashboard/EditUrlModal.tsx` | Import shared Url type |
