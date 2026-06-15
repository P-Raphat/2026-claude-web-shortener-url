"use client";

import { useState } from "react";
import { createUrlSchema } from "@/lib/validations";

interface Props {
  onCreated: () => void;
}

const fieldCls =
  "w-full bg-canvas border border-edge rounded px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-ghost focus:outline-none focus:border-gold transition-colors";

const spinnerlessCls =
  "text-sm text-ink placeholder:text-ink-ghost text-center focus:outline-none bg-transparent [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

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
    <form onSubmit={handleSubmit} className="bg-surface border border-edge rounded-lg p-6 space-y-5">
      <h2 className="font-display text-sm font-semibold text-ink uppercase tracking-widest">
        Shorten a URL
      </h2>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-ink-lo uppercase tracking-widest">
          Long URL <span className="text-gold">*</span>
        </label>
        <input
          name="originalUrl"
          type="url"
          required
          placeholder="https://example.com/very/long/url"
          className={fieldCls}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-ink-lo uppercase tracking-widest">
            Custom code
          </label>
          <input name="shortCode" type="text" placeholder="my-link (optional)" className={fieldCls} />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-ink-lo uppercase tracking-widest">
            Title
          </label>
          <input name="title" type="text" placeholder="Optional" className={fieldCls} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-ink-lo uppercase tracking-widest">
          Expires at
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-1 bg-canvas border border-edge rounded px-3 py-2.5 focus-within:border-gold transition-colors">
            <input
              type="number" min="1" max="31"
              placeholder="DD"
              value={expiresDay}
              onChange={(e) => setExpiresDay(e.target.value)}
              className={`w-8 ${spinnerlessCls}`}
            />
            <span className="text-ink-ghost select-none">/</span>
            <input
              type="number" min="1" max="12"
              placeholder="MM"
              value={expiresMonth}
              onChange={(e) => setExpiresMonth(e.target.value)}
              className={`w-8 ${spinnerlessCls}`}
            />
            <span className="text-ink-ghost select-none">/</span>
            <input
              type="number" min="2025" max="2099"
              placeholder="YYYY"
              value={expiresYear}
              onChange={(e) => setExpiresYear(e.target.value)}
              className={`w-14 ${spinnerlessCls}`}
            />
          </div>
          <input
            type="time"
            value={expiresTime}
            onChange={(e) => setExpiresTime(e.target.value)}
            disabled={!expiresDay || !expiresMonth || !expiresYear}
            className={`${fieldCls} disabled:opacity-30 disabled:cursor-not-allowed`}
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-danger bg-danger-dim rounded px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-gold text-gold-fg font-semibold text-sm px-5 py-2.5 rounded hover:opacity-90 disabled:opacity-40 transition-opacity"
      >
        {loading ? "Shortening…" : "Shorten →"}
      </button>
    </form>
  );
}
