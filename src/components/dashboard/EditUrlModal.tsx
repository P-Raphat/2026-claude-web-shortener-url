"use client";

import { useState } from "react";

interface Url {
  id: string;
  title: string | null;
  isActive: boolean;
  expiresAt: string | null;
}

interface Props {
  url: Url;
  onClose: () => void;
  onSaved: () => void;
}

const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const numCls = "text-sm text-gray-900 placeholder-gray-400 text-center focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

function parseExpiry(iso: string | null) {
  if (!iso) return { day: "", month: "", year: "", time: "" };
  const d = new Date(iso);
  return {
    day: String(d.getDate()),
    month: String(d.getMonth() + 1),
    year: String(d.getFullYear()),
    time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
  };
}

export function EditUrlModal({ url, onClose, onSaved }: Props) {
  const initial = parseExpiry(url.expiresAt);
  const [title, setTitle] = useState(url.title ?? "");
  const [isActive, setIsActive] = useState(url.isActive);
  const [expiresDay, setExpiresDay] = useState(initial.day);
  const [expiresMonth, setExpiresMonth] = useState(initial.month);
  const [expiresYear, setExpiresYear] = useState(initial.year);
  const [expiresTime, setExpiresTime] = useState(initial.time);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hasDate = expiresDay && expiresMonth && expiresYear;

  function clearExpiry() {
    setExpiresDay("");
    setExpiresMonth("");
    setExpiresYear("");
    setExpiresTime("");
  }

  async function handleSave() {
    setError("");
    setLoading(true);

    let expiresAt: string | null;
    if (hasDate) {
      const dateStr = `${expiresYear}-${expiresMonth.padStart(2, "0")}-${expiresDay.padStart(2, "0")}`;
      expiresAt = new Date(`${dateStr}T${expiresTime || "00:00"}:00`).toISOString();
    } else {
      expiresAt = null;
    }

    const res = await fetch(`/api/urls/${url.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title || null, isActive, expiresAt }),
    });

    if (res.ok) {
      onSaved();
      onClose();
    } else {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Failed to save");
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Edit link</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none">✕</button>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My link"
            className={inputCls}
          />
        </div>

        {/* Active toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Active</span>
          <button
            type="button"
            onClick={() => setIsActive((v) => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors ${isActive ? "bg-blue-600" : "bg-gray-300"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isActive ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>

        {/* Expiry date */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-semibold text-gray-700">Expires at</label>
            {hasDate && (
              <button type="button" onClick={clearExpiry} className="text-xs text-red-500 hover:text-red-600 transition-colors">
                Clear expiry
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="block text-xs text-gray-400 mb-1">Date (DD/MM/YYYY)</span>
              <div className="flex items-center gap-1 border border-gray-300 rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                <input type="number" min="1" max="31" placeholder="DD" value={expiresDay} onChange={(e) => setExpiresDay(e.target.value)} className={`w-8 ${numCls}`} />
                <span className="text-gray-400 select-none">/</span>
                <input type="number" min="1" max="12" placeholder="MM" value={expiresMonth} onChange={(e) => setExpiresMonth(e.target.value)} className={`w-8 ${numCls}`} />
                <span className="text-gray-400 select-none">/</span>
                <input type="number" min="2025" max="2099" placeholder="YYYY" value={expiresYear} onChange={(e) => setExpiresYear(e.target.value)} className={`w-14 ${numCls}`} />
              </div>
            </div>
            <div>
              <span className="block text-xs text-gray-400 mb-1">Time (HH:MM)</span>
              <input
                type="time"
                value={expiresTime}
                onChange={(e) => setExpiresTime(e.target.value)}
                disabled={!hasDate}
                className={`${inputCls} disabled:opacity-40 disabled:cursor-not-allowed`}
              />
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 font-semibold text-sm transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={loading} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold text-sm transition-colors">
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
