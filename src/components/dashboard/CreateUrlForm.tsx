"use client";

import { useState } from "react";
import { createUrlSchema } from "@/lib/validations";

interface Props {
  onCreated: () => void;
}

const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

export function CreateUrlForm({ onCreated }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expiresDay, setExpiresDay] = useState("");
  const [expiresMonth, setExpiresMonth] = useState("");
  const [expiresYear, setExpiresYear] = useState("");
  const [expiresTime, setExpiresTime] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);

    let expiresAt: string | undefined;
    if (expiresDay && expiresMonth && expiresYear) {
      const dateStr = `${expiresYear}-${expiresMonth.padStart(2, "0")}-${expiresDay.padStart(2, "0")}`;
      expiresAt = new Date(`${dateStr}T${expiresTime || "00:00"}:00`).toISOString();
    }

    const data = {
      originalUrl: fd.get("originalUrl") as string,
      shortCode: (fd.get("shortCode") as string) || undefined,
      title: (fd.get("title") as string) || undefined,
      expiresAt,
    };

    const parsed = createUrlSchema.safeParse(data);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      setLoading(false);
      return;
    }

    const res = await fetch("/api/urls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    if (res.ok) {
      (e.target as HTMLFormElement).reset();
      setExpiresDay("");
      setExpiresMonth("");
      setExpiresYear("");
      setExpiresTime("");
      onCreated();
    } else {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Failed to create URL");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
      <h2 className="font-bold text-lg text-gray-900">Shorten a URL</h2>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Long URL *</label>
        <input name="originalUrl" type="url" required placeholder="https://example.com/very/long/url" className={inputCls} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Custom code (optional)</label>
          <input name="shortCode" type="text" placeholder="my-link" className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title (optional)</label>
          <input name="title" type="text" placeholder="My link" className={inputCls} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Expires at (optional)</label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="block text-xs text-gray-400 mb-1">Date (DD/MM/YYYY)</span>
            <div className="flex items-center gap-1 border border-gray-300 rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
              <input
                type="number" min="1" max="31"
                placeholder="DD"
                value={expiresDay}
                onChange={(e) => setExpiresDay(e.target.value)}
                className="w-8 text-sm text-gray-900 placeholder-gray-400 text-center focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <span className="text-gray-400 select-none">/</span>
              <input
                type="number" min="1" max="12"
                placeholder="MM"
                value={expiresMonth}
                onChange={(e) => setExpiresMonth(e.target.value)}
                className="w-8 text-sm text-gray-900 placeholder-gray-400 text-center focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <span className="text-gray-400 select-none">/</span>
              <input
                type="number" min="2025" max="2099"
                placeholder="YYYY"
                value={expiresYear}
                onChange={(e) => setExpiresYear(e.target.value)}
                className="w-14 text-sm text-gray-900 placeholder-gray-400 text-center focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>
          </div>
          <div>
            <span className="block text-xs text-gray-400 mb-1">Time (HH:MM)</span>
            <input
              type="time"
              value={expiresTime}
              onChange={(e) => setExpiresTime(e.target.value)}
              disabled={!expiresDay || !expiresMonth || !expiresYear}
              className={`${inputCls} disabled:opacity-40 disabled:cursor-not-allowed`}
            />
          </div>
        </div>
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
      <button type="submit" disabled={loading} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold text-sm transition-colors">
        {loading ? "Shortening…" : "Shorten URL"}
      </button>
    </form>
  );
}
