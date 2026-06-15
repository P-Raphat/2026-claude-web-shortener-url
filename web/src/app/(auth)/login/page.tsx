"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { loginSchema } from "@/lib/validations";

const fieldCls =
  "w-full bg-canvas border border-edge rounded px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-ghost focus:outline-none focus:border-gold transition-colors";

export default function LoginPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user) router.push("/dashboard");
  }, [session, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const data = {
      email: fd.get("email") as string,
      password: fd.get("password") as string,
    };
    const parsed = loginSchema.safeParse(data);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      setLoading(false);
      return;
    }
    const res = await signIn("credentials", { ...parsed.data, redirect: false });
    if (res?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/dashboard");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-canvas flex">
      {/* Brand panel — desktop only */}
      <aside className="hidden lg:flex w-[44%] border-r border-edge flex-col justify-between p-14">
        <span className="font-display text-xl font-semibold text-ink tracking-tight">
          URL Shortener
        </span>
        <div>
          <p className="font-display text-5xl font-semibold text-ink leading-[1.1] tracking-tight">
            Make every<br />link count.
          </p>
          <p className="mt-5 text-ink-lo text-sm leading-relaxed max-w-[36ch]">
            Shorten, track, and manage your links — all from one place.
          </p>
        </div>
        <p className="text-ink-ghost text-xs">© 2026</p>
      </aside>

      {/* Form panel */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[360px]">
          <span className="lg:hidden block font-display text-xl font-semibold text-ink mb-10">
            URL Shortener
          </span>

          <h1 className="font-display text-2xl font-semibold text-ink mb-1">Sign in</h1>
          <p className="text-ink-lo text-sm mb-8">Welcome back</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink-lo uppercase tracking-widest">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className={fieldCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink-lo uppercase tracking-widest">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className={fieldCls}
              />
            </div>

            {error && (
              <p className="text-sm text-danger bg-danger-dim rounded px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold text-gold-fg font-semibold text-sm py-2.5 rounded hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              {loading ? "Signing in…" : "Sign in →"}
            </button>
          </form>

          <p className="mt-6 text-sm text-ink-ghost">
            No account?{" "}
            <a
              href="/register"
              className="text-ink-lo hover:text-ink transition-colors underline underline-offset-2"
            >
              Register
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
