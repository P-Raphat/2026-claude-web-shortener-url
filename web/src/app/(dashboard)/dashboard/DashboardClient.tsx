"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { CreateUrlForm } from "@/components/dashboard/CreateUrlForm";
import { UrlList } from "@/components/dashboard/UrlList";

interface Props {
  user: { name: string | null; email: string };
}

export function DashboardClient({ user }: Props) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-edge px-6 py-4 flex items-center justify-between">
        <span className="font-display text-base font-semibold text-ink tracking-tight">
          URL Shortener
        </span>
        <div className="flex items-center gap-6">
          <span className="text-xs text-ink-ghost hidden sm:block">{user.name ?? user.email}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-xs text-ink-lo hover:text-ink transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <CreateUrlForm onCreated={() => setRefreshKey((k) => k + 1)} />
        <UrlList refreshKey={refreshKey} />
      </main>
    </div>
  );
}
