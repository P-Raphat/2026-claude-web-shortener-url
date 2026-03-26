# Code Review - URL Shortener Web

Reviewed: 2026-03-26

Only issues that need fixing are listed. Everything else looks good.

---

## Critical Security

### 1. Leaked secret in `.env.example`

**File:** `.env.example:3`

The `NEXTAUTH_SECRET` contains a real generated secret value. Anyone who clones this repo gets the same secret. If this was ever used in production, rotate it immediately.

```diff
- NEXTAUTH_SECRET="X4AIcgRcikQM3VNXyA1+5dd+ISoT1f5DvCGi1OD9sTo="
+ NEXTAUTH_SECRET="change-me-run-openssl-rand-base64-32"
```

---

### 2. No middleware for route protection

**Missing file:** `src/middleware.ts`

All route protection relies on each API route calling `auth()` individually. If you forget one, the endpoint is wide open. Add NextAuth middleware for centralized protection.

**Fix:** Create `src/middleware.ts`:
```ts
export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: ["/dashboard/:path*", "/api/urls/:path*"],
};
```

---

### 3. PATCH endpoint has no input validation

**File:** `src/app/api/urls/[id]/route.ts:38-46`

The `PATCH` handler reads `body.isActive`, `body.title`, `body.expiresAt` directly from `req.json()` without any Zod validation. An attacker could send unexpected fields.

**Fix:** Add an `updateUrlSchema` to `src/lib/validations.ts`:
```ts
export const updateUrlSchema = z.object({
  title: z.string().max(255).nullable().optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.iso.datetime().nullable().optional(),
});
```

Then validate in the PATCH handler:
```ts
const parsed = updateUrlSchema.safeParse(body);
if (!parsed.success) {
  return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
}
// use parsed.data instead of body
```

---

### 4. No rate limiting on auth endpoints

**Files:** `src/app/api/auth/register/route.ts`, `src/lib/auth.ts`

Login and register have no rate limiting. Attackers can brute-force credentials or spam account creation freely. You already have Redis available, use it.

**Fix:** Implement rate limiting using the existing Redis instance. For example, track failed login attempts per IP/email and block after N failures within a time window.

---

## Medium Security

### 5. Password min-length mismatch

**File:** `src/lib/validations.ts:16-23`

`loginSchema` allows passwords with `min(6)` but `registerSchema` requires `min(8)`. This is inconsistent and means the login form will accept passwords shorter than what registration allows.

**Fix:** Change `loginSchema` password to `min(8)` to match `registerSchema`.

---

### 6. User enumeration via registration

**File:** `src/app/api/auth/register/route.ts:15-17`

The response `"Email already in use"` with status 409 reveals whether an email is registered.

**Fix:** Return a generic message regardless:
```ts
// Option A: Always return 201 with a generic message
return NextResponse.json({ message: "If this email is available, an account has been created." }, { status: 201 });

// Option B: Keep 409 but use a vague message
return NextResponse.json({ error: "Registration failed" }, { status: 400 });
```

---

### 7. Dockerfile runs as root

**File:** `Dockerfile:14-24`

The `runner` stage has no `USER` directive. The container process runs as root, which is a container security anti-pattern.

**Fix:** Add a non-root user in the runner stage:
```dockerfile
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

RUN adduser --system --uid 1001 nextjs
# ... COPY statements ...
USER nextjs

EXPOSE 3000
CMD ["bun", "server.js"]
```

---

### 8. Unhandled `req.json()` errors

**Files:**
- `src/app/api/urls/route.ts:39`
- `src/app/api/urls/[id]/route.ts:38`
- `src/app/api/auth/register/route.ts:7`

If a client sends malformed JSON (or no body), `req.json()` throws an unhandled exception resulting in a 500 error with a stack trace.

**Fix:** Wrap in try/catch:
```ts
let body;
try {
  body = await req.json();
} catch {
  return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
}
```

---

## High Priority Best Practices

### 9. Unused and misplaced dependencies

**File:** `package.json`

| Package | Issue |
|---|---|
| `@prisma/adapter-mssql` | Not used (project uses MariaDB) - remove |
| `@types/mssql` | Not used - remove from devDependencies |
| `dotenv` | Not needed (Next.js handles `.env` natively) - remove |
| `prisma` | CLI tool, should be in `devDependencies` not `dependencies` |

---

### 10. Unsafe NextAuth type casting

**File:** `src/lib/auth.ts:35,41`

The code uses unsafe type assertions like `(user as { role?: string }).role` instead of properly extending NextAuth types.

**Fix:** Create `src/types/next-auth.d.ts`:
```ts
import "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
  }
  interface Session {
    user: User & { id: string; role: string };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}
```

Then remove the type assertions in `auth.ts`:
```ts
jwt({ token, user }) {
  if (user) {
    token.id = user.id;
    token.role = user.role ?? "user";
  }
  return token;
},
session({ session, token }) {
  session.user.id = token.id;
  session.user.role = token.role;
  return session;
},
```

---

### 11. Fragile short code collision handling

**File:** `src/app/api/urls/route.ts:48-55`

When an auto-generated `nanoid(7)` collides, the code retries exactly once. That second attempt could also collide (unlikely but possible under load).

**Fix:** Use a retry loop:
```ts
let shortCode = parsed.data.shortCode;
if (!shortCode) {
  for (let i = 0; i < 5; i++) {
    shortCode = nanoid(7);
    const exists = await prisma.url.findUnique({ where: { shortCode } });
    if (!exists) break;
    if (i === 4) return NextResponse.json({ error: "Failed to generate unique code" }, { status: 503 });
  }
} else {
  const exists = await prisma.url.findUnique({ where: { shortCode } });
  if (exists) return NextResponse.json({ error: "Short code already taken" }, { status: 409 });
}
```

---

### 12. Raw SQL with hardcoded table name

**File:** `src/app/api/urls/[id]/stats/route.ts:15-24`

The raw SQL query uses the literal table name `` `shorturl-click` ``. If the Prisma `@@map` value changes, this query silently breaks.

**Fix:** Use Prisma's `groupBy` API instead of raw SQL:
```ts
const rows = await prisma.click.groupBy({
  by: ["clickedAt"],
  where: {
    urlId: id,
    clickedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
  },
  _count: true,
});
```

Or if you must use raw SQL, add a comment referencing the `@@map("shorturl-click")` in the schema so it's easy to find when renaming.

---

### 13. Unused state variable

**File:** `src/app/(auth)/register/page.tsx:11`

The `mounted` state is set to `true` in `useEffect` but never read anywhere. Dead code.

**Fix:** Remove `const [mounted, setMounted] = useState(false);` and `setMounted(true);`.

---

## Low Priority Best Practices

### 14. Commented-out old schema

**File:** `prisma/schema.prisma:1-50`

~50 lines of commented-out MSSQL schema remain. This clutters the file. Git history preserves old versions.

**Fix:** Delete lines 1-50 (the commented-out block).

---

### 15. Inconsistent CSS gradient class

**Files:**
- `src/app/(auth)/login/page.tsx:45` uses `bg-linear-to-br`
- `src/app/(auth)/register/page.tsx:57` uses `bg-gradient-to-br`

Both work, but it's inconsistent. In Tailwind v4, `bg-linear-to-br` is the canonical form.

**Fix:** Use `bg-linear-to-br` in both files.

---

### 16. Duplicated `Url` interface

**Files:**
- `src/components/dashboard/UrlList.tsx:8-17`
- `src/components/dashboard/EditUrlModal.tsx:5-10`

Both define their own `Url` interface with overlapping fields.

**Fix:** Create `src/types/url.ts` with a shared interface and import it in both components.
