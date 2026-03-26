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
    <div className="min-h-screen bg-linear-to-br from-slate-900 to-slate-800">
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">URL Shortener</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-300">{user.name ?? user.email}</span>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-sm text-red-400 hover:text-red-300 transition-colors">
            Sign out
          </button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <CreateUrlForm onCreated={() => setRefreshKey((k) => k + 1)} />
        <UrlList refreshKey={refreshKey} />
      </main>
    </div>
  );
}
